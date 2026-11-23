import React, { useState, useEffect } from 'react';
import { facultyApi, expertApi } from '../services/api';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import AiReportModal from '../components/AiReportModal';
import DocumentPreviewModal from '../components/DocumentPreviewModal';
import FacultyPasswordSettings from '../components/FacultyPasswordSettings';
import {
  Upload,
  FileText,
  Sparkles,
  RefreshCw,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  Layers,
  Send,
  Plus,
  BookOpen,
  Award,
  CheckSquare,
  XCircle,
  AlertTriangle,
  History,
  ShieldCheck,
  ChevronRight,
  KeyRound,
  Pencil,
  Trash2,
  Download,
  Code2,
  Filter,
  Tag,
  Check,
  Calendar,
  User,
  Hash
} from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  StatCard,
  EmptyState,
  Modal,
  Input,
  Label,
  Textarea,
  Select
} from '../components/ui';

const DOCUMENT_CLASSIFICATIONS = [
  'Syllabus Overview',
  'Unit Notes',
  'Lecture Materials',
  'Question Papers',
  'Assignments',
  'Laboratory Manuals',
  'Programming Materials',
  'Reference Materials',
  'Academic Regulations'
];

const SUBJECT_TYPES = [
  'Theory',
  'Integrated Theory & Lab',
  'Practical / Laboratory',
  'Professional Elective',
  'Mini Project',
  'Main Project & Viva',
  'Internship'
];

export default function FacultyDashboard({ currentSubTab }) {
  // Workspace: 'faculty' (Teaching) | 'expert' (Syllabus/Domain) | 'reviewer' (Review Queue)
  const [currentWorkspace, setCurrentWorkspace] = useState('faculty');

  // Faculty Workspace State
  const [activeTab, setActiveTab] = useState(currentSubTab || 'overview');
  const [documents, setDocuments] = useState([]);
  const [mySubjects, setMySubjects] = useState([]);
  const [metadata, setMetadata] = useState({
    regulations: [],
    semesters: [],
    languages: [],
    batches: []
  });
  const [loading, setLoading] = useState(true);

  // Teaching Subjects Filter State
  const [selectedSubjectSemester, setSelectedSubjectSemester] = useState('all');

  // Add / Edit Subject Modal State
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [isEditSubjectOpen, setIsEditSubjectOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [subjectSubmitting, setSubjectSubmitting] = useState(false);
  const [subjectForm, setSubjectForm] = useState({
    subjectCode: '',
    subjectName: '',
    academicRegulationId: '',
    semesterId: '',
    credits: 3,
    subjectType: 'Theory',
    description: '',
    syllabusSummary: '',
    hasProgramming: false,
    primaryLanguage: 'python',
    programmingLanguages: []
  });

  // Upload Form State
  const [uploadRegId, setUploadRegId] = useState('');
  const [uploadSemId, setUploadSemId] = useState('');
  const [uploadSubjectId, setUploadSubjectId] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [docClassification, setDocClassification] = useState('Lecture Materials');
  const [docUnitCoverage, setDocUnitCoverage] = useState('');
  const [docDesc, setDocDesc] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');

  // Edit Document Metadata Modal State
  const [isEditDocModalOpen, setIsEditDocModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [editDocForm, setEditDocForm] = useState({
    title: '',
    classification: 'Lecture Materials',
    unitCoverage: '',
    description: ''
  });
  const [editDocSubmitting, setEditDocSubmitting] = useState(false);

  // Re-upload State
  const [reuploadDocId, setReuploadDocId] = useState(null);
  const [reuploadFile, setReuploadFile] = useState(null);
  const [reuploadNotes, setReuploadNotes] = useState('');

  // Reviewer Workspace State
  const [reviewerDocs, setReviewerDocs] = useState([]);
  const [reviewHistory, setReviewHistory] = useState([]);
  const [reviewerTab, setReviewerTab] = useState('pending'); // 'pending' | 'history'
  const [reviewingDoc, setReviewingDoc] = useState(null);
  const [reviewDecision, setReviewDecision] = useState('approved');
  const [reviewComments, setReviewComments] = useState('');
  const [contentQuality, setContentQuality] = useState(8);
  const [formattingCorrect, setFormattingCorrect] = useState(true);
  const [syllabusCoverage, setSyllabusCoverage] = useState(true);
  const [correctionInstructions, setCorrectionInstructions] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Modals
  const [previewDocId, setPreviewDocId] = useState(null);
  const [activeAiReport, setActiveAiReport] = useState(null);
  const [activeAiDocTitle, setActiveAiDocTitle] = useState('');

  useEffect(() => {
    if (currentSubTab) {
      if (currentSubTab === 'dashboard') setActiveTab('overview');
      else if (currentSubTab === 'upload') {
        setCurrentWorkspace('faculty');
        setActiveTab('upload');
      } else if (currentSubTab === 'documents') {
        setCurrentWorkspace('faculty');
        setActiveTab('overview');
      } else if (currentSubTab === 'subjects') {
        setCurrentWorkspace('faculty');
        setActiveTab('subjects');
      } else if (currentSubTab === 'settings') {
        setCurrentWorkspace('faculty');
        setActiveTab('settings');
      } else setActiveTab(currentSubTab);
    }
  }, [currentSubTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docsRes, subjectsRes, metaRes, reviewerRes, historyRes] = await Promise.all([
        facultyApi.getMyDocuments().catch(() => ({ data: { success: true, documents: [] } })),
        facultyApi.getMySubjects().catch(() => ({ data: { success: true, subjects: [] } })),
        facultyApi.getMetadata().catch(() => ({ data: { success: true, regulations: [], semesters: [], languages: [], batches: [] } })),
        expertApi.getAssignedDocuments().catch(() => ({ data: { success: true, documents: [] } })),
        expertApi.getReviewHistory().catch(() => ({ data: { success: true, reviews: [] } }))
      ]);

      if (docsRes?.data?.documents) setDocuments(docsRes.data.documents);
      if (subjectsRes?.data?.subjects) setMySubjects(subjectsRes.data.subjects);
      if (metaRes?.data) {
        setMetadata({
          regulations: metaRes.data.regulations || [],
          semesters: metaRes.data.semesters || [],
          languages: metaRes.data.languages || [],
          batches: metaRes.data.batches || []
        });

        if (metaRes.data.regulations?.length > 0) {
          const firstRegId = metaRes.data.regulations[0]._id;
          setUploadRegId(prev => prev || firstRegId);
          setSubjectForm(prev => ({
            ...prev,
            academicRegulationId: prev.academicRegulationId || firstRegId
          }));
        }
      }
      if (reviewerRes?.data?.documents) setReviewerDocs(reviewerRes.data.documents);
      if (historyRes?.data?.reviews) setReviewHistory(historyRes.data.reviews);
    } catch (err) {
      console.error('Failed to load faculty data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const availableUploadSemesters = metadata.semesters.filter(
    s => String(s.academicRegulationId) === String(uploadRegId)
  );

  const availableUploadSubjects = mySubjects.filter(sub => {
    const regMatches = !uploadRegId || String(sub.academicRegulationId?._id || sub.academicRegulationId) === String(uploadRegId);
    const semMatches = !uploadSemId || String(sub.semesterId?._id || sub.semesterId) === String(uploadSemId) || String(sub.semesterNumber) === String(uploadSemId);
    return regMatches && semMatches;
  });

  const handleOpenAddSubject = () => {
    const defaultRegId = metadata.regulations[0]?._id || '';
    const matchingSems = metadata.semesters.filter(s => String(s.academicRegulationId) === String(defaultRegId));
    setSubjectForm({
      subjectCode: '',
      subjectName: '',
      academicRegulationId: defaultRegId,
      semesterId: matchingSems[0]?._id || '',
      credits: 3,
      subjectType: 'Theory',
      description: '',
      syllabusSummary: '',
      hasProgramming: false,
      primaryLanguage: 'python',
      programmingLanguages: []
    });
    setIsAddSubjectOpen(true);
  };

  const handleOpenEditSubject = (sub) => {
    setEditingSubject(sub);
    setSubjectForm({
      subjectCode: sub.subjectCode || '',
      subjectName: sub.subjectName || '',
      academicRegulationId: sub.academicRegulationId?._id || sub.academicRegulationId || '',
      semesterId: sub.semesterId?._id || sub.semesterId || '',
      credits: sub.credits || 3,
      subjectType: sub.subjectType || 'Theory',
      description: sub.description || '',
      syllabusSummary: sub.syllabusSummary || '',
      hasProgramming: !!sub.hasProgramming,
      primaryLanguage: sub.primaryLanguage || 'python',
      programmingLanguages: sub.programmingLanguages || []
    });
    setIsEditSubjectOpen(true);
  };

  const handleCreateSubjectSubmit = async (e) => {
    e.preventDefault();
    if (!subjectForm.subjectCode.trim() || !subjectForm.subjectName.trim()) {
      alert('Subject Code and Subject Name are required.');
      return;
    }
    if (!subjectForm.academicRegulationId || !subjectForm.semesterId) {
      alert('Academic Regulation and Semester must be selected.');
      return;
    }

    setSubjectSubmitting(true);
    try {
      const res = await facultyApi.createSubject(subjectForm);
      if (res.data?.success) {
        alert(res.data.message || 'Subject created successfully!');
        setIsAddSubjectOpen(false);
        await loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to create subject.');
    } finally {
      setSubjectSubmitting(false);
    }
  };

  const handleUpdateSubjectSubmit = async (e) => {
    e.preventDefault();
    if (!editingSubject) return;

    setSubjectSubmitting(true);
    try {
      const res = await facultyApi.updateSubject(editingSubject._id, subjectForm);
      if (res.data?.success) {
        alert('Subject updated successfully!');
        setIsEditSubjectOpen(false);
        setEditingSubject(null);
        await loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to update subject.');
    } finally {
      setSubjectSubmitting(false);
    }
  };

  const handleDeleteSubject = async (sub) => {
    if (!window.confirm(`Are you sure you want to delete "${sub.subjectCode} - ${sub.subjectName}"?`)) {
      return;
    }

    try {
      const res = await facultyApi.deleteSubject(sub._id);
      if (res.data?.success) {
        alert(res.data.message || 'Subject deleted successfully.');
        await loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to delete subject.');
    }
  };

  const handleStartUploadForSubject = (sub) => {
    const regId = sub.academicRegulationId?._id || sub.academicRegulationId;
    const semId = sub.semesterId?._id || sub.semesterId;
    setUploadRegId(regId);
    setUploadSemId(semId);
    setUploadSubjectId(sub._id);
    setActiveTab('upload');
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please choose a document file (.pdf, .docx, .doc, or .txt).');
      return;
    }
    if (!uploadRegId) {
      alert('Please select an Academic Regulation.');
      return;
    }
    if (!uploadSemId) {
      alert('Please select an Academic Semester.');
      return;
    }
    if (!uploadSubjectId) {
      alert('Please select an Assigned Course / Subject.');
      return;
    }
    if (!docTitle.trim()) {
      alert('Please enter a Document Title.');
      return;
    }

    setUploading(true);
    setUploadSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', docTitle.trim());
      formData.append('classification', docClassification);
      formData.append('documentType', docClassification.toLowerCase().replace(/\s+/g, '_'));
      formData.append('unitCoverage', docUnitCoverage.trim());
      formData.append('description', docDesc.trim());
      formData.append('academicRegulationId', uploadRegId);
      formData.append('semesterId', uploadSemId);
      formData.append('subjectId', uploadSubjectId);

      const res = await facultyApi.uploadDocument(formData);
      if (res.data?.success) {
        setUploadSuccessMsg(`"${docTitle}" uploaded successfully! Local AI verification audit triggered.`);
        setDocTitle('');
        setDocUnitCoverage('');
        setDocDesc('');
        setSelectedFile(null);
        await loadData();
        setTimeout(() => {
          setActiveTab('overview');
          setUploadSuccessMsg('');
        }, 1600);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleOpenEditDoc = (doc) => {
    setEditingDoc(doc);
    setEditDocForm({
      title: doc.title || '',
      classification: doc.classification || doc.documentType?.replace('_', ' ') || 'Lecture Materials',
      unitCoverage: doc.unitCoverage || '',
      description: doc.description || ''
    });
    setIsEditDocModalOpen(true);
  };

  const handleUpdateDocSubmit = async (e) => {
    e.preventDefault();
    if (!editingDoc) return;

    setEditDocSubmitting(true);
    try {
      const res = await facultyApi.updateDocument(editingDoc._id, editDocForm);
      if (res.data?.success) {
        alert('Document metadata updated successfully!');
        setIsEditDocModalOpen(false);
        setEditingDoc(null);
        await loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to update document metadata.');
    } finally {
      setEditDocSubmitting(false);
    }
  };

  const handleDeleteDoc = async (doc) => {
    if (!window.confirm(`Are you sure you want to delete document "${doc.title}" and its version history?`)) {
      return;
    }

    try {
      const res = await facultyApi.deleteDocument(doc._id);
      if (res.data?.success) {
        alert(res.data.message || 'Document deleted successfully.');
        await loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to delete document.');
    }
  };

  const handleDownloadDoc = async (doc) => {
    try {
      const res = await api.get(`/documents/${doc._id}/download`, { responseType: 'blob' });
      const filename = doc?.currentVersionId?.originalFilename || `${doc.title || 'document'}.pdf`;
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
      const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';
      const url = `${apiBase}/documents/${doc._id}/download?token=${encodeURIComponent(token || '')}`;
      window.open(url, '_blank');
    }
  };

  const handleReuploadSubmit = async (e) => {
    e.preventDefault();
    if (!reuploadFile) {
      alert('Please attach the revised file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', reuploadFile);
      formData.append('uploadNotes', reuploadNotes || 'Corrected submission as requested by expert.');

      const res = await facultyApi.reuploadDocument(reuploadDocId, formData);
      if (res.data?.success) {
        alert(res.data.message);
        setReuploadDocId(null);
        setReuploadFile(null);
        setReuploadNotes('');
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Re-upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleViewAiReport = async (docId, title) => {
    try {
      const res = await facultyApi.getDocumentDetails(docId);
      if (res.data?.success && res.data.aiReports && res.data.aiReports.length > 0) {
        setActiveAiReport(res.data.aiReports[0]);
        setActiveAiDocTitle(title);
      } else {
        alert('AI verification is currently processing for this document. Please check back in a few moments.');
      }
    } catch (e) {
      alert('Could not retrieve AI report.');
    }
  };

  const handleOpenReview = (doc) => {
    setReviewingDoc(doc);
    setReviewDecision('approved');
    setReviewComments('Comprehensive, accurate, and syllabus compliant.');
    setContentQuality(8);
    setFormattingCorrect(true);
    setSyllabusCoverage(true);
    setCorrectionInstructions('');
    setRejectionReason('');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewComments.trim()) {
      alert('Review comments are mandatory.');
      return;
    }

    setSubmittingReview(true);
    try {
      const payload = {
        decision: reviewDecision,
        comments: reviewComments,
        contentQuality: Number(contentQuality),
        formattingCorrect,
        syllabusCoverage,
        correctionInstructions,
        rejectionReason
      };

      const res = await expertApi.submitReview(reviewingDoc._id, payload);
      if (res.data?.success) {
        alert(res.data.message || 'Review submitted successfully!');
        setReviewingDoc(null);
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Review submission failed');
    } finally {
      setSubmittingReview(false);
    }
  };

  const displayedSubjects = mySubjects.filter(s => {
    if (selectedSubjectSemester === 'all') return true;
    return String(s.semesterNumber) === selectedSubjectSemester;
  });

  const pendingDocsCount = documents.filter(d => ['Pending Expert Review', 'Expert Reviewing', 'Pending HOD Approval', 'AI Processing'].includes(d.status)).length;
  const publishedDocsCount = documents.filter(d => ['Published', 'HOD Approved'].includes(d.status)).length;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Workspace Selection Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <h1 className="text-base font-semibold text-slate-900 tracking-tight">
                Faculty Academic Workspace
              </h1>
            </div>
            <p className="text-xs text-slate-500 font-normal mt-1 ml-9">
              Self-service teaching subjects, document uploads, and curriculum management for Autonomous MCA.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-lg border border-slate-200/70 self-start sm:self-auto">
            <button
              onClick={() => setCurrentWorkspace('faculty')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                currentWorkspace === 'faculty'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Teaching</span>
            </button>
            <button
              onClick={() => setCurrentWorkspace('reviewer')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                currentWorkspace === 'reviewer'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Reviewer ({reviewerDocs.length})</span>
            </button>
            <button
              onClick={() => {
                setCurrentWorkspace('faculty');
                setActiveTab('settings');
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Security Settings"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Security</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. TEACHING WORKSPACE */}
      {/* ========================================================================= */}
      {currentWorkspace === 'faculty' && (
        <div className="space-y-5">
          {/* Sub Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'overview', label: `My Submissions (${documents.length})` },
                { id: 'upload', label: 'Upload Document' },
                { id: 'subjects', label: `Teaching Subjects (${mySubjects.length})` },
                { id: 'settings', label: 'Account Security' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'subjects' && (
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={handleOpenAddSubject}
              >
                Add Teaching Subject
              </Button>
            )}
          </div>

          {/* TAB 1: OVERVIEW & SUBMISSIONS */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Stat Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                  label="Teaching Subjects"
                  value={mySubjects.length}
                  icon={BookOpen}
                  subtext="Authorized courses"
                />
                <StatCard
                  label="Total Submissions"
                  value={documents.length}
                  icon={FileText}
                  subtext="Uploaded versions"
                />
                <StatCard
                  label="Pending Review"
                  value={pendingDocsCount}
                  icon={Clock}
                  badge={pendingDocsCount > 0 ? 'Action Req' : 'Clear'}
                  badgeColor={pendingDocsCount > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'}
                  subtext="In review pipeline"
                />
                <StatCard
                  label="Published to Students"
                  value={publishedDocsCount}
                  icon={CheckCircle}
                  badge="Approved"
                  badgeColor="bg-emerald-50 text-emerald-700 border-emerald-200"
                  subtext="Accessible in library"
                />
              </div>

              {/* Submissions Table Card */}
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>Uploaded Academic Documents</CardTitle>
                    <CardDescription>Track status from initial upload through AI audit, expert peer review, and final HOD publication.</CardDescription>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Upload}
                    onClick={() => setActiveTab('upload')}
                  >
                    Upload New
                  </Button>
                </CardHeader>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-2.5">Document Details</th>
                        <th className="px-4 py-2.5">Subject & Code</th>
                        <th className="px-4 py-2.5">Semester</th>
                        <th className="px-4 py-2.5">Version</th>
                        <th className="px-4 py-2.5">Current Status</th>
                        <th className="px-4 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        <tr>
                          <td colSpan="6" className="text-center py-10 text-slate-400">
                            <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                            <span>Loading documents...</span>
                          </td>
                        </tr>
                      ) : documents.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="p-4">
                            <EmptyState
                              icon={FileText}
                              title="No documents uploaded yet"
                              description="Upload your course lecture notes, syllabus overviews, or question banks to begin AI verification."
                              action={
                                <Button variant="primary" size="sm" icon={Upload} onClick={() => setActiveTab('upload')}>
                                  Upload First Document
                                </Button>
                              }
                            />
                          </td>
                        </tr>
                      ) : (
                        documents.map((doc) => (
                          <tr key={doc._id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-4 py-3">
                              <span className="font-semibold text-slate-900 block">{doc.title}</span>
                              <span className="text-[11px] text-slate-400 capitalize">
                                {doc.classification || doc.documentType?.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-700">
                              <span>{doc.subjectId?.subjectName || 'Course'}</span>
                              <span className="text-[10px] text-slate-400 font-mono block">
                                {doc.subjectId?.subjectCode}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              Sem {doc.semesterId?.semesterNumber || 1}
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-mono text-slate-700 font-medium bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[11px]">
                                v{doc.currentVersionNumber}.0
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={doc.status} />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  icon={Sparkles}
                                  onClick={() => handleViewAiReport(doc._id, doc.title)}
                                  title="Inspect AI Verification Audit"
                                >
                                  AI Report
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  icon={Eye}
                                  onClick={() => setPreviewDocId(doc._id)}
                                  title="Preview Document"
                                >
                                  Preview
                                </Button>
                                {['Correction Required', 'Expert Rejected', 'HOD Rejected'].includes(doc.status) && (
                                  <Button
                                    variant="brand"
                                    size="sm"
                                    icon={RefreshCw}
                                    onClick={() => setReuploadDocId(doc._id)}
                                  >
                                    Re-upload
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenEditDoc(doc)}
                                  title="Edit Document Details"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-slate-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteDoc(doc)}
                                  title="Delete Document"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 2: UPLOAD DOCUMENT FORM */}
          {activeTab === 'upload' && (
            <Card className="max-w-3xl mx-auto">
              <CardHeader>
                <div>
                  <CardTitle>Upload Academic Material</CardTitle>
                  <CardDescription>
                    Provide course metadata and upload lecture materials (.pdf, .docx, .doc, .txt) for automated AI verification.
                  </CardDescription>
                </div>
              </CardHeader>

              <form onSubmit={handleUploadSubmit}>
                <CardContent className="space-y-4">
                  {uploadSuccessMsg && (
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{uploadSuccessMsg}</span>
                    </div>
                  )}

                  {/* Regulation & Semester Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="upload-reg" required>Academic Regulation</Label>
                      <Select
                        id="upload-reg"
                        value={uploadRegId}
                        onChange={(e) => {
                          setUploadRegId(e.target.value);
                          setUploadSemId('');
                          setUploadSubjectId('');
                        }}
                      >
                        <option value="">Select Regulation</option>
                        {metadata.regulations.map((reg) => (
                          <option key={reg._id} value={reg._id}>
                            {reg.name} ({reg.code})
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="upload-sem" required>Academic Semester</Label>
                      <Select
                        id="upload-sem"
                        value={uploadSemId}
                        onChange={(e) => {
                          setUploadSemId(e.target.value);
                          setUploadSubjectId('');
                        }}
                      >
                        <option value="">Select Semester</option>
                        {availableUploadSemesters.map((sem) => (
                          <option key={sem._id} value={sem._id}>
                            Semester {sem.semesterNumber} ({sem.semesterType})
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  {/* Course / Subject */}
                  <div>
                    <Label htmlFor="upload-subj" required>Teaching Subject</Label>
                    <Select
                      id="upload-subj"
                      value={uploadSubjectId}
                      onChange={(e) => setUploadSubjectId(e.target.value)}
                    >
                      <option value="">Select Assigned Subject</option>
                      {availableUploadSubjects.map((sub) => (
                        <option key={sub._id} value={sub._id}>
                          {sub.subjectCode} — {sub.subjectName} ({sub.subjectType || 'Theory'})
                        </option>
                      ))}
                    </Select>
                    {availableUploadSubjects.length === 0 && (
                      <p className="text-[11px] text-amber-700 mt-1">
                        No subjects found matching this regulation & semester. You can create one in the "Teaching Subjects" tab.
                      </p>
                    )}
                  </div>

                  {/* Document Title & Classification */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="upload-title" required>Document Title</Label>
                      <Input
                        id="upload-title"
                        type="text"
                        required
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        placeholder="e.g. Unit 1 - Network Architecture & OSI Reference Model"
                      />
                    </div>

                    <div>
                      <Label htmlFor="upload-class" required>Material Classification</Label>
                      <Select
                        id="upload-class"
                        value={docClassification}
                        onChange={(e) => setDocClassification(e.target.value)}
                      >
                        {DOCUMENT_CLASSIFICATIONS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  {/* Unit Coverage */}
                  <div>
                    <Label htmlFor="upload-units">Syllabus / Unit Coverage</Label>
                    <Input
                      id="upload-units"
                      type="text"
                      value={docUnitCoverage}
                      onChange={(e) => setDocUnitCoverage(e.target.value)}
                      placeholder="e.g. Unit 1 (Sections 1.1 to 1.6)"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <Label htmlFor="upload-desc">Brief Description / Notes</Label>
                    <Textarea
                      id="upload-desc"
                      rows={2}
                      value={docDesc}
                      onChange={(e) => setDocDesc(e.target.value)}
                      placeholder="Provide educational context, prerequisites, or topics covered..."
                    />
                  </div>

                  {/* File Upload Box */}
                  <div>
                    <Label required>Upload Document File (.pdf, .docx, .doc, .txt)</Label>
                    <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 text-center hover:bg-slate-50 transition-colors">
                      <input
                        type="file"
                        id="faculty-doc-file"
                        accept=".pdf,.docx,.doc,.txt"
                        onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                        className="hidden"
                      />
                      <label htmlFor="faculty-doc-file" className="cursor-pointer block space-y-2">
                        <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center mx-auto text-slate-500 shadow-2xs">
                          <Upload className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-blue-600 hover:underline">Choose file</span>
                          <span className="text-xs text-slate-500"> or drag and drop here</span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-normal">
                          Max 50MB. Supported formats: PDF, Microsoft Word, Plain Text
                        </p>
                      </label>
                      {selectedFile && (
                        <div className="mt-3 p-2 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 flex items-center justify-between max-w-md mx-auto">
                          <span className="truncate font-medium">{selectedFile.name}</span>
                          <span className="text-[11px] text-slate-400 shrink-0">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    loading={uploading}
                    icon={Upload}
                    className="w-full text-xs font-medium py-2.5 mt-2"
                  >
                    Submit Document for Verification
                  </Button>
                </CardContent>
              </form>
            </Card>
          )}

          {/* TAB 3: TEACHING SUBJECTS */}
          {activeTab === 'subjects' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-600 font-medium">Filter Semester:</span>
                  <div className="flex gap-1">
                    {['all', '1', '2', '3', '4'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedSubjectSemester(s)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                          selectedSubjectSemester === s
                            ? 'bg-slate-900 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {s === 'all' ? 'All Semesters' : `Sem ${s}`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-slate-500">
                  Showing {displayedSubjects.length} of {mySubjects.length} subjects
                </div>
              </div>

              {/* Subjects Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {displayedSubjects.length === 0 ? (
                  <div className="col-span-full">
                    <EmptyState
                      icon={BookOpen}
                      title="No teaching subjects assigned"
                      description="You can independently create new courses under your authorized department and regulation."
                      action={
                        <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAddSubject}>
                          Add First Subject
                        </Button>
                      }
                    />
                  </div>
                ) : (
                  displayedSubjects.map((sub) => (
                    <Card key={sub._id} hoverable className="flex flex-col justify-between">
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/80">
                            {sub.subjectCode}
                          </span>
                          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {sub.credits} Credits • {sub.subjectType || 'Theory'}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold text-slate-900 leading-snug">{sub.subjectName}</h4>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 font-normal">
                            {sub.description || sub.syllabusSummary || 'No specific description specified.'}
                          </p>
                        </div>

                        {/* Languages Badges */}
                        {sub.programmingLanguages && sub.programmingLanguages.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {sub.programmingLanguages.map((l, i) => (
                              <span key={i} className="text-[10px] font-mono font-medium px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded border border-slate-200/70">
                                {l}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="px-4 py-2.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Upload}
                          onClick={() => handleStartUploadForSubject(sub)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          Upload Material
                        </Button>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditSubject(sub)}
                            title="Edit Subject"
                          >
                            <Pencil className="w-3.5 h-3.5 text-slate-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteSubject(sub)}
                            title="Delete Subject"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ACCOUNT SECURITY */}
          {activeTab === 'settings' && (
            <FacultyPasswordSettings />
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. REVIEWER WORKSPACE */}
      {/* ========================================================================= */}
      {currentWorkspace === 'reviewer' && (
        <div className="space-y-5">
          <div className="flex items-center gap-1.5 border-b border-slate-200/80 pb-2">
            <button
              onClick={() => setReviewerTab('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                reviewerTab === 'pending'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Assigned Reviews ({reviewerDocs.length})
            </button>
            <button
              onClick={() => setReviewerTab('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                reviewerTab === 'history'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Past Review Decisions ({reviewHistory.length})
            </button>
          </div>

          {reviewerTab === 'pending' && (
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Assigned Peer Review Workload</CardTitle>
                  <CardDescription>Academic documents assigned to your profile for domain evaluation and syllabus verification.</CardDescription>
                </div>
              </CardHeader>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-2.5">Document Title</th>
                      <th className="px-4 py-2.5">Faculty</th>
                      <th className="px-4 py-2.5">Subject</th>
                      <th className="px-4 py-2.5">Version</th>
                      <th className="px-4 py-2.5">Current Status</th>
                      <th className="px-4 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reviewerDocs.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-4">
                          <EmptyState
                            icon={CheckSquare}
                            title="No peer reviews assigned"
                            description="When faculty submit documents for subjects you review, assignments will appear here."
                          />
                        </td>
                      </tr>
                    ) : (
                      reviewerDocs.map((doc) => (
                        <tr key={doc._id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3">
                            <span className="font-semibold text-slate-900 block">{doc.title}</span>
                            <span className="text-[11px] text-slate-400 capitalize">{doc.documentType?.replace('_', ' ')}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-700 font-medium">{doc.facultyId?.name}</td>
                          <td className="px-4 py-3 text-slate-700">
                            <span>{doc.subjectId?.subjectName}</span>
                            <span className="text-[10px] text-slate-400 font-mono block">{doc.subjectId?.subjectCode}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-slate-700 font-medium bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[11px]">
                              v{doc.currentVersionNumber}.0
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={doc.status} />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="secondary"
                                size="sm"
                                icon={Eye}
                                onClick={() => setPreviewDocId(doc._id)}
                              >
                                Preview
                              </Button>
                              <Button
                                variant="primary"
                                size="sm"
                                icon={CheckSquare}
                                onClick={() => handleOpenReview(doc)}
                              >
                                Conduct Review
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {reviewerTab === 'history' && (
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Review Decision History</CardTitle>
                  <CardDescription>All academic review decisions previously submitted by your profile.</CardDescription>
                </div>
              </CardHeader>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Document</th>
                      <th className="px-4 py-2.5">Faculty</th>
                      <th className="px-4 py-2.5">Decision</th>
                      <th className="px-4 py-2.5">Comments</th>
                      <th className="px-4 py-2.5">Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reviewHistory.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-4">
                          <EmptyState
                            icon={History}
                            title="No past review decisions"
                            description="Historical evaluations and peer reviews will be listed here."
                          />
                        </td>
                      </tr>
                    ) : (
                      reviewHistory.map((rev) => (
                        <tr key={rev._id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                            {new Date(rev.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-900">{rev.documentId?.title}</td>
                          <td className="px-4 py-3 text-slate-700">{rev.documentId?.facultyId?.name}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase border ${
                              rev.decision === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {rev.decision}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 max-w-sm truncate italic font-normal">"{rev.comments}"</td>
                          <td className="px-4 py-3 font-semibold text-slate-800">{rev.structuralEvaluation?.contentQuality || 8}/10</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Add / Edit Subject Modal */}
      {(isAddSubjectOpen || isEditSubjectOpen) && (
        <Modal
          isOpen={isAddSubjectOpen || isEditSubjectOpen}
          onClose={() => {
            setIsAddSubjectOpen(false);
            setIsEditSubjectOpen(false);
            setEditingSubject(null);
          }}
          title={isEditSubjectOpen ? `Edit Subject: ${editingSubject?.subjectCode}` : 'Create Teaching Subject'}
          description="Independent faculty subject creation under authorized department & regulations."
          maxWidth="max-w-xl"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsAddSubjectOpen(false);
                  setIsEditSubjectOpen(false);
                  setEditingSubject(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={subjectSubmitting}
                onClick={isEditSubjectOpen ? handleUpdateSubjectSubmit : handleCreateSubjectSubmit}
              >
                {isEditSubjectOpen ? 'Save Changes' : 'Create Subject'}
              </Button>
            </div>
          }
        >
          <form onSubmit={isEditSubjectOpen ? handleUpdateSubjectSubmit : handleCreateSubjectSubmit} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="sub-code" required>Subject Code</Label>
                <Input
                  id="sub-code"
                  type="text"
                  required
                  value={subjectForm.subjectCode}
                  onChange={(e) => setSubjectForm({ ...subjectForm, subjectCode: e.target.value.toUpperCase() })}
                  placeholder="e.g. 24MCA101"
                  className="uppercase font-mono"
                />
              </div>

              <div>
                <Label htmlFor="sub-name" required>Subject Name</Label>
                <Input
                  id="sub-name"
                  type="text"
                  required
                  value={subjectForm.subjectName}
                  onChange={(e) => setSubjectForm({ ...subjectForm, subjectName: e.target.value })}
                  placeholder="e.g. Advanced Operating Systems"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="sub-reg" required>Regulation</Label>
                <Select
                  id="sub-reg"
                  value={subjectForm.academicRegulationId}
                  onChange={(e) => setSubjectForm({ ...subjectForm, academicRegulationId: e.target.value })}
                >
                  <option value="">Select Regulation</option>
                  {metadata.regulations.map((r) => (
                    <option key={r._id} value={r._id}>{r.name} ({r.code})</option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="sub-sem" required>Semester</Label>
                <Select
                  id="sub-sem"
                  value={subjectForm.semesterId}
                  onChange={(e) => setSubjectForm({ ...subjectForm, semesterId: e.target.value })}
                >
                  <option value="">Select Semester</option>
                  {metadata.semesters.map((s) => (
                    <option key={s._id} value={s._id}>Semester {s.semesterNumber}</option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="sub-credits" required>Credits</Label>
                <Input
                  id="sub-credits"
                  type="number"
                  min="1"
                  max="10"
                  value={subjectForm.credits}
                  onChange={(e) => setSubjectForm({ ...subjectForm, credits: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="sub-type" required>Subject Type</Label>
                <Select
                  id="sub-type"
                  value={subjectForm.subjectType}
                  onChange={(e) => setSubjectForm({ ...subjectForm, subjectType: e.target.value })}
                >
                  {SUBJECT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              </div>

              <div className="flex flex-col justify-center pt-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={subjectForm.hasProgramming}
                    onChange={(e) => setSubjectForm({ ...subjectForm, hasProgramming: e.target.checked })}
                    className="h-3.5 w-3.5 text-blue-600 rounded"
                  />
                  <span className="font-medium text-slate-800 text-xs">Coding Practice Sandbox Available</span>
                </label>
              </div>
            </div>

            <div>
              <Label htmlFor="sub-desc">Description</Label>
              <Textarea
                id="sub-desc"
                rows={2}
                value={subjectForm.description}
                onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                placeholder="Brief summary of course content and learning goals..."
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Document Metadata Modal */}
      {isEditDocModalOpen && editingDoc && (
        <Modal
          isOpen={isEditDocModalOpen}
          onClose={() => {
            setIsEditDocModalOpen(false);
            setEditingDoc(null);
          }}
          title="Edit Document Metadata"
          description={`Update details for "${editingDoc.title}"`}
          maxWidth="max-w-lg"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsEditDocModalOpen(false);
                  setEditingDoc(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={editDocSubmitting}
                onClick={handleUpdateDocSubmit}
              >
                Save Updates
              </Button>
            </div>
          }
        >
          <form onSubmit={handleUpdateDocSubmit} className="space-y-3.5 text-xs">
            <div>
              <Label htmlFor="edit-doc-title" required>Document Title</Label>
              <Input
                id="edit-doc-title"
                type="text"
                required
                value={editDocForm.title}
                onChange={(e) => setEditDocForm({ ...editDocForm, title: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-doc-class" required>Material Classification</Label>
              <Select
                id="edit-doc-class"
                value={editDocForm.classification}
                onChange={(e) => setEditDocForm({ ...editDocForm, classification: e.target.value })}
              >
                {DOCUMENT_CLASSIFICATIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-doc-units">Unit / Syllabus Coverage</Label>
              <Input
                id="edit-doc-units"
                type="text"
                value={editDocForm.unitCoverage}
                onChange={(e) => setEditDocForm({ ...editDocForm, unitCoverage: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-doc-desc">Description</Label>
              <Textarea
                id="edit-doc-desc"
                rows={2}
                value={editDocForm.description}
                onChange={(e) => setEditDocForm({ ...editDocForm, description: e.target.value })}
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Re-upload Document Modal */}
      {reuploadDocId && (
        <Modal
          isOpen={!!reuploadDocId}
          onClose={() => {
            setReuploadDocId(null);
            setReuploadFile(null);
            setReuploadNotes('');
          }}
          title="Re-upload Corrected Document (New Version)"
          description="Upload an updated file following reviewer or HOD feedback. Previous versions are strictly preserved."
          maxWidth="max-w-lg"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setReuploadDocId(null);
                  setReuploadFile(null);
                  setReuploadNotes('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={uploading}
                icon={Upload}
                onClick={handleReuploadSubmit}
              >
                Submit New Version
              </Button>
            </div>
          }
        >
          <form onSubmit={handleReuploadSubmit} className="space-y-3.5 text-xs">
            <div>
              <Label required>Choose Revised File (.pdf, .docx, .doc, .txt)</Label>
              <Input
                type="file"
                required
                accept=".pdf,.docx,.doc,.txt"
                onChange={(e) => setReuploadFile(e.target.files[0] || null)}
              />
            </div>

            <div>
              <Label htmlFor="reupload-notes">Correction Notes</Label>
              <Textarea
                id="reupload-notes"
                rows={3}
                value={reuploadNotes}
                onChange={(e) => setReuploadNotes(e.target.value)}
                placeholder="Explain how expert or HOD correction instructions were resolved in this revised version..."
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Reviewer Workspace Modal */}
      {reviewingDoc && (
        <Modal
          isOpen={!!reviewingDoc}
          onClose={() => setReviewingDoc(null)}
          title="Peer Review Evaluation"
          description={`Reviewing "${reviewingDoc.title}" (${reviewingDoc.subjectId?.subjectName || ''})`}
          maxWidth="max-w-xl"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setReviewingDoc(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={submittingReview}
                icon={Send}
                onClick={handleSubmitReview}
              >
                Confirm Decision
              </Button>
            </div>
          }
        >
          <form onSubmit={handleSubmitReview} className="space-y-3.5 text-xs">
            <div>
              <Label required>Review Decision</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'approved', label: 'Approve', color: 'border-emerald-500 bg-emerald-50 text-emerald-800' },
                  { id: 'correction_required', label: 'Corrections', color: 'border-amber-500 bg-amber-50 text-amber-800' },
                  { id: 'rejected', label: 'Reject', color: 'border-rose-500 bg-rose-50 text-rose-800' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setReviewDecision(item.id)}
                    className={`py-2 px-3 rounded-lg border text-center font-medium transition-colors cursor-pointer ${
                      reviewDecision === item.id ? `${item.color} shadow-2xs` : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="rev-comm" required>Review Comments</Label>
              <Textarea
                id="rev-comm"
                required
                rows={3}
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                placeholder="Detail your evaluation of academic accuracy, syllabus coverage, and formatting..."
              />
            </div>

            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <Label htmlFor="rev-rating">Rating (1-10)</Label>
                <Input
                  id="rev-rating"
                  type="number"
                  min="1"
                  max="10"
                  value={contentQuality}
                  onChange={(e) => setContentQuality(e.target.value)}
                />
              </div>
              <div className="flex flex-col justify-center pt-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formattingCorrect}
                    onChange={(e) => setFormattingCorrect(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span className="text-xs text-slate-700">Formatting Valid</span>
                </label>
              </div>
              <div className="flex flex-col justify-center pt-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syllabusCoverage}
                    onChange={(e) => setSyllabusCoverage(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span className="text-xs text-slate-700">Syllabus Complete</span>
                </label>
              </div>
            </div>

            {reviewDecision === 'correction_required' && (
              <div>
                <Label htmlFor="rev-corr" required className="text-amber-800">Correction Instructions</Label>
                <Textarea
                  id="rev-corr"
                  rows={2}
                  value={correctionInstructions}
                  onChange={(e) => setCorrectionInstructions(e.target.value)}
                  placeholder="Specify missing content or corrections required..."
                  className="border-amber-300 bg-amber-50/20"
                />
              </div>
            )}

            {reviewDecision === 'rejected' && (
              <div>
                <Label htmlFor="rev-rej" required className="text-rose-800">Rejection Reason</Label>
                <Input
                  id="rev-rej"
                  type="text"
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="State the reason for rejecting document..."
                  className="border-rose-300 bg-rose-50/20"
                />
              </div>
            )}
          </form>
        </Modal>
      )}

      {/* AI Report Modal */}
      {activeAiReport && (
        <AiReportModal
          report={activeAiReport}
          documentTitle={activeAiDocTitle}
          onClose={() => setActiveAiReport(null)}
        />
      )}

      {/* Preview Modal */}
      {previewDocId && (
        <DocumentPreviewModal
          documentId={previewDocId}
          onClose={() => setPreviewDocId(null)}
        />
      )}
    </div>
  );
}
