const axios = require('axios');
const path = require('path');
const {
  Document,
  DocumentVersion,
  StudyMaterial,
  StudentEnrollment,
  Subject,
  ChatbotConversation,
  Notification,
  User,
  ProgrammingLanguage
} = require('../models');
const { SUPPORTED_LANGUAGES } = require('../config/languages');
const { sendNotification } = require('../services/notificationService');
const { logAudit } = require('../middleware/auth');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://127.0.0.1:11434';

// Get current student's enrollment data (batch, regulation, semester)
const getMyEnrollment = async (req, res) => {
  try {
    const enrollment = await StudentEnrollment.findOne({ studentId: req.user._id })
      .populate('batchId')
      .populate('academicRegulationId');

    res.status(200).json({
      success: true,
      enrollment: enrollment || null
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get published documents for student's batch and regulation
const getApprovedDocuments = async (req, res) => {
  try {
    const enrollment = await StudentEnrollment.findOne({ studentId: req.user._id });
    if (!enrollment) {
      return res.status(200).json({
        success: true,
        count: 0,
        documents: [],
        message: 'No active batch enrollment yet.'
      });
    }

    const { semesterNumber, subjectId, search } = req.query;

    const query = {
      batchId: enrollment.batchId,
      academicRegulationId: enrollment.academicRegulationId,
      status: 'Published',
      isPublished: true
    };

    if (subjectId) query.subjectId = subjectId;

    let documents = await Document.find(query)
      .populate('subjectId')
      .populate('facultyId', 'name email department')
      .populate('semesterId')
      .populate('currentVersionId')
      .sort({ publishedAt: -1 });

    // Optional filter by semester number
    if (semesterNumber) {
      documents = documents.filter(doc => doc.semesterId && doc.semesterId.semesterNumber === Number(semesterNumber));
    }

    // Optional search by title or description
    if (search) {
      const s = search.toLowerCase();
      documents = documents.filter(doc =>
        doc.title.toLowerCase().includes(s) ||
        (doc.description && doc.description.toLowerCase().includes(s)) ||
        (doc.subjectId && doc.subjectId.subjectName.toLowerCase().includes(s))
      );
    }

    res.status(200).json({
      success: true,
      count: documents.length,
      documents
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get study materials (AI summaries, section notes, Tamil explanations)
const getStudyMaterials = async (req, res) => {
  try {
    const enrollment = await StudentEnrollment.findOne({ studentId: req.user._id });
    if (!enrollment) {
      return res.status(200).json({
        success: true,
        count: 0,
        materials: [],
        message: 'No study materials available yet.'
      });
    }

    const { subjectId } = req.query;
    const query = {
      batchId: enrollment.batchId,
      academicRegulationId: enrollment.academicRegulationId,
      isPublished: true
    };
    if (subjectId) query.subjectId = subjectId;

    const materials = await StudyMaterial.find(query)
      .populate('subjectId')
      .populate('semesterId')
      .populate('documentId', 'title description documentType publishedAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      materials
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// AI Academic Chatbot with document RAG retrieval & genuine LLM integration
const askChatbot = async (req, res) => {
  try {
    const { question, subjectId } = req.body;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Question cannot be empty' });
    }

    const enrollment = await StudentEnrollment.findOne({ studentId: req.user._id });
    if (!enrollment) {
      return res.status(403).json({ success: false, message: 'Student not enrolled in an active academic batch' });
    }

    // 1. Retrieve ONLY approved documents for this student's batch and regulation
    const approvedDocsQuery = {
      batchId: enrollment.batchId,
      academicRegulationId: enrollment.academicRegulationId,
      status: 'Published',
      isPublished: true
    };
    if (subjectId) approvedDocsQuery.subjectId = subjectId;

    const approvedDocs = await Document.find(approvedDocsQuery)
      .populate('subjectId')
      .populate('currentVersionId')
      .limit(10);

    // 2. Perform intelligent grounding detection against approved study materials & documents
    const relevantMaterials = await StudyMaterial.find({
      batchId: enrollment.batchId,
      academicRegulationId: enrollment.academicRegulationId,
      isPublished: true
    }).populate('subjectId').populate('documentId');

    let matchedDoc = null;
    let matchedSnippet = '';
    const qLower = question.toLowerCase().trim();

    // Specific syllabus/notes/document keywords
    const isDocExplicitQuery = (
      qLower.includes('summarize an uploaded') ||
      qLower.includes('summarize approved') ||
      qLower.includes('summarize the document') ||
      qLower.includes('summarize document') ||
      qLower.includes('unit 1') ||
      qLower.includes('syllabus') ||
      qLower.includes('lecture notes') ||
      qLower.includes('course material')
    );

    // Check if query matches study materials
    for (const mat of relevantMaterials) {
      const matTitle = mat.title ? mat.title.toLowerCase() : '';
      const matSubject = mat.subjectId?.subjectName ? mat.subjectId.subjectName.toLowerCase() : '';
      const matConcepts = mat.keyConcepts || [];

      const matchesTitle = matTitle && (qLower.includes(matTitle) || matTitle.split(' ').some(w => w.length > 3 && qLower.includes(w)));
      const matchesSubject = matSubject && qLower.includes(matSubject);
      const matchesConcept = matConcepts.some(c => qLower.includes(c.toLowerCase()));

      if (matchesTitle || matchesSubject || matchesConcept) {
        matchedDoc = mat.documentId;
        matchedSnippet = [
          mat.aiSummary,
          mat.studyNotes,
          (mat.sectionWiseSummaries || []).map(s => `${s.sectionHeading || s.sectionTitle}: ${s.summary}`).join('\n')
        ].filter(Boolean).join('\n\n');
        break;
      }
    }

    // If not matched by materials, check approved docs
    if (!matchedDoc && approvedDocs.length > 0) {
      const found = approvedDocs.find(d => {
        const titleLower = d.title.toLowerCase();
        const subLower = d.subjectId?.subjectName?.toLowerCase() || '';
        return (
          qLower.includes(titleLower) ||
          titleLower.split(' ').some(w => w.length > 3 && qLower.includes(w)) ||
          (subLower && qLower.includes(subLower))
        );
      });

      if (found) {
        matchedDoc = found;
        const matchingMat = relevantMaterials.find(m => String(m.documentId?._id) === String(found._id));
        if (matchingMat) {
          matchedSnippet = [
            matchingMat.aiSummary,
            matchingMat.studyNotes,
            (matchingMat.sectionWiseSummaries || []).map(s => `${s.sectionHeading || s.sectionTitle}: ${s.summary}`).join('\n')
          ].filter(Boolean).join('\n\n');
        } else {
          matchedSnippet = found.description || `Syllabus document: ${found.title} for ${found.subjectId?.subjectName || 'MCA curriculum'}.`;
        }
      } else if (isDocExplicitQuery) {
        // Explicit request to summarize approved college document
        matchedDoc = approvedDocs[0];
        const matchingMat = relevantMaterials.find(m => String(m.documentId?._id) === String(matchedDoc._id)) || relevantMaterials[0];
        if (matchingMat) {
          matchedSnippet = [
            matchingMat.aiSummary,
            matchingMat.studyNotes,
            (matchingMat.sectionWiseSummaries || []).map(s => `${s.sectionHeading || s.sectionTitle}: ${s.summary}`).join('\n')
          ].filter(Boolean).join('\n\n');
        } else {
          matchedSnippet = matchedDoc.description || `Syllabus document: ${matchedDoc.title} for ${matchedDoc.subjectId?.subjectName || 'MCA curriculum'}.`;
        }
      }
    }

    // 3. Set provenance
    let sourceType = 'general_academic';
    const docReferences = [];
    let resolvedFilePath = null;

    if (matchedDoc) {
      sourceType = 'approved_document';
      if (matchedDoc.currentVersionId?.filePath) {
        resolvedFilePath = path.resolve(matchedDoc.currentVersionId.filePath);
      } else if (matchedDoc.currentVersionId) {
        try {
          const ver = await DocumentVersion.findById(matchedDoc.currentVersionId);
          if (ver && ver.filePath) {
            resolvedFilePath = path.resolve(ver.filePath);
          }
        } catch (e) {
          console.warn('[DocVersion Resolve Error]', e.message);
        }
      }
      docReferences.push({
        documentId: matchedDoc._id,
        title: matchedDoc.title,
        page: 1,
        snippet: (matchedSnippet || matchedDoc.description || 'Verified course document for Kongu Engineering College syllabus').substring(0, 180) + '...'
      });
    }

    // 4. Fetch recent conversation history for multi-turn context
    let conversation = await ChatbotConversation.findOne({
      studentId: req.user._id,
      ...(subjectId ? { subjectId } : {})
    }).sort({ updatedAt: -1 });

    const recentHistory = [];
    if (conversation && conversation.messages && conversation.messages.length > 0) {
      const lastTurns = conversation.messages.slice(-6);
      for (const m of lastTurns) {
        recentHistory.push({
          sender: m.sender,
          text: m.text
        });
      }
    }

    // 5. Connect to Genuine AI Service
    let answerText = '';
    let usedModel = 'llama3.2:1b';

    try {
      const aiResp = await axios.post(`${AI_SERVICE_URL}/api/chat`, {
        question: question.trim(),
        context_text: matchedSnippet || '',
        document_title: matchedDoc ? matchedDoc.title : null,
        file_path: resolvedFilePath || null,
        history: recentHistory
      }, { timeout: 120000 });

      if (aiResp.data && aiResp.data.reply) {
        answerText = aiResp.data.reply;
        if (aiResp.data.model) usedModel = aiResp.data.model;
      }
    } catch (aiErr) {
      console.warn(`[AI Service Chat Notice] ${aiErr.message}. Attempting direct Ollama connection...`);
      try {
        const isTamil = /[\u0B80-\u0BFF]/.test(question) || question.toLowerCase().includes('tamil') || question.toLowerCase().includes('தமிழ்');
        let sysPrompt = 'You are DocuFlow AI Academic Assistant, a friendly and authoritative computer science professor for MCA students.\n' +
          'Provide clear, natural, ChatGPT-style answers using Markdown headings (###), bullet points, and code blocks.\n';
        if (isTamil) {
          sysPrompt += 'Respond in clear, natural Tamil (தமிழ் விளக்கம்) with technical terms in English parentheses.\n';
        }
        if (matchedDoc && matchedSnippet) {
          sysPrompt += `Ground your answer on this approved syllabus document (${matchedDoc.title}):\n${matchedSnippet.substring(0, 3000)}\n`;
        } else {
          sysPrompt += 'Provide a thorough computer science explanation based on standard academic curriculum.\n';
        }

        const directPrompt = `${sysPrompt}\n\nStudent Question: ${question.trim()}\n\nAssistant Answer:`;

        const ollamaResp = await axios.post(`${OLLAMA_API_URL}/api/generate`, {
          model: usedModel,
          prompt: directPrompt,
          stream: false,
          keep_alive: '24h',
          options: {
            temperature: 0.3,
            num_predict: 420
          }
        }, { timeout: 120000 });

        if (ollamaResp.data && ollamaResp.data.response) {
          answerText = ollamaResp.data.response.trim();
        }
      } catch (ollamaErr) {
        console.error(`[Ollama Direct Error] ${ollamaErr.message}`);
        return res.status(503).json({
          success: false,
          message: 'The AI reasoning model service is currently offline or warming up. Please ensure Ollama and AI service are running (port 8000/11434).'
        });
      }
    }

    if (!answerText) {
      return res.status(503).json({
        success: false,
        message: 'The AI reasoning model failed to generate a response. Please check model status.'
      });
    }

    // 6. Save to ChatbotConversation
    if (!conversation) {
      conversation = await ChatbotConversation.create({
        studentId: req.user._id,
        subjectId: subjectId || null,
        messages: []
      });
    }

    conversation.messages.push({
      sender: 'student',
      text: question.trim(),
      timestamp: new Date()
    });

    conversation.messages.push({
      sender: 'assistant',
      text: answerText,
      sourceType,
      documentReferences: docReferences,
      timestamp: new Date()
    });

    await conversation.save();

    res.status(200).json({
      success: true,
      reply: answerText,
      sourceType,
      documentReferences: docReferences,
      conversationId: conversation._id,
      model: usedModel
    });
  } catch (error) {
    console.error('[AskChatbot Error]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get chatbot conversation history
const getChatbotHistory = async (req, res) => {
  try {
    const { subjectId } = req.query;
    const query = { studentId: req.user._id };
    if (subjectId) query.subjectId = subjectId;

    const conversation = await ChatbotConversation.findOne(query).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      messages: conversation ? conversation.messages : []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Clear chatbot conversation history
const clearChatbotHistory = async (req, res) => {
  try {
    const { subjectId } = req.query;
    const query = { studentId: req.user._id };
    if (subjectId) query.subjectId = subjectId;

    await ChatbotConversation.deleteMany(query);

    res.status(200).json({
      success: true,
      message: 'Chatbot conversation history reset successfully.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get dynamic subjects for student's current active semester
const getSemesterSubjects = async (req, res) => {
  try {
    const enrollment = await StudentEnrollment.findOne({ studentId: req.user._id })
      .populate('batchId')
      .populate('academicRegulationId');

    if (!enrollment) {
      return res.status(200).json({
        success: true,
        currentSemester: 1,
        subjects: [],
        completedSemesters: [],
        message: 'No active enrollment profile found.'
      });
    }

    const currentSemester = enrollment.currentSemester || 1;

    // Fetch active subjects for student's regulation and current semester
    const currentSubjects = await Subject.find({
      academicRegulationId: enrollment.academicRegulationId._id,
      semesterNumber: currentSemester
    })
      .populate('semesterId')
      .sort({ subjectCode: 1 });

    // Fetch historical subjects for completed semesters
    const historicalSubjects = await Subject.find({
      academicRegulationId: enrollment.academicRegulationId._id,
      semesterNumber: { $in: enrollment.completedSemesters || [] }
    })
      .populate('semesterId')
      .sort({ semesterNumber: 1, subjectCode: 1 });

    const currentCredits = currentSubjects.reduce((sum, s) => sum + (s.credits || 0), 0);
    const completedCredits = historicalSubjects.reduce((sum, s) => sum + (s.credits || 0), 0);

    res.status(200).json({
      success: true,
      currentSemester,
      status: enrollment.status || 'active',
      currentCredits,
      totalCredits: currentCredits,
      completedCredits,
      activeSubjects: currentSubjects,
      subjects: currentSubjects,
      completedSemesters: enrollment.completedSemesters || [],
      semesterHistory: enrollment.semesterHistory || [],
      arrears: enrollment.arrears || [],
      historicalSubjects
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Automatic Semester Progression S1 -> S2 -> S3 -> S4 -> Program Completed
const promoteSemester = async (req, res) => {
  try {
    const enrollment = await StudentEnrollment.findOne({ studentId: req.user._id })
      .populate('batchId')
      .populate('academicRegulationId');

    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Student enrollment record not found.' });
    }

    const currentSem = enrollment.currentSemester || 1;

    if (enrollment.status === 'graduated' || enrollment.status === 'completed' || currentSem > 4) {
      return res.status(400).json({
        success: false,
        message: 'Student has already completed all 4 semesters and graduated from the MCA program.'
      });
    }

    let nextSem = currentSem + 1;
    let nextStatus = 'active';
    let isGraduated = false;

    if (currentSem === 4) {
      nextStatus = 'graduated';
      isGraduated = true;
    }

    // Record promotion in semesterHistory
    const promotionRecord = {
      semesterNumber: currentSem,
      promotedAt: new Date(),
      status: isGraduated ? 'Program Completed' : 'Completed',
      approvedBy: req.user._id,
      remarks: isGraduated
        ? 'Successfully completed MCA degree program curriculum requirements.'
        : `Verified academic completion of Semester ${currentSem}. Promoted to Semester ${nextSem}.`
    };

    const completedSemList = enrollment.completedSemesters || [];
    if (!completedSemList.includes(currentSem)) {
      completedSemList.push(currentSem);
    }

    enrollment.currentSemester = isGraduated ? 4 : nextSem;
    enrollment.status = nextStatus;
    enrollment.completedSemesters = completedSemList;
    if (!enrollment.semesterHistory) enrollment.semesterHistory = [];
    enrollment.semesterHistory.push(promotionRecord);
    await enrollment.save();

    // Also update User profile semester
    await User.findByIdAndUpdate(req.user._id, {
      semester: isGraduated ? 4 : nextSem,
      year: nextSem <= 2 ? 1 : 2
    });

    const notifTitle = isGraduated ? '🎉 MCA Program Completed!' : `🎓 Promoted to Semester ${nextSem}!`;
    const notifMsg = isGraduated
      ? 'Congratulations! You have successfully completed all 4 semesters of the Master of Computer Applications (MCA) program.'
      : `You have successfully progressed to Semester ${nextSem}. Your new curriculum course modules are now active in your dashboard.`;

    await sendNotification({
      recipientId: req.user._id,
      title: notifTitle,
      message: notifMsg,
      type: 'semester_promotion'
    });

    await logAudit(req, 'STUDENT_SEMESTER_PROMOTION', 'student_enrollments', enrollment._id, {
      fromSemester: currentSem,
      toSemester: isGraduated ? 'Graduated' : nextSem,
      isGraduated
    });

    res.status(200).json({
      success: true,
      message: notifMsg,
      currentSemester: enrollment.currentSemester,
      status: enrollment.status,
      completedSemesters: enrollment.completedSemesters,
      semesterHistory: enrollment.semesterHistory
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get programming languages configured directly in application code
const getMyLanguages = async (req, res) => {
  try {
    const enrollment = await StudentEnrollment.findOne({ studentId: req.user._id });
    res.status(200).json({
      success: true,
      currentSemester: enrollment?.currentSemester || 1,
      count: SUPPORTED_LANGUAGES.length,
      languages: SUPPORTED_LANGUAGES
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMyEnrollment,
  getApprovedDocuments,
  getStudyMaterials,
  askChatbot,
  getChatbotHistory,
  clearChatbotHistory,
  getSemesterSubjects,
  promoteSemester,
  getMyLanguages
};

