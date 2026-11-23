const {
  CodingQuestion,
  CodingTestCase,
  CodingSubmission,
  ExecutionResult,
  Subject
} = require('../models');
const { executeCode } = require('../services/codeExecutionService');
const { logAudit } = require('../middleware/auth');
const { SUPPORTED_LANGUAGES } = require('../config/languages');

// Get available programming languages (directly code-configured)
const getLanguages = async (req, res) => {
  res.status(200).json({ success: true, languages: SUPPORTED_LANGUAGES });
};

// Get coding questions by subject and topic
const getQuestions = async (req, res) => {
  try {
    const { subjectId, difficulty, language } = req.query;
    const query = {};
    if (subjectId) query.subjectId = subjectId;
    if (difficulty) query.difficulty = difficulty;
    if (language) query.programmingLanguage = language.toLowerCase();

    const questions = await CodingQuestion.find(query)
      .populate('subjectId', 'subjectName subjectCode')
      .sort({ difficulty: 1, topic: 1 });

    res.status(200).json({ success: true, questions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new coding question with optional initial test cases (Faculty or HOD)
const createQuestion = async (req, res) => {
  try {
    const {
      title,
      subjectId,
      topic,
      description,
      syntax,
      difficulty,
      programmingLanguage,
      exampleProgram,
      sampleInput,
      sampleOutput,
      hints,
      testCases
    } = req.body;

    if (!title || !subjectId || !topic || !description || !programmingLanguage) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, subjectId, topic, description, programmingLanguage'
      });
    }

    const question = await CodingQuestion.create({
      title,
      subjectId,
      topic,
      description,
      syntax,
      difficulty: difficulty || 'Easy',
      programmingLanguage: programmingLanguage.toLowerCase(),
      exampleProgram: exampleProgram || '',
      sampleInput: sampleInput || '',
      sampleOutput: sampleOutput || '',
      hints: hints || [],
      createdBy: req.user._id
    });

    // If test cases provided, insert them
    if (testCases && Array.isArray(testCases) && testCases.length > 0) {
      const tcDocs = testCases.map(tc => ({
        questionId: question._id,
        input: tc.input || '',
        expectedOutput: tc.expectedOutput || '',
        isHidden: !!tc.isHidden,
        explanation: tc.explanation || ''
      }));
      await CodingTestCase.insertMany(tcDocs);
    }

    await logAudit(req, 'CREATE_CODING_QUESTION', 'coding_questions', question._id, {
      title,
      programmingLanguage,
      difficulty
    });

    res.status(201).json({
      success: true,
      message: 'Coding question created successfully',
      question
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get detailed question by ID (with public test cases and hints)
const getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await CodingQuestion.findById(id).populate('subjectId');
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });

    // Fetch visible test cases
    const testCases = await CodingTestCase.find({ questionId: id, isHidden: false });

    res.status(200).json({
      success: true,
      question,
      testCases
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Interactive "Run" code with custom input
const runCode = async (req, res) => {
  try {
    const { language, code, customInput } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Code cannot be empty' });
    }

    const result = await executeCode({
      language: language || 'python',
      code,
      input: customInput || ''
    });

    // Record Execution Result
    await ExecutionResult.create({
      studentId: req.user._id,
      language: language || 'python',
      sourceCode: code,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      executionTimeMs: result.executionTimeMs,
      passed: result.passed
    });

    res.status(200).json({
      success: true,
      result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// "Submit" code against all test cases for a question
const submitCode = async (req, res) => {
  try {
    const { questionId, language, code } = req.body;

    if (!questionId || !code) {
      return res.status(400).json({ success: false, message: 'questionId and code are required' });
    }

    const question = await CodingQuestion.findById(questionId);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });

    const allTestCases = await CodingTestCase.find({ questionId });

    let passedCount = 0;
    const testCaseResults = [];
    let totalTime = 0;
    let finalStatus = 'Accepted';
    let compilerOutput = '';

    for (let i = 0; i < allTestCases.length; i++) {
      const tc = allTestCases[i];
      const runRes = await executeCode({
        language: language || question.programmingLanguage,
        code,
        input: tc.input || ''
      });

      totalTime += runRes.executionTimeMs;

      const normalize = (str) => (str || '').trim().replace(/\r\n/g, '\n');
      const actualOut = normalize(runRes.stdout);
      const expectedOut = normalize(tc.expectedOutput);

      const passed = runRes.exitCode === 0 && actualOut === expectedOut;
      if (passed) {
        passedCount++;
      } else {
        if (runRes.status === 'Time Limit Exceeded') {
          finalStatus = 'Time Limit Exceeded';
        } else if (runRes.stderr) {
          finalStatus = 'Runtime Error';
          compilerOutput = runRes.stderr;
        } else {
          finalStatus = 'Wrong Answer';
        }
      }

      testCaseResults.push({
        testCaseIndex: i + 1,
        input: tc.isHidden ? '[Hidden Test Case]' : tc.input,
        expectedOutput: tc.isHidden ? '[Hidden]' : tc.expectedOutput,
        actualOutput: tc.isHidden ? (passed ? '[Passed]' : '[Failed]') : runRes.stdout,
        passed,
        executionTimeMs: runRes.executionTimeMs
      });
    }

    if (allTestCases.length === 0) {
      // If no test cases configured, run with sample input
      const runRes = await executeCode({
        language: language || question.programmingLanguage,
        code,
        input: question.sampleInput || ''
      });
      finalStatus = runRes.passed ? 'Accepted' : 'Runtime Error';
      compilerOutput = runRes.stderr;
      passedCount = runRes.passed ? 1 : 0;
    }

    // Create CodingSubmission
    const submission = await CodingSubmission.create({
      questionId,
      studentId: req.user._id,
      programmingLanguage: language || question.programmingLanguage,
      submittedCode: code,
      status: finalStatus,
      totalTestCases: allTestCases.length || 1,
      passedTestCases: passedCount,
      executionTimeMs: totalTime,
      compilerOutput
    });

    await logAudit(req, 'CODE_SUBMIT', 'coding_submissions', submission._id, {
      questionTitle: question.title,
      status: finalStatus,
      passed: passedCount
    });

    res.status(200).json({
      success: true,
      submission,
      testCaseResults
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// AI Coding Assistant (explains syntax errors, logic flaws, hints)
const askAiCodingHelp = async (req, res) => {
  try {
    const { code, errorMessage, questionTitle, language } = req.body;
    const lang = (language || 'python').toLowerCase();

    let advice = '';

    if (errorMessage) {
      if (lang === 'python') {
        if (errorMessage.includes('IndentationError')) {
          advice = `Python Indentation Issue:\nIn Python, code blocks under loops, functions, and conditional statements require uniform indentation (typically 4 spaces). Ensure you do not mix tabs and spaces.`;
        } else if (errorMessage.includes('NameError')) {
          advice = `Python Name Error:\nA variable or function name is referenced before being defined or imported. Verify spelling, scope, and import statements.`;
        } else if (errorMessage.includes('SyntaxError')) {
          advice = `Python Syntax Error:\nCheck for missing colons (:) at the end of if/for/def lines, unclosed parentheses or quotes, or invalid expressions.`;
        } else if (errorMessage.includes('IndexError')) {
          advice = `Python Index Out of Range:\nYou are trying to access a list element outside its bounds. Verify indices against len(list) and check loop boundary values.`;
        } else if (errorMessage.includes('TypeError')) {
          advice = `Python Type Error:\nAn operation was performed on incompatible data types (e.g. concatenating str and int). Use explicit type casting like str() or int().`;
        } else {
          advice = `Python Diagnostic:\n${errorMessage}\n\nHint: Review standard input parsing and data types.`;
        }
      } else if (lang === 'c' || lang === 'cpp') {
        if (errorMessage.includes('C2065') || errorMessage.includes('undeclared identifier')) {
          advice = `C/C++ Undeclared Identifier:\nA variable, function, or namespace is being used without declaration. Ensure you include required headers (e.g., <stdio.h>, <iostream>) and declare variables before use. If using C++, check 'using namespace std;'.`;
        } else if (errorMessage.includes('C2143') || errorMessage.includes('expected') || errorMessage.includes('missing')) {
          advice = `C/C++ Syntax / Semicolon Error:\nA statement is missing a closing semicolon ';', curly brace '}', or parenthesis. Check the line immediately preceding the reported error location.`;
        } else if (errorMessage.includes('LNK2019') || errorMessage.includes('unresolved external')) {
          advice = `C/C++ Linker Issue:\nA referenced function was declared but not implemented or linked. Ensure your 'main()' function has the signature 'int main()' or 'int main(int argc, char* argv[])'.`;
        } else {
          advice = `C/C++ Diagnostic:\n${errorMessage}\n\nHint: Verify header inclusions, memory allocation, and array bounds.`;
        }
      } else if (lang === 'java') {
        if (errorMessage.includes('cannot find symbol')) {
          advice = `Java Symbol Resolution Error:\nThe compiler cannot locate a variable, method, or class. Ensure required packages are imported (e.g., 'import java.util.Scanner;'), variable names are spelled identically, and methods exist.`;
        } else if (errorMessage.includes('class') && errorMessage.includes('should be declared in a file named')) {
          advice = `Java Class Naming Rule:\nA public class named 'X' must match the filename. In our single-file execution sandbox, either define 'public class Main' or use a non-public class.`;
        } else if (errorMessage.includes('NoSuchElementException')) {
          advice = `Java Input Stream Notice:\nScanner or BufferedReader reached EOF without receiving expected tokens. Provide adequate custom input in the input panel.`;
        } else {
          advice = `Java Diagnostic:\n${errorMessage}\n\nHint: Ensure public static void main(String[] args) is present and imports are complete.`;
        }
      } else if (lang === 'sql') {
        if (errorMessage.includes('no such table')) {
          advice = `SQL Table Not Found:\nYou are querying a table that does not exist in memory. Remember that in the practice sandbox, you should first execute CREATE TABLE and INSERT statements before querying.`;
        } else if (errorMessage.includes('syntax error')) {
          advice = `SQL Syntax Error:\nCheck clause order: SELECT -> FROM -> WHERE -> GROUP BY -> HAVING -> ORDER BY. Also ensure strings are enclosed in single quotes and statements end with semicolons (;).`;
        } else {
          advice = `SQL Diagnostic:\n${errorMessage}\n\nHint: Verify table column names and comma separation between column lists.`;
        }
      } else {
        advice = `Execution Diagnostic (${language}):\n${errorMessage}\n\nHint: Check syntax, data types, and input stream formatting.`;
      }
    } else {
      if (questionTitle) {
        advice = `AI Logic Guidance for "${questionTitle}":\n1. Analyze input format and identify edge cases (e.g. empty inputs, zero, maximum boundaries).\n2. Plan your algorithm step-by-step before writing code.\n3. Verify your print/output statements match the requested format exactly.`;
      } else {
        const langTips = {
          python: `Python Practice Tips:\n• Use input().split() or map(int, input().split()) for space-separated input.\n• Use list comprehensions for clean, fast transformations.\n• Print outputs cleanly using f-strings: f"{val}".`,
          c: `C Programming Practice Tips:\n• Remember to include <stdio.h> and <stdlib.h>.\n• Use scanf("%d", &val) and always check its return value.\n• End programs with 'return 0;'.`,
          cpp: `C++ Practice Tips:\n• Include <iostream> and <vector>.\n• Use 'cin >> var' for input and 'cout << var << "\\n"' for output.\n• Use 'cin.tie(NULL); ios_base::sync_with_stdio(false);' for high-performance I/O.`,
          java: `Java Practice Tips:\n• Use 'public class Main' with 'public static void main(String[] args)'.\n• Import 'java.util.Scanner' or 'java.io.BufferedReader' for reading inputs.\n• Print outputs with System.out.println().`,
          sql: `SQL Practice Tips:\n• Build tables with CREATE TABLE and populate with INSERT INTO.\n• Write SELECT statements with appropriate WHERE, GROUP BY, and ORDER BY clauses.\n• Terminate each query statement with a semicolon (;).`
        };
        advice = langTips[lang] || `Independent Practice Tips:\n1. Formulate test inputs in the Custom Input panel.\n2. Write your solution modularly.\n3. Run your program to inspect real-time execution results.`;
      }
    }

    res.status(200).json({
      success: true,
      advice
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get past submissions for the current student
const getMySubmissions = async (req, res) => {
  try {
    const { questionId } = req.query;
    const query = { studentId: req.user._id };
    if (questionId) query.questionId = questionId;

    const submissions = await CodingSubmission.find(query)
      .populate('questionId', 'title difficulty topic')
      .sort({ submittedAt: -1 });

    res.status(200).json({
      success: true,
      submissions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getLanguages,
  getQuestions,
  createQuestion,
  getQuestionById,
  runCode,
  submitCode,
  askAiCodingHelp,
  getMySubmissions
};
