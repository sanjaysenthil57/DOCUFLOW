import React, { useState, useEffect } from 'react';
import { codingApi } from '../services/api';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  EmptyState
} from '../components/ui';
import {
  Code2,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Terminal,
  FileCode,
  ArrowRight,
  RotateCcw,
  Trash2,
  Copy,
  Check,
  BookOpen,
  Cpu,
  Layers,
  Database
} from 'lucide-react';

// Starter templates for each supported language
const STARTER_TEMPLATES = {
  python: `# DocuFlow AI - Independent Python Practice
# Read from standard input and write to standard output

def main():
    print("Hello from Python 3! Welcome to DocuFlow AI Coding Sandbox.")
    # Example reading input:
    # try:
    #     user_input = input()
    #     print(f"Received input: {user_input}")
    # except EOFError:
    #     pass

if __name__ == "__main__":
    main()
`,
  c: `// DocuFlow AI - Independent C Practice
#include <stdio.h>

int main() {
    printf("Hello from C in DocuFlow AI Coding Sandbox!\\n");
    
    // Example reading input:
    // int n;
    // if (scanf("%d", &n) == 1) {
    //     printf("Value read: %d\\n", n);
    // }
    
    return 0;
}
`,
  cpp: `// DocuFlow AI - Independent C++ Practice
#include <iostream>
#include <vector>
#include <string>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    cout << "Hello from C++ 17 in DocuFlow AI Coding Sandbox!" << endl;

    // Example reading input:
    // string name;
    // if (cin >> name) {
    //     cout << "Welcome, " << name << "!" << endl;
    // }

    return 0;
}
`,
  java: `// DocuFlow AI - Independent Java Practice
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java 25 in DocuFlow AI Coding Sandbox!");

        // Example reading input:
        // Scanner scanner = new Scanner(System.in);
        // if (scanner.hasNext()) {
        //     String input = scanner.next();
        //     System.out.println("Input token: " + input);
        // }
    }
}
`,
  javascript: `// DocuFlow AI - Independent JavaScript Practice
function main() {
    console.log("Hello from JavaScript (Node.js) in DocuFlow AI Coding Sandbox!");
}
main();
`,
  typescript: `// DocuFlow AI - Independent TypeScript Practice
interface CourseModule {
    code: string;
    credits: number;
}

const mca: CourseModule = { code: "26MCT21", credits: 4 };
console.log("Hello from TypeScript in DocuFlow AI Sandbox:", mca);
`,
  sql: `-- DocuFlow AI - Independent SQL Practice
-- Build schema, insert records, and query in memory

CREATE TABLE courses (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    credits INT NOT NULL
);

INSERT INTO courses VALUES ('26MCT11', 'Mathematical Foundations of Computer Science', 4);
INSERT INTO courses VALUES ('26MCT12', 'Advanced Data Structures and Algorithms', 4);
INSERT INTO courses VALUES ('26MCT14', 'Network Communication Techniques', 3);
INSERT INTO courses VALUES ('26MCT15', 'Full Stack Web Development', 4);

SELECT code, name, credits 
FROM courses 
WHERE credits >= 4
ORDER BY code ASC;
`,
  html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>DocuFlow AI HTML5 Practice</title>
</head>
<body>
    <h1>DocuFlow AI Academic Web Sandbox</h1>
    <p>Welcome to MCA Web Technologies & Frontend Engineering.</p>
</body>
</html>
`,
  css: `/* DocuFlow AI - CSS3 Practice */
:root {
    --primary: #2563eb;
    --background: #0f172a;
}

body {
    font-family: system-ui, -apple-system, sans-serif;
    background-color: var(--background);
    color: #ffffff;
    margin: 0;
    padding: 2rem;
}
`,
  php: `<?php
// DocuFlow AI - Independent PHP Practice
echo "Hello from PHP 8.2 in DocuFlow AI Coding Sandbox!\\n";
`,
  r: `# DocuFlow AI - Independent R Practice
scores <- c(88, 92, 79, 95, 84)
cat("Academic Mean Score:", mean(scores), "\\n")
`,
  go: `// DocuFlow AI - Independent Go Practice
package main

import "fmt"

func main() {
    fmt.Println("Hello from Go (Golang) in DocuFlow AI Cloud Sandbox!")
}
`,
  rust: `// DocuFlow AI - Independent Rust Practice
fn main() {
    println!("Hello from Rust in DocuFlow AI Systems Sandbox!");
}
`,
  kotlin: `// DocuFlow AI - Independent Kotlin Practice
fun main() {
    println("Hello from Kotlin in DocuFlow AI Mobile Sandbox!")
}
`,
  swift: `// DocuFlow AI - Independent Swift Practice
import Foundation
print("Hello from Swift in DocuFlow AI Native Sandbox!")
`,
  csharp: `// DocuFlow AI - Independent C# Practice
using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello from C# .NET 8 in DocuFlow AI Sandbox!");
    }
}
`,
  ruby: `# DocuFlow AI - Independent Ruby Practice
puts "Hello from Ruby in DocuFlow AI Scripting Sandbox!"
`,
  dart: `// DocuFlow AI - Independent Dart Practice
void main() {
  print('Hello from Dart in DocuFlow AI Sandbox!');
}
`,
  matlab: `% DocuFlow AI - Independent MATLAB / Octave Practice
A = [1, 2; 3, 4];
disp('Matrix Determinant:');
disp(det(A));
`,
  scala: `// DocuFlow AI - Independent Scala Practice
@main def main(): Unit = {
  println("Hello from Scala 3 in DocuFlow AI Big Data Sandbox!")
}
`,
  bash: `#!/usr/bin/env bash
# DocuFlow AI - Independent Bash Shell Practice
echo "Hello from Bash Shell in DocuFlow AI DevOps Sandbox!"
`,
  assembly: `; DocuFlow AI - Independent x86_64 NASM Assembly
section .data
    msg db "Hello from x86_64 Assembly in DocuFlow AI!", 0xA
    len equ $ - msg

section .text
    global _start
_start:
    mov rax, 60
    xor rdi, rdi
    syscall
`
};

const SUPPORTED_LANGUAGES = [
  { id: 'python', name: 'Python 3', ext: 'py', file: 'main.py', badge: 'Python 3.10', icon: '🐍' },
  { id: 'c', name: 'C', ext: 'c', file: 'main.c', badge: 'C11 / MSVC', icon: '⚙️' },
  { id: 'cpp', name: 'C++ 17', ext: 'cpp', file: 'main.cpp', badge: 'C++17 / MSVC', icon: '⚡' },
  { id: 'java', name: 'Java 25', ext: 'java', file: 'Main.java', badge: 'JDK 25 LTS', icon: '☕' },
  { id: 'javascript', name: 'JavaScript', ext: 'js', file: 'main.js', badge: 'Node.js 20', icon: '🟨' },
  { id: 'typescript', name: 'TypeScript', ext: 'ts', file: 'main.ts', badge: 'TS 5.0', icon: '🔷' },
  { id: 'sql', name: 'SQL', ext: 'sql', file: 'query.sql', badge: 'SQLite3 In-Memory', icon: '🗄️' },
  { id: 'html', name: 'HTML5', ext: 'html', file: 'index.html', badge: 'HTML5', icon: '🌐' },
  { id: 'css', name: 'CSS3', ext: 'css', file: 'styles.css', badge: 'CSS3', icon: '🎨' },
  { id: 'php', name: 'PHP', ext: 'php', file: 'index.php', badge: 'PHP 8.2', icon: '🐘' },
  { id: 'r', name: 'R', ext: 'r', file: 'script.R', badge: 'R 4.2', icon: '📊' },
  { id: 'go', name: 'Go (Golang)', ext: 'go', file: 'main.go', badge: 'Go 1.21', icon: '🐹' },
  { id: 'rust', name: 'Rust', ext: 'rs', file: 'main.rs', badge: 'Rust 1.72', icon: '🦀' },
  { id: 'kotlin', name: 'Kotlin', ext: 'kt', file: 'Main.kt', badge: 'Kotlin 1.9', icon: '📱' },
  { id: 'swift', name: 'Swift', ext: 'swift', file: 'main.swift', badge: 'Swift 5.9', icon: '🍎' },
  { id: 'csharp', name: 'C#', ext: 'cs', file: 'Program.cs', badge: '.NET 8', icon: '🎯' },
  { id: 'ruby', name: 'Ruby', ext: 'rb', file: 'main.rb', badge: 'Ruby 3.2', icon: '💎' },
  { id: 'dart', name: 'Dart', ext: 'dart', file: 'main.dart', badge: 'Dart 3.2', icon: '🎯' },
  { id: 'matlab', name: 'MATLAB / Octave', ext: 'm', file: 'main.m', badge: 'Octave', icon: '📐' },
  { id: 'scala', name: 'Scala 3', ext: 'scala', file: 'Main.scala', badge: 'Scala 3.3', icon: '🔴' },
  { id: 'bash', name: 'Bash Shell', ext: 'sh', file: 'script.sh', badge: 'Bash 5.2', icon: '💻' },
  { id: 'assembly', name: 'Assembly x86_64', ext: 'asm', file: 'main.asm', badge: 'NASM 2.15', icon: '🔧' }
];

export default function CodingPlatform() {
  // Navigation: 'practice' (default, independent) | 'assignments' (separate optional coursework)
  const [activeTab, setActiveTab] = useState('practice');
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('python');

  // Cache user code per language so switching preserves in-progress code
  const [codePerLanguage, setCodePerLanguage] = useState(() => {
    const initial = {};
    SUPPORTED_LANGUAGES.forEach(lang => {
      initial[lang.id] = STARTER_TEMPLATES[lang.id] || `// ${lang.name} Practice\n`;
    });
    return initial;
  });

  const [code, setCode] = useState(STARTER_TEMPLATES.python);
  const [customInput, setCustomInput] = useState('');
  const [output, setOutput] = useState(null);
  const [testCaseResults, setTestCaseResults] = useState([]);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiAdvice, setAiAdvice] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [copied, setCopied] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState('All');

  // Load available questions on mount
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const qRes = await codingApi.getQuestions();
        if (qRes.data.success) {
          setQuestions(qRes.data.questions || []);
        }
      } catch (e) {
        console.error('Failed to load coding questions', e);
      }
    };
    fetchQuestions();
  }, []);

  // Current active language config
  const currentLangConfig = SUPPORTED_LANGUAGES.find((l) => l.id === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  // Handle switching language
  const handleLanguageChange = (newLang) => {
    if (newLang === selectedLanguage) return;

    // Save current code to cache
    setCodePerLanguage((prev) => ({
      ...prev,
      [selectedLanguage]: code
    }));

    setSelectedLanguage(newLang);

    // If in practice mode, load cached code or starter template
    if (activeTab === 'practice') {
      const nextCode = codePerLanguage[newLang] || STARTER_TEMPLATES[newLang] || '';
      setCode(nextCode);
    } else if (selectedQuestion) {
      setCode(STARTER_TEMPLATES[newLang] || '');
    }

    setOutput(null);
    setAiAdvice('');
  };

  // Switch to Independent Practice
  const handleSwitchToPractice = () => {
    setActiveTab('practice');
    setSelectedQuestion(null);
    setCode(codePerLanguage[selectedLanguage] || STARTER_TEMPLATES[selectedLanguage]);
    setCustomInput('');
    setOutput(null);
    setTestCaseResults([]);
    setAiAdvice('');
  };

  // Select an assigned Faculty Question (in separate Assignments view)
  const handleSelectQuestion = async (q) => {
    setSelectedQuestion(q);
    const qLang = (q.programmingLanguage || 'python').toLowerCase();

    // Switch to question's language if supported
    const isSupported = SUPPORTED_LANGUAGES.some((l) => l.id === qLang);
    const targetLang = isSupported ? qLang : 'python';

    setSelectedLanguage(targetLang);
    setCode(q.exampleProgram || STARTER_TEMPLATES[targetLang] || '');
    setCustomInput(q.sampleInput || '');
    setOutput(null);
    setTestCaseResults([]);
    setAiAdvice('');

    // Fetch past submissions for this question
    try {
      const subRes = await codingApi.getMySubmissions({ questionId: q._id });
      if (subRes.data.success) {
        setSubmissions(subRes.data.submissions || []);
      }
    } catch (e) {}
  };

  // Reset editor to starter template
  const handleResetTemplate = () => {
    if (window.confirm(`Reset code editor to the default ${currentLangConfig.name} starter template?`)) {
      const template = STARTER_TEMPLATES[selectedLanguage] || '';
      setCode(template);
      setCodePerLanguage((prev) => ({
        ...prev,
        [selectedLanguage]: template
      }));
      setOutput(null);
      setAiAdvice('');
    }
  };

  // Clear code editor
  const handleClearCode = () => {
    if (window.confirm('Clear all code in the editor?')) {
      setCode('');
      setCodePerLanguage((prev) => ({
        ...prev,
        [selectedLanguage]: ''
      }));
    }
  };

  // Copy code to clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Run Code (Live execution for Independent Practice and problem testing)
  const handleRunCode = async () => {
    if (!code.trim()) {
      alert('Code editor cannot be empty. Please enter your code or reset to starter template.');
      return;
    }

    setRunning(true);
    setOutput(null);
    try {
      const res = await codingApi.runCode({
        language: selectedLanguage,
        code,
        customInput
      });
      if (res.data.success) {
        setOutput(res.data.result);
      }
    } catch (err) {
      setOutput({
        stdout: '',
        stderr: err.response?.data?.message || err.message || 'Execution error encountered.',
        exitCode: 1,
        executionTimeMs: 0,
        passed: false,
        status: 'Runtime Error'
      });
    } finally {
      setRunning(false);
    }
  };

  // Submit Solution (When working on Assigned Coursework)
  const handleSubmitSolution = async () => {
    if (!selectedQuestion) {
      alert('Submit Solution is for course assignments with verified test cases. Use "Run Code" for independent practice.');
      return;
    }

    if (!code.trim()) {
      alert('Please write code before submitting.');
      return;
    }

    setSubmitting(true);
    setTestCaseResults([]);
    try {
      const res = await codingApi.submitCode({
        questionId: selectedQuestion._id,
        language: selectedLanguage,
        code
      });
      if (res.data.success) {
        setTestCaseResults(res.data.testCaseResults || []);
        setOutput({
          stdout:
            res.data.submission.status === 'Accepted'
              ? 'All test cases passed successfully!'
              : `Some test cases failed (${res.data.submission.passedTestCases}/${res.data.submission.totalTestCases} passed).`,
          stderr: res.data.submission.compilerOutput || '',
          exitCode: res.data.submission.status === 'Accepted' ? 0 : 1,
          executionTimeMs: res.data.submission.executionTimeMs,
          passed: res.data.submission.status === 'Accepted',
          status: res.data.submission.status
        });
        const subRes = await codingApi.getMySubmissions({ questionId: selectedQuestion._id });
        if (subRes.data.success) setSubmissions(subRes.data.submissions || []);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Ask AI Assistant for diagnostic advice or problem guidance
  const handleAskAiHelp = async () => {
    setAiLoading(true);
    setAiAdvice('');
    try {
      const res = await codingApi.askAiHelp({
        code,
        errorMessage: output?.stderr || '',
        questionTitle: selectedQuestion?.title,
        language: selectedLanguage
      });
      if (res.data.success) {
        setAiAdvice(res.data.advice);
      }
    } catch (e) {
      setAiAdvice('Could not generate AI coding assistance at this time. Verify Ollama and the AI microservice are running.');
    } finally {
      setAiLoading(false);
    }
  };

  // Filter questions for the separate assignments section
  const filteredQuestions = questions.filter((q) => {
    if (difficultyFilter === 'All') return true;
    return q.difficulty === difficultyFilter;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & NAVIGATION */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60">
              Interactive Coding Sandbox
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
              Docker Isolated
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Code2 className="w-5 h-5 text-blue-600 shrink-0" />
            <span>Interactive Student Coding Practice</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Direct, unrestricted programming sandbox supporting Python 3, C11, C++17, Java 25, and SQLite. Select any language, write your code, provide custom input, and compile in real-time.
          </p>
        </div>

        {/* Separate Navigation: Only shows Assignment tab when faculty-assigned questions actually exist */}
        {questions.length > 0 && (
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shrink-0 self-start md:self-auto">
            <button
              onClick={handleSwitchToPractice}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'practice'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-blue-600" />
              <span>Independent Practice</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('assignments');
                if (!selectedQuestion && questions.length > 0) {
                  handleSelectQuestion(questions[0]);
                }
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'assignments'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-purple-600" />
              <span>Course Assignments</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-800">
                {questions.length}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. INDEPENDENT PRACTICE WORKSPACE (Clean, Direct, Zero Clutter) */}
      {/* ========================================================================= */}
      {activeTab === 'practice' && (
        <div className="space-y-4">
          {/* Programming Languages Direct Selector Bar */}
          <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Select Language:
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">•</span>
              <span className="text-xs text-slate-500 hidden sm:inline">
                Instant compiler switch with automatic starter templates
              </span>
            </div>

            {/* Direct Language Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isCurrent = selectedLanguage === lang.id;
                return (
                  <button
                    key={lang.id}
                    onClick={() => handleLanguageChange(lang.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                      isCurrent
                        ? 'bg-slate-900 text-white shadow-2xs ring-1 ring-slate-900'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <span>{lang.icon}</span>
                    <span>{lang.name}</span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                        isCurrent ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-500 border border-slate-200'
                      }`}
                    >
                      {lang.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Code Editor Container */}
          <div className="rounded-xl border border-slate-800 overflow-hidden shadow-xs bg-slate-950">
            {/* Editor Action Header Bar */}
            <div className="bg-slate-900 text-white p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-b border-slate-800">
              {/* Active File Metadata */}
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-2 font-mono text-slate-200 bg-slate-800/90 px-3 py-1.5 rounded-md border border-slate-700">
                  <FileCode className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold text-white">{currentLangConfig.file}</span>
                  <span className="text-[10px] text-slate-400 border-l border-slate-600 pl-2">
                    {currentLangConfig.badge}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Reset, Clear, Copy, AI Hint, Run Code */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Reset to Default Starter Template */}
                <button
                  onClick={handleResetTemplate}
                  title="Reset editor to starter template"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs font-medium border border-slate-700 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Template</span>
                </button>

                {/* Clear Code */}
                <button
                  onClick={handleClearCode}
                  title="Clear all code in editor"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-400 transition-colors text-xs font-medium border border-slate-700 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>

                {/* Copy Code */}
                <button
                  onClick={handleCopyCode}
                  title="Copy code to clipboard"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs font-medium border border-slate-700 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                {/* Ask AI Hint */}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleAskAiHelp}
                  loading={aiLoading}
                  className="bg-purple-950/80 hover:bg-purple-900 text-purple-200 border-purple-800/80"
                  icon={<Sparkles className="w-3.5 h-3.5 text-purple-300" />}
                >
                  AI Hint
                </Button>

                {/* Run Code Button */}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRunCode}
                  loading={running}
                  className="bg-blue-600 hover:bg-blue-500 text-white shadow-2xs font-semibold px-4"
                  icon={<Play className="w-3.5 h-3.5 fill-current" />}
                >
                  Run Code
                </Button>
              </div>
            </div>

            {/* Interactive Editor Textarea */}
            <div className="relative">
              <textarea
                value={code}
                onChange={(e) => {
                  const val = e.target.value;
                  setCode(val);
                  setCodePerLanguage((prev) => ({ ...prev, [selectedLanguage]: val }));
                }}
                rows={16}
                placeholder={`Write your ${currentLangConfig.name} program here...`}
                className="w-full p-4 bg-slate-950 text-slate-100 font-mono text-xs outline-hidden leading-relaxed focus:ring-1 focus:ring-blue-500 resize-y block"
                spellCheck={false}
              />
              {/* Bottom Status Info */}
              <div className="absolute bottom-3 right-4 text-[10px] text-slate-500 font-mono pointer-events-none bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                {code.split('\n').length} lines • {code.length} chars • {currentLangConfig.badge}
              </div>
            </div>
          </div>

          {/* AI Coding Guidance Box if triggered */}
          {aiAdvice && (
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-xs shadow-2xs">
              <div className="flex items-center justify-between font-semibold text-purple-900 mb-1.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>AI Assistant Diagnostic & Guidance ({currentLangConfig.name})</span>
                </div>
                <button
                  onClick={() => setAiAdvice('')}
                  className="text-purple-600 hover:text-purple-900 font-semibold text-xs cursor-pointer"
                >
                  ✕ Dismiss
                </button>
              </div>
              <p className="text-purple-950 whitespace-pre-wrap leading-relaxed font-sans">{aiAdvice}</p>
            </div>
          )}

          {/* Input & Output Panels (Split 1:1) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Custom Input (stdin) */}
            <Card className="p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-slate-500" />
                    Custom Input (stdin)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {selectedLanguage === 'python'
                      ? 'input()'
                      : selectedLanguage === 'c'
                      ? 'scanf()'
                      : selectedLanguage === 'cpp'
                      ? 'cin'
                      : selectedLanguage === 'java'
                      ? 'Scanner'
                      : 'N/A for SQL'}
                  </span>
                </div>
                <textarea
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  rows={4}
                  placeholder={
                    selectedLanguage === 'sql'
                      ? 'No stdin required for SQL statements.'
                      : 'Enter inputs to pass to your program (each on a new line)...'
                  }
                  className="w-full p-2.5 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 outline-hidden focus:border-blue-500 bg-white"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                Piped into your program's standard input stream during compilation and execution.
              </p>
            </Card>

            {/* Execution Output (stdout & stderr) */}
            <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-blue-400" />
                    Execution Output
                  </span>
                  {output && (
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          output.passed
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {output.status || (output.passed ? 'Success' : 'Error')}
                      </span>
                      <button
                        onClick={() => setOutput(null)}
                        className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
                        title="Clear output"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                <div className="font-mono text-xs text-slate-200 whitespace-pre-wrap max-h-40 overflow-y-auto p-2 bg-slate-950/70 rounded-lg border border-slate-800/80">
                  {output ? (
                    output.stderr ? (
                      <span className="text-rose-400">{output.stderr}</span>
                    ) : (
                      output.stdout || '[Program executed with no standard output]'
                    )
                  ) : (
                    <span className="text-slate-500 italic">
                      Click "Run Code" above to compile and run your program.
                    </span>
                  )}
                </div>
              </div>

              {output && (
                <div className="pt-2 mt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-blue-400" /> {output.executionTimeMs}ms
                  </span>
                  <span className="font-mono">
                    Process Exit Code:{' '}
                    <strong className={output.exitCode === 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {output.exitCode}
                    </strong>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. OPTIONAL SEPARATE SECTION: COURSE ASSIGNMENTS (When Questions Exist) */}
      {/* ========================================================================= */}
      {activeTab === 'assignments' && questions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Assigned Questions List */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="flex flex-col max-h-[640px]">
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xs uppercase tracking-wider text-slate-700">Course Assignments</CardTitle>
                  <CardDescription className="text-[10px]">Faculty and HOD assigned problems</CardDescription>
                </div>
                <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                  {questions.length} Questions
                </span>
              </CardHeader>

              {/* Difficulty Filters */}
              <div className="px-5 pt-3 pb-1 flex items-center gap-1.5">
                {['All', 'Easy', 'Medium', 'Hard'].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficultyFilter(diff)}
                    className={`text-[10px] font-semibold px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      difficultyFilter === diff
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>

              {/* Questions List */}
              <CardContent className="overflow-y-auto mt-2 space-y-2 pr-2 flex-1 p-5 pt-0">
                {filteredQuestions.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No questions match the "{difficultyFilter}" filter.
                  </div>
                ) : (
                  filteredQuestions.map((q) => {
                    const isSelected = selectedQuestion?._id === q._id;
                    return (
                      <div
                        key={q._id}
                        onClick={() => handleSelectQuestion(q)}
                        className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-purple-50/80 border-purple-400 ring-1 ring-purple-400 shadow-2xs'
                            : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-1">
                          <span className="font-semibold text-slate-900 leading-snug">{q.title}</span>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.2 rounded uppercase ${
                              q.difficulty === 'Easy'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                                : q.difficulty === 'Medium'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200/60'
                                : 'bg-rose-50 text-rose-800 border border-rose-200/60'
                            }`}
                          >
                            {q.difficulty}
                          </span>
                        </div>
                        <div className="mt-2 text-slate-500 flex items-center justify-between text-[11px]">
                          <span className="truncate max-w-[140px]">{q.subjectId?.subjectName || q.topic}</span>
                          <span className="font-mono text-purple-700 font-semibold uppercase text-[10px]">
                            {q.programmingLanguage}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Problem Details, Solution Editor, Test Case Runner */}
          <div className="lg:col-span-8 space-y-4">
            {selectedQuestion && (
              <Card className="p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">{selectedQuestion.title}</h2>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${
                          selectedQuestion.difficulty === 'Easy'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                            : selectedQuestion.difficulty === 'Medium'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200/60'
                            : 'bg-rose-50 text-rose-800 border border-rose-200/60'
                        }`}
                      >
                        {selectedQuestion.difficulty}
                      </span>
                    </div>
                    <span className="text-xs text-blue-600 font-medium">{selectedQuestion.topic}</span>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSwitchToPractice}
                    icon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Back to Free Practice
                  </Button>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selectedQuestion.description}
                </p>
              </Card>
            )}

            {/* Assignment Editor Bar */}
            <div className="rounded-xl border border-slate-800 overflow-hidden shadow-xs bg-slate-950">
              <div className="bg-slate-900 text-white p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-b border-slate-800">
                <div className="flex items-center gap-2 font-mono text-slate-200 bg-slate-800/90 px-3 py-1.5 rounded-md border border-slate-700">
                  <FileCode className="w-4 h-4 text-purple-400" />
                  <span className="font-semibold text-white">{currentLangConfig.file}</span>
                  <span className="text-[10px] text-slate-400 border-l border-slate-600 pl-2">
                    {currentLangConfig.badge}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleAskAiHelp}
                    loading={aiLoading}
                    className="bg-purple-950/80 hover:bg-purple-900 text-purple-200 border-purple-800/80"
                    icon={<Sparkles className="w-3.5 h-3.5 text-purple-300" />}
                  >
                    AI Hint
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleRunCode}
                    loading={running}
                    icon={<Play className="w-3.5 h-3.5 fill-current" />}
                  >
                    Run Code
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSubmitSolution}
                    loading={submitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  >
                    Submit Solution
                  </Button>
                </div>
              </div>

              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={14}
                className="w-full p-4 bg-slate-950 text-slate-100 font-mono text-xs outline-hidden leading-relaxed focus:ring-1 focus:ring-purple-500 resize-y block"
                spellCheck={false}
              />
            </div>

            {/* Output Panel for Assignment */}
            {output && (
              <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-2xs">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Execution Output
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      output.passed
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {output.status || (output.passed ? 'Success' : 'Error')}
                  </span>
                </div>
                <div className="font-mono text-xs text-slate-200 whitespace-pre-wrap p-2 bg-slate-950/70 rounded-lg border border-slate-800/80">
                  {output.stderr ? <span className="text-rose-400">{output.stderr}</span> : output.stdout}
                </div>
              </div>
            )}

            {/* Test Case Verification Results */}
            {testCaseResults.length > 0 && (
              <Card className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-800 block">
                    Test Case Verification Results
                  </span>
                  <span className="text-xs font-semibold text-slate-600">
                    Passed: {testCaseResults.filter((tc) => tc.passed).length} / {testCaseResults.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {testCaseResults.map((tc) => (
                    <div
                      key={tc.testCaseIndex}
                      className={`p-3 rounded-lg border text-xs ${
                        tc.passed ? 'border-emerald-200 bg-emerald-50/50' : 'border-rose-200 bg-rose-50/50'
                      }`}
                    >
                      <div className="flex justify-between items-center font-semibold">
                        <span>Test Case #{tc.testCaseIndex}</span>
                        <span className={tc.passed ? 'text-emerald-700' : 'text-rose-700'}>
                          {tc.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>
                      <div className="mt-1.5 text-[11px] text-slate-600">
                        Execution Time: {tc.executionTimeMs}ms
                      </div>
                      {tc.actualOutput && (
                        <div className="mt-1 font-mono text-[10px] text-slate-500 truncate">
                          Output: {tc.actualOutput}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Past Submissions for Current Assignment */}
            {submissions.length > 0 && (
              <Card className="p-5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-800 block mb-2">
                  My Submission History
                </span>
                <div className="space-y-1.5">
                  {submissions.slice(0, 5).map((sub) => (
                    <div
                      key={sub._id}
                      className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                    >
                      <span className="text-slate-500 font-mono text-[11px]">
                        {new Date(sub.submittedAt).toLocaleTimeString()}
                      </span>
                      <span className="font-semibold text-slate-800 uppercase text-[10px] font-mono">
                        {sub.programmingLanguage}
                      </span>
                      <span
                        className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                          sub.status === 'Accepted'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                            : 'bg-rose-50 text-rose-800 border border-rose-200/60'
                        }`}
                      >
                        {sub.status} ({sub.passedTestCases}/{sub.totalTestCases})
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">{sub.executionTimeMs}ms</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
