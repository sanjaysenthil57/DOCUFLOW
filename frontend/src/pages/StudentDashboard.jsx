import React, { useState, useEffect, useRef } from 'react';
import api, { studentApi } from '../services/api';
import DocumentPreviewModal from '../components/DocumentPreviewModal';
import MarkdownRenderer from '../components/MarkdownRenderer';
import {
  BookOpen,
  GraduationCap,
  Sparkles,
  Download,
  Eye,
  Search,
  MessageSquare,
  FileText,
  Languages,
  CheckCircle2,
  Code2,
  Send,
  User,
  Bot,
  Layers,
  ArrowRight,
  Award,
  ChevronRight,
  Terminal,
  Check,
  Clock,
  BookMarked,
  RotateCw,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Trash2,
  HelpCircle,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Pause,
  Play,
  Square
} from 'lucide-react';

const ALL_CODE_LANGUAGES = [
  { id: 'python', displayName: 'Python 3', fileExtension: '.py', version: 'Python 3.10', category: 'Data Science & AI', executionCommand: 'python solution.py', description: 'High-level interpreted language leading Data Science, Machine Learning, and Rapid Scripting.' },
  { id: 'c', displayName: 'C', fileExtension: '.c', version: 'C11', category: 'Systems & Cloud', executionCommand: 'cl.exe /nologo solution.c', description: 'ISO C11 imperative systems language with manual memory management and direct hardware control.' },
  { id: 'cpp', displayName: 'C++ 17', fileExtension: '.cpp', version: 'C++17', category: 'Systems & Cloud', executionCommand: 'cl.exe /EHsc /nologo solution.cpp', description: 'High-performance systems programming language supporting STL algorithms, vectors, and templates.' },
  { id: 'java', displayName: 'Java 25', fileExtension: '.java', version: 'JDK 25 LTS', category: 'Enterprise Backend', executionCommand: 'javac Solution.java && java Solution', description: 'Robust, strongly typed object-oriented enterprise platform running on the Java Virtual Machine.' },
  { id: 'javascript', displayName: 'JavaScript (Node.js)', fileExtension: '.js', version: 'Node.js 20 LTS', category: 'Full-Stack Web', executionCommand: 'node solution.js', description: 'Modern ECMAScript standard runtime for scalable web applications, event-driven servers, and algorithms.' },
  { id: 'typescript', displayName: 'TypeScript', fileExtension: '.ts', version: 'TS 5.0 / ts-node', category: 'Full-Stack Web', executionCommand: 'ts-node solution.ts', description: 'Strict syntactical superset of JavaScript providing compile-time static types and modern tooling.' },
  { id: 'sql', displayName: 'SQL (SQLite3 / PostgreSQL)', fileExtension: '.sql', version: 'SQLite3 In-Memory', category: 'Database & Analytics', executionCommand: 'sqlite3 :memory: < solution.sql', description: 'Declarative query language for relational database design, joins, subqueries, and transactions.' },
  { id: 'html', displayName: 'HTML5', fileExtension: '.html', version: 'HTML5 Living Standard', category: 'Web Development', executionCommand: 'headless-browser --render solution.html', description: 'Standard markup language for constructing modern academic web layouts and semantic structures.' },
  { id: 'css', displayName: 'CSS3', fileExtension: '.css', version: 'CSS3 Modular', category: 'Web Development', executionCommand: 'css-validator solution.css', description: 'Cascading Style Sheets for responsive design, grid layouts, flexbox, and smooth animations.' },
  { id: 'php', displayName: 'PHP', fileExtension: '.php', version: 'PHP 8.2', category: 'Web Backend', executionCommand: 'php solution.php', description: 'Server-side scripting language powering web backend architectures and RESTful interfaces.' },
  { id: 'r', displayName: 'R', fileExtension: '.r', version: 'R 4.2', category: 'Data Science & AI', executionCommand: 'Rscript solution.R', description: 'Statistical programming language widely adopted in data mining, bio-statistics, and visualization.' },
  { id: 'go', displayName: 'Go (Golang)', fileExtension: '.go', version: 'Go 1.21', category: 'Systems & Cloud', executionCommand: 'go run solution.go', description: 'Statically typed compiled language engineered by Google for concurrent distributed backend services.' },
  { id: 'rust', displayName: 'Rust', fileExtension: '.rs', version: 'Rust 1.72', category: 'Systems & Cloud', executionCommand: 'rustc solution.rs && ./solution', description: 'Blazingly fast memory-safe systems programming language guaranteeing thread safety without garbage collection.' },
  { id: 'kotlin', displayName: 'Kotlin', fileExtension: '.kt', version: 'Kotlin 1.9', category: 'Mobile & Enterprise', executionCommand: 'kotlinc solution.kt -include-runtime -d solution.jar && java -jar solution.jar', description: 'Modern concise language interoperable with Java, favored for Android development and modern microservices.' },
  { id: 'swift', displayName: 'Swift', fileExtension: '.swift', version: 'Swift 5.9', category: 'Mobile & Apple Systems', executionCommand: 'swift solution.swift', description: 'Fast, secure, and modern language created by Apple for iOS, macOS, watchOS, and server-side utilities.' },
  { id: 'csharp', displayName: 'C# (.NET 8)', fileExtension: '.cs', version: '.NET 8 LTS', category: 'Enterprise Backend', executionCommand: 'dotnet run', description: 'Versatile object-oriented language developed by Microsoft for cloud APIs, enterprise services, and desktop apps.' },
  { id: 'ruby', displayName: 'Ruby', fileExtension: '.rb', version: 'Ruby 3.2', category: 'Web Backend', executionCommand: 'ruby solution.rb', description: 'Dynamic, open source programming language with a focus on simplicity, productivity, and elegant syntax.' },
  { id: 'dart', displayName: 'Dart', fileExtension: '.dart', version: 'Dart 3.2', category: 'Mobile & Full-Stack', executionCommand: 'dart run solution.dart', description: 'Client-optimized language for fast apps on any platform, powering the Flutter multi-platform UI framework.' },
  { id: 'matlab', displayName: 'MATLAB / GNU Octave', fileExtension: '.m', version: 'Octave 8.2', category: 'Scientific & Math', executionCommand: 'octave-cli --no-gui solution.m', description: 'High-level language for numerical computation, matrix manipulations, and mathematical modeling.' },
  { id: 'scala', displayName: 'Scala 3', fileExtension: '.scala', version: 'Scala 3.3', category: 'Big Data & Functional', executionCommand: 'scala solution.scala', description: 'Functional and object-oriented language optimized for distributed big data processing and Apache Spark.' },
  { id: 'perl', displayName: 'Perl', fileExtension: '.pl', version: 'Perl 5.36', category: 'Scripting & Bio', executionCommand: 'perl solution.pl', description: 'Highly capable text processing language with extensive history in system administration and bioinformatics.' },
  { id: 'bash', displayName: 'Bash / Shell', fileExtension: '.sh', version: 'GNU Bash 5.2', category: 'Systems & Cloud', executionCommand: 'bash solution.sh', description: 'Standard Unix shell command and scripting language for process automation, pipelines, and DevOps workflows.' }
];

export default function StudentDashboard({ currentSubTab, onNavigate }) {
  const [activeTab, setActiveTab] = useState(currentSubTab || 'subjects');
  const [enrollment, setEnrollment] = useState(null);
  const [semesterData, setSemesterData] = useState(null);
  const [myLanguages, setMyLanguages] = useState(ALL_CODE_LANGUAGES);
  const [approvedDocs, setApprovedDocs] = useState([]);
  const [studyMaterials, setStudyMaterials] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState(false);
  const [expandedSubjectId, setExpandedSubjectId] = useState(null);

  // Chatbot State
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Speech-to-Text (STT) State
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const recognitionRef = useRef(null);

  // Text-to-Speech (TTS) State
  const [speakingMsgIdx, setSpeakingMsgIdx] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);

  // Strip markdown formatting for clean, natural speech synthesis
  const cleanTextForSpeech = (text) => {
    if (!text) return '';
    return text
      .replace(/```[\s\S]*?```/g, ' Code snippet omitted. ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/^>\s+/gm, '')
      .replace(/^[\*\-\+]\s+/gm, '')
      .replace(/^\d+\.\s+/gm, '')
      .replace(/^[-*_]{3,}\s*$/gm, '')
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const startListening = () => {
    setSpeechError('');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError('');
      };

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setChatInput(transcript);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission denied. Please allow microphone access in your browser settings.');
        } else if (event.error === 'no-speech') {
          // No speech detected, silently exit without error banner
        } else if (event.error === 'network') {
          setSpeechError('Speech network connection error. Please check your internet connection.');
        } else {
          setSpeechError(`Speech error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      setSpeechError('Could not start microphone: ' + err.message);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMsgIdx(null);
    setIsPaused(false);
  };

  const pauseSpeech = () => {
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const resumeSpeech = () => {
    if ('speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const speakMessage = (text, msgIdx) => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-Speech is not supported in this browser.');
      return;
    }

    if (speakingMsgIdx === msgIdx && isPaused) {
      resumeSpeech();
      return;
    }

    window.speechSynthesis.cancel();

    const cleanText = cleanTextForSpeech(text);
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    utterance.onstart = () => {
      setSpeakingMsgIdx(msgIdx);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setSpeakingMsgIdx(null);
      setIsPaused(false);
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      setSpeakingMsgIdx(null);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Cleanup speech listeners and audio when leaving page
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTab === 'chatbot') {
      scrollToBottom();
    }
  }, [chatMessages, chatLoading, activeTab]);

  // Preview Modal
  const [previewDocId, setPreviewDocId] = useState(null);

  useEffect(() => {
    if (currentSubTab) {
      if (currentSubTab === 'dashboard' || currentSubTab === 'subjects') setActiveTab('subjects');
      else if (currentSubTab === 'library') setActiveTab('library');
      else if (currentSubTab === 'notes') setActiveTab('notes');
      else if (currentSubTab === 'languages') setActiveTab('languages');
      else if (currentSubTab === 'chatbot') setActiveTab('chatbot');
      else setActiveTab(currentSubTab);
    }
  }, [currentSubTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [enrRes, semRes, langRes, docsRes, matsRes, chatRes] = await Promise.all([
        studentApi.getEnrollment().catch(() => ({ data: { success: true, enrollment: null } })),
        studentApi.getSemesterSubjects().catch(() => ({ data: { success: true, activeSubjects: [] } })),
        studentApi.getMyLanguages().catch(() => ({ data: { success: true, languages: [] } })),
        studentApi.getApprovedDocuments().catch(() => ({ data: { success: true, documents: [] } })),
        studentApi.getStudyMaterials().catch(() => ({ data: { success: true, materials: [] } })),
        studentApi.getChatbotHistory().catch(() => ({ data: { success: true, messages: [] } }))
      ]);

      if (enrRes?.data?.enrollment) setEnrollment(enrRes.data.enrollment);
      if (semRes?.data) setSemesterData(semRes.data);
      if (langRes?.data?.languages && langRes.data.languages.length > 0) setMyLanguages(langRes.data.languages);
      if (docsRes?.data?.documents) setApprovedDocs(docsRes.data.documents);
      if (matsRes?.data?.materials) setStudyMaterials(matsRes.data.materials);
      if (chatRes?.data?.messages && chatRes.data.messages.length > 0) {
        setChatMessages(chatRes.data.messages);
      } else {
        setChatMessages([
          {
            sender: 'assistant',
            text: 'Hello! I am your DocuFlow AI Academic Assistant. Ask me anything about your approved semester course materials, algorithms, or database concepts.',
            sourceType: 'general_academic'
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to load student portal data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePromoteSemester = async () => {
    const currentSem = semesterData?.currentSemester || enrollment?.currentSemester || 1;
    if (currentSem >= 4) {
      alert('You have already reached Semester 4. Advancing will finalize program completion.');
    }
    const confirmMsg = currentSem < 4
      ? `Are you sure you want to advance to Semester ${currentSem + 1}? This will dynamically load all Semester ${currentSem + 1} subjects and programming modules.`
      : 'Are you sure you want to submit your final semester completion for graduation?';

    if (!window.confirm(confirmMsg)) return;

    setPromoting(true);
    try {
      const res = await studentApi.promoteSemester();
      if (res.data.success) {
        alert(res.data.message);
        await loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Promotion request failed');
    } finally {
      setPromoting(false);
    }
  };

  const sendMessageWithText = async (queryText) => {
    if (!queryText || !queryText.trim() || chatLoading) return;
    const userQ = queryText.trim();
    setChatMessages(prev => [...prev, { sender: 'student', text: userQ }]);
    setChatLoading(true);

    try {
      const res = await studentApi.askChatbot({ question: userQ });
      if (res.data.success) {
        const assistantMsg = {
          sender: 'assistant',
          text: res.data.reply,
          sourceType: res.data.sourceType,
          documentReferences: res.data.documentReferences,
          model: res.data.model
        };
        setChatMessages(prev => {
          const updated = [...prev, assistantMsg];
          if (autoSpeak) {
            setTimeout(() => speakMessage(assistantMsg.text, updated.length - 1), 250);
          }
          return updated;
        });
      }
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: `⚠️ **AI Service Notice**\n\n${err.response?.data?.message || err.message || 'The local AI reasoning service is currently warming up or unavailable. Please verify Ollama and the AI microservice are running.'}`,
          sourceType: 'general_academic'
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    const userQ = chatInput.trim();
    setChatInput('');
    await sendMessageWithText(userQ);
  };

  const handleClearChat = async () => {
    if (!window.confirm('Are you sure you want to clear your conversation history?')) return;
    stopSpeech();
    try {
      await studentApi.clearChatbotHistory();
      setChatMessages([
        {
          sender: 'assistant',
          text: 'Conversation history cleared. How can I assist you with your academic studies today?',
          sourceType: 'general_academic'
        }
      ]);
    } catch (err) {
      console.error('Failed to clear chat', err);
    }
  };

  const handleDownload = async (docId) => {
    try {
      const res = await api.get(`/documents/${docId}/download`, { responseType: 'blob' });
      const targetDoc = approvedDocs.find((d) => d._id === docId);
      const filename = targetDoc?.currentVersionId?.originalFilename || `${targetDoc?.title || 'study-material'}.pdf`;
      const downloadUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch {
      const token = localStorage.getItem('docuflow_token');
      const url = `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'}/documents/${docId}/download?token=${encodeURIComponent(token || '')}`;
      window.open(url, '_blank');
    }
  };

  const currentSemNum = semesterData?.currentSemester || enrollment?.currentSemester || 1;
  const isGraduated = semesterData?.status === 'graduated' || enrollment?.status === 'graduated';

  const filteredDocs = approvedDocs.filter(d => {
    const matchSearch = searchQuery === '' ||
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.subjectId?.subjectName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSem = !selectedSemester || String(d.semesterId?.semesterNumber) === String(selectedSemester);
    return matchSearch && matchSem;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ========================================================================= */}
      {/* 1. DASHBOARD HERO: Refined Dark Navy Academic Profile Panel */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 sm:p-7 text-white shadow-xs relative overflow-hidden">
        {/* Subtle decorative radial gradient glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 space-y-6">
          {/* Top Row: Title & Academic Badges */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-md bg-white/10 text-slate-200 border border-white/10">
                  {enrollment?.academicRegulationId?.name || 'MCA REGULATION 2026'}
                </span>
                {isGraduated ? (
                  <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" /> Program Completed
                  </span>
                ) : (
                  <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Active Enrollment
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
                Student Academic Portal
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
                Department of Computer Applications • Autonomous MCA Curriculum & Course Materials
              </p>
            </div>

            {/* Academic Profile Metadata Badges */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 bg-slate-950/70 px-4 py-3 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block font-medium">
                  Register No.
                </span>
                <span className="font-mono font-semibold text-white text-xs sm:text-sm">
                  {enrollment?.registerNumber || 'MCA2026001'}
                </span>
              </div>
              <div className="h-7 w-px bg-slate-800"></div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-medium">
                  Batch
                </span>
                <span className="font-medium text-white text-xs sm:text-sm">
                  {enrollment?.batchId?.batchName || '2026–2028'}
                </span>
              </div>
              <div className="h-7 w-px bg-slate-800"></div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-medium">
                  Regulation
                </span>
                <span className="font-mono font-medium text-slate-300 text-xs sm:text-sm">
                  {enrollment?.academicRegulationId?.code || 'R2026'}
                </span>
              </div>
              <div className="h-7 w-px bg-slate-800"></div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-medium">
                  Earned Credits
                </span>
                <span className="font-mono font-semibold text-blue-300 text-xs sm:text-sm">
                  {semesterData?.totalCredits || 19} Credits
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. SEMESTER PROGRESSION: Balanced 4-Semester Stepper Grid */}
          {/* ========================================================================= */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                MCA Semester Progression Roadmap (S1 to S4)
              </span>

              {/* Compact Advance Button */}
              {!isGraduated && (
                <button
                  onClick={handlePromoteSemester}
                  disabled={promoting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  title="Advance to next semester"
                >
                  {promoting ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <span>Advance to Semester {currentSemNum < 4 ? currentSemNum + 1 : 'Graduation'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { num: 1, title: 'Semester 1', desc: 'Mathematical & Algorithmic Foundations' },
                { num: 2, title: 'Semester 2', desc: 'Full-Stack Development & AI/ML' },
                { num: 3, title: 'Semester 3', desc: 'Cloud Architectures & DevOps' },
                { num: 4, title: 'Semester 4', desc: 'Enterprise Systems & Capstone Project' }
              ].map((sem) => {
                const isPassed = currentSemNum > sem.num || isGraduated;
                const isCurrent = currentSemNum === sem.num && !isGraduated;
                const isFuture = currentSemNum < sem.num;

                return (
                  <div
                    key={sem.num}
                    className={`p-3.5 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-blue-950/40 border-blue-500/80 ring-1 ring-blue-500/30 text-white shadow-xs'
                        : isPassed
                        ? 'bg-slate-800/40 border-slate-700/60 text-slate-300'
                        : 'bg-slate-900/40 border-slate-800/60 text-slate-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-xs tracking-tight">{sem.title}</span>
                        {isPassed && (
                          <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" /> Completed
                          </span>
                        )}
                        {isCurrent && (
                          <span className="text-[10px] font-semibold text-blue-300 bg-blue-500/20 border border-blue-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span> Active
                          </span>
                        )}
                        {isFuture && (
                          <span className="text-[10px] font-medium text-slate-500 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Upcoming
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">{sem.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CONTENT TABS: Responsive Modern Segmented Tab Bar */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-1.5 shadow-2xs flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex flex-wrap items-center gap-1">
          {/* Tab 1 */}
          <button
            onClick={() => setActiveTab('subjects')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'subjects'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <BookMarked className="w-4 h-4 shrink-0" />
            <span>Semester Subjects</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              activeTab === 'subjects' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
            }`}>
              {semesterData?.activeSubjects?.length || 0}
            </span>
          </button>

          {/* Tab 2 */}
          <button
            onClick={() => setActiveTab('languages')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'languages'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <Terminal className="w-4 h-4 shrink-0" />
            <span>Programming & Labs</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              activeTab === 'languages' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
            }`}>
              {myLanguages.length}
            </span>
          </button>

          {/* Tab 3 */}
          <button
            onClick={() => setActiveTab('library')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'library'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>Course Materials</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              activeTab === 'library' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
            }`}>
              {filteredDocs.length}
            </span>
          </button>

          {/* Tab 4 */}
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'notes'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <GraduationCap className="w-4 h-4 shrink-0" />
            <span>AI Study Notes</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              activeTab === 'notes' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
            }`}>
              {studyMaterials.length}
            </span>
          </button>

          {/* Tab 5 */}
          <button
            onClick={() => setActiveTab('chatbot')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'chatbot'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span>AI Academic Chatbot</span>
            <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
              RAG
            </span>
          </button>
        </div>

        {/* Right Action: Coding Sandbox Quick Link */}
        <button
          onClick={() => onNavigate('coding')}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50/70 border border-blue-200/80 flex items-center gap-1.5 transition-colors ml-auto sm:ml-0"
        >
          <Code2 className="w-3.5 h-3.5 text-blue-600" />
          <span>Interactive Sandbox &rarr;</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SEMESTER SUBJECTS & CURRICULUM */}
      {/* ========================================================================= */}
      {activeTab === 'subjects' && (
        <div className="space-y-4">
          {/* Subheader Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-900 text-sm">
                Semester {currentSemNum} Dynamic Curriculum
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Loaded directly from MongoDB for {enrollment?.academicRegulationId?.name || 'MCA REGULATION 2026'}.
              </p>
            </div>
            <div className="flex items-center gap-2.5 text-xs">
              <span className="bg-slate-50 text-slate-700 px-2.5 py-1 rounded-lg font-medium border border-slate-200/80 font-mono">
                Total Credits: <strong className="text-blue-700 font-semibold">{semesterData?.totalCredits || 19}</strong>
              </span>
              <button
                onClick={loadData}
                className="p-1.5 border border-slate-200/80 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                title="Refresh curriculum"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Subjects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(semesterData?.activeSubjects || []).map((sub) => {
              const isExpanded = expandedSubjectId === sub._id;
              return (
                <div
                  key={sub._id}
                  className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all"
                >
                  <div>
                    {/* Subject Badges */}
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-mono text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200/70 text-xs">
                        {sub.subjectCode}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200/60">
                          {sub.subjectType || 'Theory'}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60 font-mono">
                          {sub.credits} Credits
                        </span>
                      </div>
                    </div>

                    {/* Subject Title & Description */}
                    <h3 className="font-semibold text-slate-900 text-sm mt-2.5 leading-snug">
                      {sub.subjectName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {sub.description || sub.syllabusSummary || 'Autonomous MCA curriculum subject.'}
                    </p>

                    {/* Associated Programming Languages */}
                    {sub.hasProgramming && (
                      <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Labs / Code:</span>
                        {(sub.programmingLanguages?.length > 0 ? sub.programmingLanguages : [sub.primaryLanguage]).map((lang) => (
                          <button
                            key={lang}
                            onClick={() => onNavigate('coding')}
                            className="text-[10px] font-semibold uppercase font-mono px-2 py-0.5 rounded bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200/80 transition-colors cursor-pointer"
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Syllabus Units Accordion */}
                    {sub.syllabusUnits && sub.syllabusUnits.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <button
                          onClick={() => setExpandedSubjectId(isExpanded ? null : sub._id)}
                          className="w-full flex items-center justify-between text-xs font-medium text-blue-600 hover:text-blue-800"
                        >
                          <span>{sub.syllabusUnits.length} Syllabus Units Breakdown</span>
                          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </button>

                        {isExpanded && (
                          <div className="mt-3 space-y-2 text-xs text-slate-600">
                            {sub.syllabusUnits.map((u) => (
                              <div key={u.unitNumber} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="font-semibold text-slate-800 block text-[11px]">
                                   Unit {u.unitNumber}: {u.unitTitle}
                                </span>
                                {u.topics && u.topics.length > 0 && (
                                  <p className="text-slate-500 mt-0.5 text-[10px] line-clamp-2">
                                    Topics: {u.topics.join(', ')}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400 font-mono">
                      Semester {sub.semesterNumber} • R2026
                    </span>
                    {sub.hasProgramming && (
                      <button
                        onClick={() => onNavigate('coding')}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Code2 className="w-3.5 h-3.5" /> Practice in Sandbox &rarr;
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Completed Historical Subjects */}
          {semesterData?.historicalSubjects && semesterData.historicalSubjects.length > 0 && (
            <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-5 space-y-3">
              <h3 className="font-semibold text-slate-900 text-xs uppercase tracking-wider">
                Archived Completed Subjects
              </h3>
              <p className="text-xs text-slate-500">Earlier semester subjects completed during your MCA program.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                {semesterData.historicalSubjects.map((hSub) => (
                  <div key={hSub._id} className="p-3 bg-white rounded-lg border border-slate-200/80 text-xs shadow-2xs">
                    <span className="font-mono text-emerald-700 font-semibold text-[11px]">{hSub.subjectCode}</span>
                    <span className="font-medium text-slate-800 block truncate mt-0.5">{hSub.subjectName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Semester {hSub.semesterNumber} • Completed</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PROGRAMMING LANGUAGES & LABS */}
      {/* ========================================================================= */}
      {activeTab === 'languages' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-900 text-sm">
                Semester {currentSemNum} Programming Languages & Compilers
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Official languages tied to your current semester practical lab exercises and coding assignments.
              </p>
            </div>
            <button
              onClick={() => onNavigate('coding')}
              className="px-3.5 py-1.5 bg-slate-900 text-white font-medium rounded-lg text-xs hover:bg-slate-800 shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5" /> Launch Interactive Sandbox
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {myLanguages.map((lang) => (
              <div key={lang.id || lang._id || lang.name} className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-slate-900 text-sm">{lang.displayName}</span>
                    <span className="font-mono text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200/60">
                      {lang.fileExtension}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-blue-600 block mt-0.5">
                    {lang.category || 'Core MCA Lab Language'}
                  </span>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                    {lang.description || 'Pre-configured compiler and execution runtime.'}
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                    <div><span className="font-medium text-slate-400">Compiler:</span> {lang.version}</div>
                    <div><span className="font-medium text-slate-400">CLI Command:</span> <code className="font-mono text-blue-700 bg-slate-50 px-1 py-0.2 rounded border border-slate-200/60">{lang.executionCommand}</code></div>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('coding')}
                  className="mt-4 pt-3 border-t border-slate-100 w-full py-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-xs font-medium text-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Terminal className="w-3.5 h-3.5 text-slate-500" /> Open Code Editor
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: APPROVED COURSE MATERIALS (LIBRARY) */}
      {/* ========================================================================= */}
      {activeTab === 'library' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search approved documents by title or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 outline-hidden focus:border-blue-500"
              />
            </div>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700"
            >
              <option value="">All Semesters</option>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
              <option value="3">Semester 3</option>
              <option value="4">Semester 4</option>
            </select>
          </div>

          {filteredDocs.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center text-slate-400">
              <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No approved materials found matching filters.</p>
              <p className="text-xs text-slate-400 mt-1">Students can only access documents officially approved by the HOD for their batch.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDocs.map((doc) => (
                <div key={doc._id} className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/70">
                        {doc.subjectId?.subjectCode} • S{doc.semesterId?.semesterNumber}
                      </span>
                      <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> HOD Approved
                      </span>
                    </div>

                    <h3 className="font-semibold text-slate-900 text-sm mt-2.5 leading-snug">{doc.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {doc.description || 'Comprehensive course syllabus and lecture notes.'}
                    </p>
                    
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <span>Faculty: <strong className="text-slate-700 font-medium">{doc.facultyId?.name}</strong></span>
                      <span className="font-mono text-[11px]">v{doc.currentVersionNumber}.0</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => setPreviewDocId(doc._id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-slate-200/80 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> Read Online
                    </button>
                    <button
                      onClick={() => handleDownload(doc._id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Download PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: AI STUDY NOTES & EXPLANATIONS */}
      {/* ========================================================================= */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          {studyMaterials.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center text-slate-400">
              <GraduationCap className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No study notes published yet.</p>
              <p className="text-xs text-slate-400 mt-1">Study notes and Tamil concept explanations are automatically generated upon HOD approval.</p>
            </div>
          ) : (
            studyMaterials.map((mat) => (
              <div key={mat._id} className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">{mat.title}</h3>
                    <span className="text-xs text-blue-600 font-medium">
                      {mat.subjectId?.subjectName} ({mat.subjectId?.subjectCode})
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80">
                    Official Exam Revision Notes
                  </span>
                </div>

                {/* AI Summary Box */}
                <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-100">
                  <span className="text-xs font-semibold text-blue-900 block mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    AI Concept Summary
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed">{mat.aiSummary}</p>
                </div>

                {/* Unit Breakdown */}
                {mat.sectionWiseSummaries && mat.sectionWiseSummaries.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 block">
                      Unit-Wise Breakdown
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {mat.sectionWiseSummaries.map((sec, idx) => (
                        <div key={idx} className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 text-xs">
                          <span className="font-semibold text-slate-900 block mb-1">{sec.sectionTitle}</span>
                          <p className="text-slate-600 mb-2 leading-relaxed">{sec.summary}</p>
                          {sec.keyPoints && (
                            <ul className="space-y-1">
                              {sec.keyPoints.map((kp, kIdx) => (
                                <li key={kIdx} className="text-slate-700 flex items-start gap-1.5">
                                  <span className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 shrink-0"></span>
                                  <span>{typeof kp === 'object' ? (kp.point || kp.text || JSON.stringify(kp)) : kp}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tamil Explanation */}
                {mat.tamilExplanation && (
                  <div className="p-4 rounded-lg bg-amber-50/60 border border-amber-200/80">
                    <span className="text-xs font-semibold text-amber-900 block mb-1 flex items-center gap-1.5">
                      <Languages className="w-3.5 h-3.5 text-amber-700" />
                      Tamil Concept Explanation (தமிழ் விளக்கம்)
                    </span>
                    <p className="text-xs text-amber-950 leading-relaxed font-sans">{mat.tamilExplanation}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: AI ACADEMIC CHATBOT */}
      {/* ========================================================================= */}
      {activeTab === 'chatbot' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col h-[650px] overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-slate-200/80 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-xs">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900 text-sm">DocuFlow Academic Assistant</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 font-medium">
                    ChatGPT-Style Tutor
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Natural AI conversations grounded on your college's approved syllabus & course materials.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none px-2.5 py-1 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={autoSpeak}
                  onChange={(e) => {
                    setAutoSpeak(e.target.checked);
                    if (!e.target.checked) stopSpeech();
                  }}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                />
                <span className="text-[11px] font-medium text-slate-700 flex items-center gap-1">
                  <Volume2 className="w-3 h-3 text-blue-600" />
                  Auto-Speak
                </span>
              </label>

              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Ollama Active
              </span>
              <button
                type="button"
                onClick={handleClearChat}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-500 hover:text-rose-600 transition-colors text-xs font-medium cursor-pointer"
                title="Reset conversation history"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear Chat</span>
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/30">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.sender === 'student' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-2xs mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`rounded-2xl text-xs leading-relaxed transition-all ${
                    msg.sender === 'student'
                      ? 'bg-blue-600 text-white p-3.5 rounded-tr-xs max-w-xl shadow-2xs ml-12'
                      : 'bg-white text-slate-800 border border-slate-200/90 p-4 rounded-tl-xs max-w-3xl shadow-2xs mr-12 space-y-2'
                  }`}
                >
                  {msg.sender === 'assistant' ? (
                    <div>
                      {/* Assistant Header Metadata */}
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-blue-600" />
                          DocuFlow Academic AI
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {msg.model || 'llama3.2:1b'}
                        </span>
                      </div>

                      {/* Rich Markdown Output */}
                      <MarkdownRenderer content={msg.text} />

                      {/* Provenance Tag: Verified Document */}
                      {msg.sourceType === 'approved_document' && msg.documentReferences && msg.documentReferences.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200/80 text-xs">
                          <div className="flex items-center gap-2 font-medium text-emerald-900">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>
                              Verified Syllabus Source: <strong>{msg.documentReferences[0].title}</strong>
                            </span>
                          </div>
                          <span className="text-[10px] text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200 font-mono self-start sm:self-auto font-medium">
                            College Approved
                          </span>
                        </div>
                      )}

                      {/* Provenance Tag: General Knowledge */}
                      {msg.sourceType === 'general_academic' && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                          <Cpu className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>General Computer Science Knowledge (Standard Academic Curriculum)</span>
                        </div>
                      )}

                      {/* TTS Voice Audio Playback Controls */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 mt-2">
                        {speakingMsgIdx === idx ? (
                          <div className="flex items-center gap-2 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 text-blue-700 text-[11px]">
                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                            <span className="font-medium">{isPaused ? 'Voice Paused' : 'Reading Aloud...'}</span>
                            {isPaused ? (
                              <button
                                type="button"
                                onClick={resumeSpeech}
                                className="p-1 hover:bg-blue-100 rounded text-blue-800 transition-colors cursor-pointer"
                                title="Resume voice playback"
                              >
                                <Play className="w-3 h-3 fill-current" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={pauseSpeech}
                                className="p-1 hover:bg-blue-100 rounded text-blue-800 transition-colors cursor-pointer"
                                title="Pause voice playback"
                              >
                                <Pause className="w-3 h-3 fill-current" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={stopSpeech}
                              className="p-1 hover:bg-rose-100 rounded text-rose-700 transition-colors cursor-pointer"
                              title="Stop audio playback"
                            >
                              <Square className="w-3 h-3 fill-current" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => speakMessage(msg.text, idx)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 border border-slate-200/70 transition-colors cursor-pointer"
                            title="Listen to this explanation (Text-to-Speech)"
                          >
                            <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                            <span>Listen</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <p className="whitespace-pre-wrap flex-1">{msg.text}</p>
                      <User className="w-3.5 h-3.5 text-blue-200 shrink-0 mt-0.5" />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Thinking / Generation Animation */}
            {chatLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-blue-200/80 rounded-2xl rounded-tl-xs p-4 shadow-2xs space-y-2 max-w-md">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                    <span>DocuFlow AI is reasoning & retrieving verified context...</span>
                  </div>
                  <div className="flex items-center gap-1.5 py-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"></span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Local LLM runtime (llama3.2:1b) • RAG Provenance Engine
                  </p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Speech-to-Text Status & Error Banners */}
          {speechError && (
            <div className="px-4 py-2 bg-rose-50 border-t border-rose-200 text-rose-700 text-xs flex items-center justify-between">
              <span>{speechError}</span>
              <button
                type="button"
                onClick={() => setSpeechError('')}
                className="text-rose-600 hover:text-rose-900 font-bold ml-2 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {isListening && (
            <div className="px-4 py-2 bg-rose-50/80 border-t border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-600"></span>
              <span>Listening to your voice... Speak now (transcript populates below for review)</span>
            </div>
          )}

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="p-3 sm:p-3.5 border-t border-slate-200/80 bg-white flex gap-2">
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              disabled={chatLoading}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer shrink-0 flex items-center justify-center ${
                isListening
                  ? 'bg-rose-600 border-rose-600 text-white animate-pulse shadow-md shadow-rose-200'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              title={isListening ? 'Stop listening (click or finish speaking)' : 'Speak your question (Speech-to-Text)'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask an academic question or click mic to speak (e.g., 'Explain OSI Layers')..."
              disabled={chatLoading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-400 disabled:bg-slate-50"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer text-xs shadow-2xs shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask AI</span>
            </button>
          </form>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDocId && (
        <DocumentPreviewModal
          documentId={previewDocId}
          onClose={() => setPreviewDocId(null)}
        />
      )}
    </div>
  );
}
