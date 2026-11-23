import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { hodApi, analyticsApi } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import AiReportModal from '../components/AiReportModal';
import DocumentPreviewModal from '../components/DocumentPreviewModal';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Select,
  Label,
  Textarea,
  Modal,
  EmptyState,
  StatCard,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '../components/ui';
import {
  CheckCircle2,
  XCircle,
  FileText,
  Sparkles,
  Eye,
  History,
  TrendingUp,
  Award,
  Layers,
  GraduationCap,
  Users,
  Settings,
  Plus,
  Pencil,
  BookOpen,
  Calendar,
  ShieldCheck,
  UserCheck,
  RefreshCw,
  AlertCircle,
  Code2,
  Trash2,
  Clock,
  ArrowRight,
  Sliders,
  Filter
} from 'lucide-react';

export default function HodDashboard({ currentSubTab }) {
  const { user } = useAuth();
  const canEditRegulations = user && (user.role === 'hod' || user.role === 'admin');
  const [activeTab, setActiveTab] = useState('approvals');
  const [pendingDocs, setPendingDocs] = useState([]);
  const [approvalHistory, setApprovalHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Academic Management State
  const [regulations, setRegulations] = useState([]);
  const [batches, setBatches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [semesters, setSemesters] = useState([]);

  // Assignments & Faculty Directory State
  const [facultyAssignments, setFacultyAssignments] = useState([]);
  const [expertAssignments, setExpertAssignments] = useState([]);
  const [facultyList, setFacultyList] = useState([]);

  // Approval Modal State
  const [approvingDoc, setApprovingDoc] = useState(null);
  const [decision, setDecision] = useState('approved');
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modals for Academic Configuration
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [regForm, setRegForm] = useState({ name: '', code: '', description: '', startYear: 2026, endYear: 2027 });

  // Edit Regulation Modal State
  const [isEditRegModalOpen, setIsEditRegModalOpen] = useState(false);
  const [editingRegId, setEditingRegId] = useState(null);
  const [editRegForm, setEditRegForm] = useState({
    name: '',
    code: '',
    academicYear: '',
    studyLevel: 'PG / MCA (Semesters 1-4)',
    startYear: 2026,
    endYear: 2027,
    status: 'Active',
    description: ''
  });
  const [editRegLoading, setEditRegLoading] = useState(false);
  const [editRegSubmitting, setEditRegSubmitting] = useState(false);
  const [editRegError, setEditRegError] = useState('');

  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchForm, setBatchForm] = useState({ batchName: '', academicRegulationId: '', startYear: 2024, endYear: 2026, department: 'MCA', currentSemester: 1 });

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [subjectForm, setSubjectForm] = useState({ subjectCode: '', subjectName: '', academicRegulationId: '', semesterId: '', semesterNumber: 1, credits: 3, description: '', hasProgramming: true, primaryLanguage: 'python' });

  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [yearForm, setYearForm] = useState({ yearName: '', code: '', startDate: '', endDate: '', isCurrent: true });

  // Assignment Modals
  const [isAssignFacultyOpen, setIsAssignFacultyOpen] = useState(false);
  const [assignFacultyForm, setAssignFacultyForm] = useState({ facultyId: '', subjectId: '', batchId: '', academicYearId: '' });

  const [isAssignExpertOpen, setIsAssignExpertOpen] = useState(false);
  const [assignExpertForm, setAssignExpertForm] = useState({ expertId: '', subjectId: '', academicYearId: '' });

  // Workload, Students, and Subject Filter State
  const [workloads, setWorkloads] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedSubjectSemester, setSelectedSubjectSemester] = useState('all');
  const [autoAllocating, setAutoAllocating] = useState(false);
  const [autoAllocMsg, setAutoAllocMsg] = useState('');

  // AI & Preview Modals
  const [previewDocId, setPreviewDocId] = useState(null);
  const [activeAiReport, setActiveAiReport] = useState(null);
  const [activeAiDocTitle, setActiveAiDocTitle] = useState('');

  // Sync with sidebar navigation
  useEffect(() => {
    if (currentSubTab) {
      if (currentSubTab === 'dashboard' || currentSubTab === 'approvals') {
        setActiveTab('approvals');
      } else if (['academic', 'workload', 'students', 'assignments', 'faculty', 'catalog'].includes(currentSubTab)) {
        setActiveTab(currentSubTab);
      }
    }
  }, [currentSubTab]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [pendRes, histRes, anaRes, regRes, batchRes, subRes, yearRes, facAssRes, expAssRes, facListRes, semRes, workRes, stuRes] = await Promise.all([
        hodApi.getPendingApprovals().catch(() => ({ data: { documents: [] } })),
        hodApi.getApprovalHistory().catch(() => ({ data: { approvals: [] } })),
        analyticsApi.getAnalytics().catch(() => ({ data: { analytics: null } })),
        hodApi.getRegulations().catch(() => ({ data: { regulations: [] } })),
        hodApi.getBatches().catch(() => ({ data: { batches: [] } })),
        hodApi.getSubjects().catch(() => ({ data: { subjects: [] } })),
        hodApi.getAcademicYears().catch(() => ({ data: { academicYears: [] } })),
        hodApi.getFacultyAssignments().catch(() => ({ data: { assignments: [] } })),
        hodApi.getExpertAssignments().catch(() => ({ data: { assignments: [] } })),
        hodApi.getFacultyList().catch(() => ({ data: { faculty: [] } })),
        hodApi.getSemesters().catch(() => ({ data: { semesters: [] } })),
        hodApi.getFacultyWorkloads().catch(() => ({ data: { workloads: [] } })),
        hodApi.getStudents().catch(() => ({ data: { students: [] } }))
      ]);

      if (pendRes.data?.documents) setPendingDocs(pendRes.data.documents);
      if (histRes.data?.approvals) setApprovalHistory(histRes.data.approvals);
      if (anaRes.data?.analytics) setAnalytics(anaRes.data.analytics);
      if (regRes.data?.regulations) setRegulations(regRes.data.regulations);
      if (batchRes.data?.batches) setBatches(batchRes.data.batches);
      if (subRes.data?.subjects) setSubjects(subRes.data.subjects);
      if (yearRes.data?.academicYears) setAcademicYears(yearRes.data.academicYears);
      if (facAssRes.data?.assignments) setFacultyAssignments(facAssRes.data.assignments);
      if (expAssRes.data?.assignments) setExpertAssignments(expAssRes.data.assignments);
      if (facListRes.data?.faculty) setFacultyList(facListRes.data.faculty);
      if (semRes.data?.semesters) setSemesters(semRes.data.semesters);
      if (workRes.data?.workloads) setWorkloads(workRes.data.workloads);
      if (stuRes.data?.students) setStudents(stuRes.data.students);
    } catch (err) {
      console.error('Failed to load HOD Department Console data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Approval Handlers
  const handleOpenApproval = (doc) => {
    setApprovingDoc(doc);
    setDecision('approved');
    setComments('Approved for official student publication under Regulation R2023.');
    setRejectionReason('');
  };

  const handleSubmitApproval = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await hodApi.submitApproval(approvingDoc._id, {
        decision,
        comments,
        rejectionReason
      });
      if (res.data.success) {
        alert(res.data.message || 'HOD approval decision recorded.');
        setApprovingDoc(null);
        loadAllData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Approval failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInspectAi = async (doc) => {
    try {
      const res = await hodApi.getDocumentDetails(doc._id);
      if (res.data.success && res.data.aiReports && res.data.aiReports.length > 0) {
        setActiveAiReport(res.data.aiReports[0]);
        setActiveAiDocTitle(doc.title);
      } else {
        alert('AI report pending or document has not undergone AI verification.');
      }
    } catch (e) {
      alert('Failed to retrieve AI audit.');
    }
  };

  // Workload, Auto-Allocation, Languages, and Student Promotion Handlers
  const handleTriggerAutoAllocation = async () => {
    setAutoAllocating(true);
    setAutoAllocMsg('');
    try {
      const res = await hodApi.triggerAutoAllocation();
      if (res.data.success) {
        setAutoAllocMsg(res.data.message || 'Auto-allocation completed successfully.');
        await loadAllData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Auto-allocation failed');
    } finally {
      setAutoAllocating(false);
    }
  };

  const handleDeleteSubject = async (id, code) => {
    if (!window.confirm(`Are you sure you want to delete subject "${code}"?`)) return;
    try {
      const res = await hodApi.deleteSubject(id);
      if (res.data.success) {
        alert(res.data.message);
        loadAllData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to delete subject');
    }
  };

  const handlePromoteStudent = async (enrollmentId, studentName) => {
    if (!window.confirm(`Advance student ${studentName || 'this student'} to the next academic semester?`)) return;
    try {
      const res = await hodApi.promoteStudentByHod(enrollmentId);
      if (res.data.success) {
        alert(res.data.message);
        loadAllData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Promotion failed');
    }
  };

  // Academic Handlers
  const handleCreateRegulation = async (e) => {
    e.preventDefault();
    try {
      const res = await hodApi.createRegulation(regForm);
      if (res.data.success) {
        alert('Academic Regulation created successfully with standard semesters.');
        setIsRegModalOpen(false);
        setRegForm({ name: '', code: '', description: '', startYear: 2026, endYear: 2027 });
        loadAllData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to create regulation');
    }
  };

  const handleOpenEditModal = async (reg) => {
    setEditRegError('');
    setEditingRegId(reg._id);
    setEditRegForm({
      name: reg.name || '',
      code: reg.code || '',
      academicYear: reg.academicYear || `${reg.startYear || 2026}–${reg.endYear || 2027}`,
      studyLevel: reg.studyLevel || 'PG / MCA (Semesters 1-4)',
      startYear: reg.startYear || 2026,
      endYear: reg.endYear || 2027,
      status: reg.isActive !== false ? 'Active' : 'Inactive',
      description: reg.description || ''
    });
    setIsEditRegModalOpen(true);
    setEditRegLoading(true);

    // Fetch fresh regulation details directly from MongoDB
    try {
      const res = await hodApi.getRegulationById(reg._id);
      if (res.data?.success && res.data?.regulation) {
        const fresh = res.data.regulation;
        setEditRegForm({
          name: fresh.name || '',
          code: fresh.code || '',
          academicYear: fresh.academicYear || `${fresh.startYear || 2026}–${fresh.endYear || 2027}`,
          studyLevel: fresh.studyLevel || 'PG / MCA (Semesters 1-4)',
          startYear: fresh.startYear || 2026,
          endYear: fresh.endYear || 2027,
          status: fresh.isActive !== false ? 'Active' : 'Inactive',
          description: fresh.description || ''
        });
      }
    } catch (err) {
      console.warn('Could not fetch single regulation, using card values:', err);
    } finally {
      setEditRegLoading(false);
    }
  };

  const handleUpdateRegulation = async (e) => {
    e.preventDefault();
    setEditRegError('');

    if (!editRegForm.name.trim()) {
      setEditRegError('Regulation Name is required.');
      return;
    }
    if (!editRegForm.code.trim()) {
      setEditRegError('Regulation Code is required.');
      return;
    }
    if (!editRegForm.academicYear.trim()) {
      setEditRegError('Academic Year is required (e.g., 2026–2027).');
      return;
    }
    if (!editRegForm.studyLevel.trim()) {
      setEditRegError('Semester or Study Level is required.');
      return;
    }

    setEditRegSubmitting(true);
    try {
      const payload = {
        name: editRegForm.name.trim(),
        code: editRegForm.code.trim().toUpperCase(),
        academicYear: editRegForm.academicYear.trim(),
        studyLevel: editRegForm.studyLevel.trim(),
        startYear: Number(editRegForm.startYear) || 2026,
        endYear: Number(editRegForm.endYear) || 2027,
        isActive: editRegForm.status === 'Active',
        description: editRegForm.description.trim()
      };

      const res = await hodApi.updateRegulation(editingRegId, payload);
      if (res.data.success) {
        alert('Academic Regulation updated successfully.');
        setIsEditRegModalOpen(false);
        setEditingRegId(null);
        await loadAllData();
      }
    } catch (err) {
      setEditRegError(err.response?.data?.message || err.message || 'Failed to update academic regulation');
    } finally {
      setEditRegSubmitting(false);
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    try {
      const res = await hodApi.createBatch(batchForm);
      if (res.data.success) {
        alert('Batch created successfully.');
        setIsBatchModalOpen(false);
        setBatchForm({ batchName: '', academicRegulationId: '', startYear: 2024, endYear: 2026, department: 'MCA', currentSemester: 1 });
        loadAllData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to create batch');
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    try {
      let finalSemesterId = subjectForm.semesterId;
      if (!finalSemesterId && subjectForm.academicRegulationId) {
        const matchingSem = semesters.find(
          s => (s.academicRegulationId === subjectForm.academicRegulationId || s.academicRegulationId?._id === subjectForm.academicRegulationId) &&
               s.semesterNumber === Number(subjectForm.semesterNumber)
        );
        if (matchingSem) {
          finalSemesterId = matchingSem._id;
        }
      }

      if (!finalSemesterId) {
        alert('Please select a valid Semester from the dropdown.');
        return;
      }

      const payload = {
        ...subjectForm,
        semesterId: finalSemesterId
      };

      const res = await hodApi.createSubject(payload);
      if (res.data.success) {
        alert('Subject curriculum created successfully.');
        setIsSubjectModalOpen(false);
        setSubjectForm({
          subjectCode: '',
          subjectName: '',
          academicRegulationId: '',
          semesterId: '',
          semesterNumber: 1,
          credits: 3,
          description: '',
          hasProgramming: true,
          primaryLanguage: 'python'
        });
        loadAllData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to create subject');
    }
  };

  const handleCreateYear = async (e) => {
    e.preventDefault();
    try {
      const res = await hodApi.createAcademicYear(yearForm);
      if (res.data.success) {
        alert('Academic Year recorded successfully.');
        setIsYearModalOpen(false);
        setYearForm({ yearName: '', code: '', startDate: '', endDate: '', isCurrent: true });
        loadAllData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to create academic year');
    }
  };

  // Assignment Handlers
  const handleAssignFaculty = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        facultyId: assignFacultyForm.facultyId,
        subjectId: assignFacultyForm.subjectId,
        batchId: assignFacultyForm.batchId
      };
      if (assignFacultyForm.academicYearId && assignFacultyForm.academicYearId.trim() !== '') {
        payload.academicYearId = assignFacultyForm.academicYearId;
      } else if (academicYears && academicYears.length > 0) {
        payload.academicYearId = (academicYears.find(y => y.isCurrent) || academicYears[0])._id;
      }

      const res = await hodApi.assignFaculty(payload);
      if (res.data.success) {
        alert('Faculty assigned to course subject successfully.');
        setIsAssignFacultyOpen(false);
        setAssignFacultyForm({ facultyId: '', subjectId: '', batchId: '', academicYearId: '' });
        loadAllData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Faculty assignment failed');
    }
  };

  const handleAssignExpert = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        expertId: assignExpertForm.expertId,
        subjectId: assignExpertForm.subjectId
      };
      if (assignExpertForm.academicYearId && assignExpertForm.academicYearId.trim() !== '') {
        payload.academicYearId = assignExpertForm.academicYearId;
      } else if (academicYears && academicYears.length > 0) {
        payload.academicYearId = (academicYears.find(y => y.isCurrent) || academicYears[0])._id;
      }

      const res = await hodApi.assignExpert(payload);
      if (res.data.success) {
        alert('Subject Expert Reviewer assigned successfully.');
        setIsAssignExpertOpen(false);
        setAssignExpertForm({ expertId: '', subjectId: '', academicYearId: '' });
        loadAllData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Expert assignment failed');
    }
  };

  // Faculty Directory & Designation
  const handleDesignateExpert = async (usr) => {
    if (!window.confirm(`Designate ${usr.name} (${usr.email}) as a Subject Expert Reviewer?`)) return;
    try {
      const res = await hodApi.designateExpert(usr._id);
      if (res.data.success) {
        alert(res.data.message || 'User designated as Subject Expert.');
        loadAllData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to designate expert');
    }
  };

  const handleApproveUser = async (usr) => {
    if (!window.confirm(`Authorize and activate the ${usr.role.toUpperCase()} account for ${usr.name} (${usr.email})?`)) return;
    try {
      const res = await hodApi.approveUser(usr._id);
      if (res.data.success) {
        alert(res.data.message || 'Account authorized successfully.');
        loadAllData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to authorize account');
    }
  };

  const handleRejectUser = async (usr) => {
    if (!window.confirm(`Are you sure you want to reject the registration request for ${usr.name} (${usr.email})?`)) return;
    try {
      const res = await hodApi.rejectUser(usr._id);
      if (res.data.success) {
        alert(res.data.message || 'Account request rejected.');
        loadAllData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to reject account');
    }
  };

  // Tab configurations: HOD focuses strictly on Academic Document Approvals and Curriculum Context
  const tabs = [
    { id: 'approvals', label: 'Pending Approvals', count: pendingDocs.length, icon: CheckCircle2 },
    { id: 'catalog', label: 'Approval History', count: approvalHistory.length, icon: History },
    { id: 'academic', label: 'Curriculum Reference', count: subjects.length, icon: Layers }
  ];

  const filteredSubjects = subjects.filter(s => {
    if (selectedSubjectSemester === 'all') return true;
    return String(s.semesterNumber) === String(selectedSubjectSemester);
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
              Department Executive Console
            </span>
            <span className="text-xs text-slate-500 font-mono">MCA Academic Operations</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Head of Department (HOD) Academic Executive Desk
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Manage curriculum regulations, assign faculty course responsibilities, designate subject peer reviewers, and conduct final academic document approvals before student publication.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadAllData}
            loading={loading}
            icon={RefreshCw}
          >
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Pending Sign-Off"
          value={pendingDocs.length}
          subtext="Expert-reviewed materials awaiting HOD approval"
          status="warning"
          icon={<CheckCircle2 className="w-5 h-5 text-amber-600" />}
        />
        <StatCard
          label="Published Materials"
          value={approvalHistory.filter(a => a.decision === 'approved').length}
          subtext="Active in verified student library"
          status="success"
          icon={<Award className="w-5 h-5 text-emerald-600" />}
        />
        <StatCard
          label="Autonomous Subjects"
          value={subjects.length}
          subtext={`${regulations.length} active regulations under review`}
          icon={<Layers className="w-5 h-5 text-blue-600" />}
        />
      </div>

      {/* Modern Segmented Navigation Tabs */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-1.5 shadow-2xs flex flex-wrap items-center gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. APPROVALS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'approvals' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Expert-Approved Course Materials Awaiting Publication</CardTitle>
              <CardDescription>
                These documents have passed AI verification and subject-expert peer review.
              </CardDescription>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60">
              {pendingDocs.length} Ready for HOD Sign-Off
            </span>
          </CardHeader>
          <CardContent className="p-0">
            {pendingDocs.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={<CheckCircle2 className="w-6 h-6 text-emerald-600" />}
                  title="No Documents Pending Approval"
                  description="All expert-approved course submissions have been reviewed, signed, and published to student libraries."
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Title</TableHead>
                    <TableHead>Faculty</TableHead>
                    <TableHead>Verified Expert</TableHead>
                    <TableHead>Subject & Batch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">HOD Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingDocs.map((doc) => (
                    <TableRow key={doc._id}>
                      <TableCell>
                        <span className="font-semibold text-slate-900 block">{doc.title}</span>
                        <span className="text-[11px] text-slate-400 font-mono">v{doc.currentVersionNumber}.0</span>
                      </TableCell>
                      <TableCell className="font-medium text-slate-800">{doc.facultyId?.name}</TableCell>
                      <TableCell className="text-indigo-700 font-semibold">{doc.assignedExpertId?.name || 'Verified'}</TableCell>
                      <TableCell className="text-slate-700">
                        <span className="font-medium block">{doc.subjectId?.subjectName}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{doc.batchId?.batchName}</span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={doc.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleInspectAi(doc)}
                            title="Inspect AI Verification Audit"
                            icon={<Sparkles className="w-3.5 h-3.5 text-purple-600" />}
                          >
                            AI Report
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setPreviewDocId(doc._id)}
                            title="Preview Document Content"
                            icon={<Eye className="w-3.5 h-3.5 text-slate-600" />}
                          >
                            Preview
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenApproval(doc)}
                          >
                            Sign & Publish
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* 2. ACADEMIC CURRICULUM & STRUCTURE TAB */}
      {/* ========================================================================= */}
      {activeTab === 'academic' && (
        <div className="space-y-6">
          {/* Quick Actions Row */}
          <div className="flex flex-wrap gap-2.5">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsRegModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Regulation
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsBatchModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Batch
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const defaultRegId = regulations.length > 0 ? regulations[0]._id : '';
                const regSems = semesters.filter(s =>
                  defaultRegId && (s.academicRegulationId === defaultRegId || s.academicRegulationId?._id === defaultRegId)
                );
                const firstSem = regSems[0];
                setSubjectForm({
                  subjectCode: '',
                  subjectName: '',
                  academicRegulationId: defaultRegId,
                  semesterId: firstSem ? firstSem._id : '',
                  semesterNumber: firstSem ? firstSem.semesterNumber : 1,
                  credits: 3,
                  description: '',
                  hasProgramming: true,
                  primaryLanguage: 'python'
                });
                setIsSubjectModalOpen(true);
              }}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Subject
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsYearModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Academic Year
            </Button>
          </div>

          {/* Academic Regulations & Batches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Regulations Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <CardTitle className="text-sm">Academic Regulations</CardTitle>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                  {regulations.length} Configured
                </span>
              </CardHeader>
              <CardContent className="space-y-2.5 max-h-80 overflow-y-auto">
                {regulations.length === 0 ? (
                  <EmptyState
                    title="No Regulations Found"
                    description="Click 'Add Regulation' to create your first curriculum regulation."
                  />
                ) : (
                  regulations.map((reg) => (
                    <div
                      key={reg._id}
                      className="p-3.5 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-900">{reg.name}</span>
                          <span className="font-mono text-[11px] px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/60 rounded font-semibold">
                            {reg.code}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                          <span>Year: <strong className="font-medium text-slate-700">{reg.academicYear || `${reg.startYear}–${reg.endYear}`}</strong></span>
                          <span>•</span>
                          <span>Level: <strong className="font-medium text-slate-700">{reg.studyLevel || 'PG / MCA (Semesters 1-4)'}</strong></span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          reg.isActive !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {reg.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                        {canEditRegulations && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditModal(reg)}
                            icon={<Pencil className="w-3.5 h-3.5" />}
                          >
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Batches Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-slate-700" />
                  <CardTitle className="text-sm">Academic Student Batches</CardTitle>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {batches.length} Batches
                </span>
              </CardHeader>
              <CardContent className="space-y-2.5 max-h-80 overflow-y-auto">
                {batches.length === 0 ? (
                  <EmptyState
                    title="No Batches Configured"
                    description="Click 'Add Batch' to initialize a student cohort."
                  />
                ) : (
                  batches.map((batch) => (
                    <div key={batch._id} className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-900">{batch.batchName}</span>
                        <span className="text-[11px] text-slate-500 block">
                          Dept: {batch.department} • Semester: {batch.currentSemester} • ({batch.startYear} - {batch.endYear})
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200/60">
                        {batch.academicRegulationId?.code || 'R2023'}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Subjects Table with Semester Filtering */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle>Curriculum Subjects & Course Modules ({subjects.length})</CardTitle>
                <CardDescription>
                  Autonomous curriculum subjects with syllabus credits and programming lab runtimes.
                </CardDescription>
              </div>

              {/* Semester Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs self-start sm:self-auto">
                {[
                  { id: 'all', label: `All (${subjects.length})` },
                  { id: '1', label: `S1 (${subjects.filter(s => s.semesterNumber === 1).length})` },
                  { id: '2', label: `S2 (${subjects.filter(s => s.semesterNumber === 2).length})` },
                  { id: '3', label: `S3 (${subjects.filter(s => s.semesterNumber === 3).length})` },
                  { id: '4', label: `S4 (${subjects.filter(s => s.semesterNumber === 4).length})` }
                ].map((pill) => (
                  <button
                    key={pill.id}
                    onClick={() => setSelectedSubjectSemester(pill.id)}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                      selectedSubjectSemester === pill.id
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject Code</TableHead>
                    <TableHead>Subject Name</TableHead>
                    <TableHead>Regulation</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Coding Lab</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-slate-400">
                        No subjects found matching selected semester filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubjects.map((sub) => (
                      <TableRow key={sub._id}>
                        <TableCell className="font-mono font-semibold text-blue-700">{sub.subjectCode}</TableCell>
                        <TableCell className="font-medium text-slate-900">{sub.subjectName}</TableCell>
                        <TableCell className="font-mono text-xs text-slate-600">
                          {sub.academicRegulationId?.code || 'R2023'}
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11px]">
                            Sem {sub.semesterNumber || 1}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-slate-700">{sub.credits} Credits</TableCell>
                        <TableCell>
                          {sub.hasProgramming ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-200/60 uppercase">
                              <Code2 className="w-3 h-3" /> {sub.primaryLanguage || 'Python'}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">Theory Only</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSubject(sub._id, sub.subjectCode)}
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            icon={<Trash2 className="w-3.5 h-3.5" />}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. WORKLOAD & AUTO-ALLOCATION TAB */}
      {/* ========================================================================= */}
      {activeTab === 'workload' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Autonomous Faculty Workload Balancing & Review Auto-Allocation</CardTitle>
                <CardDescription>
                  Intelligently assigns pending course submissions to qualified subject matter experts based on current capacity and specialization.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleTriggerAutoAllocation}
                  isLoading={autoAllocating}
                  icon={<Sparkles className="w-4 h-4" />}
                >
                  Auto-Allocate Reviews
                </Button>
              </div>
            </CardHeader>
            {autoAllocMsg && (
              <div className="mx-6 mb-4 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{autoAllocMsg}</span>
              </div>
            )}
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Faculty Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Teaching Courses</TableHead>
                    <TableHead>Reviewer Allocations</TableHead>
                    <TableHead>Completed Reviews</TableHead>
                    <TableHead>Capacity & Utilization</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workloads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-slate-400">
                        No faculty workload metrics available.
                      </TableCell>
                    </TableRow>
                  ) : (
                    workloads.map((w) => (
                      <TableRow key={w._id}>
                        <TableCell>
                          <span className="font-semibold text-slate-900 block">{w.name}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{w.email}</span>
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-0.5 rounded uppercase font-semibold text-[10px] bg-slate-100 text-slate-700">
                            {w.role}
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-800">
                          {w.teachingCount} Subjects
                        </TableCell>
                        <TableCell className="font-semibold text-indigo-700">
                          {w.expertCount} Active
                        </TableCell>
                        <TableCell className="font-semibold text-emerald-700">
                          {w.reviewsCompleted} Evaluated
                        </TableCell>
                        <TableCell>
                          <div className="w-40">
                            <div className="flex justify-between text-[11px] mb-1 font-mono">
                              <span className="font-semibold text-slate-700">{w.totalActiveWorkload}/{w.capacity}</span>
                              <span className={`font-semibold ${w.utilizationRate >= 80 ? 'text-rose-600' : 'text-emerald-600'}`}>{w.utilizationRate}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  w.utilizationRate >= 80 ? 'bg-rose-500' : w.utilizationRate >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(100, w.utilizationRate)}%` }}
                              ></div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. STUDENT DIRECTORY & PROMOTION TAB */}
      {/* ========================================================================= */}
      {activeTab === 'students' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Autonomous MCA Student Directory & Semester Progression</CardTitle>
              <CardDescription>
                Track student profiles, current semester (S1 to S4), completed credits, and approve promotions.
              </CardDescription>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200/60">
              {students.length} Enrolled Students
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Register No.</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Batch & Regulation</TableHead>
                  <TableHead>Current Semester</TableHead>
                  <TableHead>Completed Semesters</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">HOD Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-slate-400">
                      No student enrollment records registered in database yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((stu) => (
                    <TableRow key={stu._id}>
                      <TableCell className="font-mono font-bold text-blue-700">{stu.registerNumber}</TableCell>
                      <TableCell>
                        <span className="font-semibold text-slate-900 block">{stu.userId?.name || 'Registered Student'}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{stu.userId?.email}</span>
                      </TableCell>
                      <TableCell className="text-slate-700">
                        <span className="font-medium block">{stu.batchId?.batchName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{stu.academicRegulationId?.code}</span>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-0.5 rounded font-semibold text-xs bg-blue-50 text-blue-700 border border-blue-200/60">
                          Semester {stu.currentSemester || 1}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {stu.completedSemesters?.length > 0 ? (
                          <span className="font-mono font-semibold">Sem {stu.completedSemesters.join(', ')}</span>
                        ) : (
                          <span className="text-slate-400 italic">None yet</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded font-semibold uppercase text-[10px] ${
                          stu.status === 'graduated' ? 'bg-purple-50 text-purple-800 border border-purple-200/60' : 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                        }`}>
                          {stu.status || 'Active'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {stu.status !== 'graduated' ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handlePromoteStudent(stu._id, stu.userId?.name || stu.registerNumber)}
                          >
                            Advance to Sem {(stu.currentSemester || 1) < 4 ? (stu.currentSemester || 1) + 1 : 'Graduation'}
                          </Button>
                        ) : (
                          <span className="text-purple-700 font-semibold text-xs">Graduated</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* 6. ASSIGNMENTS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2.5">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAssignFacultyOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Assign Faculty to Course
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsAssignExpertOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Assign Expert Reviewer
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Faculty Course Assignments */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-sm">Faculty Subject Assignments</CardTitle>
                  <CardDescription>Faculty authorized to upload verified materials.</CardDescription>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                  {facultyAssignments.length} Assigned
                </span>
              </CardHeader>
              <CardContent className="divide-y divide-slate-100 max-h-96 overflow-y-auto p-0">
                {facultyAssignments.length === 0 ? (
                  <div className="p-6">
                    <EmptyState
                      title="No Faculty Assignments"
                      description="Click 'Assign Faculty to Course' to establish teaching responsibilities."
                    />
                  </div>
                ) : (
                  facultyAssignments.map((fa) => (
                    <div key={fa._id} className="p-4 hover:bg-slate-50/60 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-900 block">{fa.facultyId?.name}</span>
                        <span className="text-slate-500 text-[11px] font-mono">{fa.facultyId?.email}</span>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="font-semibold text-blue-700">{fa.subjectId?.subjectName}</span>
                          <span className="text-slate-400 font-mono text-[10px]">({fa.subjectId?.subjectCode})</span>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-slate-100 rounded text-slate-700 font-medium text-[11px]">
                        {fa.batchId?.batchName || 'General'}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Subject Expert Reviewer Assignments */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-sm">Expert Reviewer Designations</CardTitle>
                  <CardDescription>Subject experts assigned to conduct peer audit.</CardDescription>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                  {expertAssignments.length} Designated
                </span>
              </CardHeader>
              <CardContent className="divide-y divide-slate-100 max-h-96 overflow-y-auto p-0">
                {expertAssignments.length === 0 ? (
                  <div className="p-6">
                    <EmptyState
                      title="No Reviewer Assignments"
                      description="Click 'Assign Expert Reviewer' to designate audit responsibility."
                    />
                  </div>
                ) : (
                  expertAssignments.map((ea) => (
                    <div key={ea._id} className="p-4 hover:bg-slate-50/60 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-900 block">{ea.expertId?.name}</span>
                        <span className="text-slate-500 text-[11px] font-mono">{ea.expertId?.email}</span>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="font-semibold text-indigo-700">{ea.subjectId?.subjectName}</span>
                          <span className="text-slate-400 font-mono text-[10px]">({ea.subjectId?.subjectCode})</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 rounded font-semibold text-[10px] uppercase border border-indigo-200/60">
                        Reviewer
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. FACULTY DIRECTORY & EXPERT DESIGNATION TAB */}
      {/* ========================================================================= */}
      {activeTab === 'faculty' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Department Faculty & Academic Reviewer Directory</CardTitle>
              <CardDescription>
                Manage faculty designations, upgrade faculty to Subject Experts, and activate pending accounts.
              </CardDescription>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200/60">
              {facultyList.length} Department Members
            </span>
          </CardHeader>

          {facultyList.filter((f) => f.approvalStatus === 'pending').length > 0 && (
            <div className="mx-6 mb-4 p-3.5 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>{facultyList.filter((f) => f.approvalStatus === 'pending').length}</strong> account(s) are awaiting institutional authorization. Click "Authorize Account" to activate.
                </span>
              </div>
            </div>
          )}

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Faculty Name</TableHead>
                  <TableHead>Institutional Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation & Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facultyList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-slate-400">
                      No faculty members registered in department directory.
                    </TableCell>
                  </TableRow>
                ) : (
                  facultyList.map((f) => (
                    <TableRow key={f._id}>
                      <TableCell className="font-semibold text-slate-900">{f.name}</TableCell>
                      <TableCell className="font-mono text-slate-600">{f.email}</TableCell>
                      <TableCell className="text-slate-700">{f.department || 'MCA'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded font-semibold uppercase text-[10px] ${
                          f.role === 'expert' ? 'bg-indigo-50 text-indigo-800 border border-indigo-200/60' : 'bg-blue-50 text-blue-800 border border-blue-200/60'
                        }`}>
                          {f.role === 'expert' ? 'Subject Expert' : 'Faculty Member'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {f.approvalStatus === 'pending' ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-semibold border border-amber-200/60 inline-flex items-center gap-1">
                            Pending Authorization
                          </span>
                        ) : f.approvalStatus === 'rejected' ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 text-[10px] font-semibold border border-rose-200/60">
                            Rejected
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200/60">
                            Active
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {f.approvalStatus === 'pending' ? (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleApproveUser(f)}
                                icon={<UserCheck className="w-3.5 h-3.5" />}
                              >
                                Authorize
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleRejectUser(f)}
                              >
                                Reject
                              </Button>
                            </>
                          ) : f.role === 'faculty' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDesignateExpert(f)}
                            >
                              Designate Expert
                            </Button>
                          ) : (
                            <span className="text-[11px] font-medium text-slate-400 italic">
                              Subject Expert Active
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* 8. CATALOG / ARCHIVE TAB */}
      {/* ========================================================================= */}
      {activeTab === 'catalog' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>HOD Approval History & Academic Provenance</CardTitle>
              <CardDescription>
                Historical ledger preserving the exact identity of the approving HOD at the moment of sign-off.
              </CardDescription>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {approvalHistory.length} Recorded
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Approval Date</TableHead>
                  <TableHead>Document Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Approving HOD</TableHead>
                  <TableHead>Decision</TableHead>
                  <TableHead>Published Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvalHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-slate-400">
                      No HOD approval decisions recorded in the archive yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  approvalHistory.map((app) => (
                    <TableRow key={app._id}>
                      <TableCell className="text-slate-500 font-mono text-[11px]">
                        {new Date(app.approvedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900">{app.documentId?.title}</TableCell>
                      <TableCell className="text-slate-700">{app.documentId?.subjectId?.subjectName}</TableCell>
                      <TableCell className="text-slate-600">{app.documentId?.facultyId?.name}</TableCell>
                      <TableCell className="font-semibold text-slate-900">{app.hodId?.name}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded font-semibold uppercase text-[10px] ${
                          app.decision === 'approved' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60' : 'bg-rose-50 text-rose-800 border border-rose-200/60'
                        }`}>
                          {app.decision}
                        </span>
                      </TableCell>
                      <TableCell>
                        {app.publishedForStudents ? (
                          <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Published
                          </span>
                        ) : (
                          <span className="text-slate-400">Unpublished</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* MODAL 1: HOD Decision Modal */}
      <Modal
        isOpen={Boolean(approvingDoc)}
        onClose={() => setApprovingDoc(null)}
        title="Final Academic Approval"
        description={approvingDoc?.title ? `Sign off on "${approvingDoc.title}" for official student publication` : ''}
        size="md"
      >
        {approvingDoc && (
          <form onSubmit={handleSubmitApproval} className="space-y-4">
            <div>
              <Label required>Final Decision</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setDecision('approved')}
                  className={`py-2 px-3 rounded-lg border text-center font-semibold text-xs transition-all ${
                    decision === 'approved'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  ✓ Approve & Publish
                </button>
                <button
                  type="button"
                  onClick={() => setDecision('rejected')}
                  className={`py-2 px-3 rounded-lg border text-center font-semibold text-xs transition-all ${
                    decision === 'rejected'
                      ? 'bg-rose-50 border-rose-500 text-rose-800 ring-1 ring-rose-500'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  ✕ Reject Document
                </button>
              </div>
            </div>

            <div>
              <Label>HOD Endorsement Comments</Label>
              <Textarea
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Official endorsement notes..."
                className="mt-1"
              />
            </div>

            {decision === 'rejected' && (
              <div>
                <Label required>Rejection Reason</Label>
                <Input
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter academic justification for rejection..."
                  className="mt-1"
                />
              </div>
            )}

            <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-200/60 text-[11px] text-blue-900 leading-relaxed">
              Approving this document will automatically publish it to the student library for batch <strong>{approvingDoc.batchId?.batchName}</strong> and generate AI study summaries.
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setApprovingDoc(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={submitting}>
                Confirm & Publish
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 2: Create Regulation */}
      <Modal
        isOpen={isRegModalOpen}
        onClose={() => setIsRegModalOpen(false)}
        title="Add Academic Regulation"
        description="Define a new autonomous curriculum regulation and generate standard semesters."
        size="md"
      >
        <form onSubmit={handleCreateRegulation} className="space-y-3.5">
          <div>
            <Label required>Regulation Code</Label>
            <Input
              required
              placeholder="e.g. R2026"
              value={regForm.code}
              onChange={(e) => setRegForm({ ...regForm, code: e.target.value })}
              className="mt-1 font-mono uppercase"
            />
          </div>
          <div>
            <Label required>Regulation Name</Label>
            <Input
              required
              placeholder="e.g. MCA Regulation 2026"
              value={regForm.name}
              onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start Year</Label>
              <Input
                type="number"
                value={regForm.startYear}
                onChange={(e) => setRegForm({ ...regForm, startYear: Number(e.target.value) })}
                className="mt-1 font-mono"
              />
            </div>
            <div>
              <Label>End Year</Label>
              <Input
                type="number"
                value={regForm.endYear}
                onChange={(e) => setRegForm({ ...regForm, endYear: Number(e.target.value) })}
                className="mt-1 font-mono"
              />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              rows={2}
              placeholder="Curriculum overview..."
              value={regForm.description}
              onChange={(e) => setRegForm({ ...regForm, description: e.target.value })}
              className="mt-1"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsRegModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create Regulation
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Edit Academic Regulation */}
      <Modal
        isOpen={isEditRegModalOpen}
        onClose={() => setIsEditRegModalOpen(false)}
        title="Edit Academic Regulation"
        description="Update curriculum regulation parameters in MongoDB."
        size="lg"
      >
        {editRegError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{editRegError}</span>
          </div>
        )}

        {editRegLoading ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
            <span>Fetching existing regulation record from MongoDB...</span>
          </div>
        ) : (
          <form onSubmit={handleUpdateRegulation} className="space-y-3.5">
            <div>
              <Label required>Regulation Name</Label>
              <Input
                required
                placeholder="e.g. MCA REGULATION 2026"
                value={editRegForm.name}
                onChange={(e) => setEditRegForm({ ...editRegForm, name: e.target.value })}
                className="mt-1 font-semibold text-slate-900"
              />
            </div>

            <div>
              <Label required>Regulation Code</Label>
              <Input
                required
                placeholder="e.g. R2026"
                value={editRegForm.code}
                onChange={(e) => setEditRegForm({ ...editRegForm, code: e.target.value.toUpperCase() })}
                className="mt-1 font-mono uppercase font-bold text-blue-700"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label required>Academic Year</Label>
                <Input
                  required
                  placeholder="e.g. 2026–2027"
                  value={editRegForm.academicYear}
                  onChange={(e) => {
                    const val = e.target.value;
                    const match = val.match(/(\d{4})/g);
                    setEditRegForm({
                      ...editRegForm,
                      academicYear: val,
                      startYear: match && match[0] ? Number(match[0]) : editRegForm.startYear,
                      endYear: match && match[1] ? Number(match[1]) : editRegForm.endYear
                    });
                  }}
                  className="mt-1"
                />
              </div>

              <div>
                <Label required>Semester or Study Level</Label>
                <Input
                  required
                  placeholder="e.g. PG / MCA (Semesters 1-4)"
                  value={editRegForm.studyLevel}
                  onChange={(e) => setEditRegForm({ ...editRegForm, studyLevel: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div>
                <Label className="text-[11px]">Start Year</Label>
                <Input
                  type="number"
                  value={editRegForm.startYear}
                  onChange={(e) => setEditRegForm({ ...editRegForm, startYear: Number(e.target.value) })}
                  className="mt-1 bg-white font-mono text-xs"
                />
              </div>
              <div>
                <Label className="text-[11px]">End Year</Label>
                <Input
                  type="number"
                  value={editRegForm.endYear}
                  onChange={(e) => setEditRegForm({ ...editRegForm, endYear: Number(e.target.value) })}
                  className="mt-1 bg-white font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <Label required>Status</Label>
              <Select
                value={editRegForm.status}
                onChange={(e) => setEditRegForm({ ...editRegForm, status: e.target.value })}
                className="mt-1"
              >
                <option value="Active">Active (Curriculum currently active for batches & courses)</option>
                <option value="Inactive">Inactive (Archived or superseded regulation)</option>
              </Select>
            </div>

            <div>
              <Label>Description / Curriculum Notes</Label>
              <Textarea
                rows={2}
                placeholder="Overview of curriculum requirements, regulation details..."
                value={editRegForm.description}
                onChange={(e) => setEditRegForm({ ...editRegForm, description: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditRegModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={editRegSubmitting}
              >
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 4: Create Batch */}
      <Modal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        title="Add Academic Batch"
        description="Register a new student cohort under an academic regulation."
        size="md"
      >
        <form onSubmit={handleCreateBatch} className="space-y-3.5">
          <div>
            <Label required>Batch Name</Label>
            <Input
              required
              placeholder="e.g. 2026-2028 MCA Batch"
              value={batchForm.batchName}
              onChange={(e) => setBatchForm({ ...batchForm, batchName: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label required>Academic Regulation</Label>
            <Select
              required
              value={batchForm.academicRegulationId}
              onChange={(e) => setBatchForm({ ...batchForm, academicRegulationId: e.target.value })}
              className="mt-1"
            >
              <option value="">Select Regulation</option>
              {regulations.map(r => (
                <option key={r._id} value={r._id}>{r.name} ({r.code})</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start Year</Label>
              <Input
                type="number"
                value={batchForm.startYear}
                onChange={(e) => setBatchForm({ ...batchForm, startYear: Number(e.target.value) })}
                className="mt-1 font-mono"
              />
            </div>
            <div>
              <Label>End Year</Label>
              <Input
                type="number"
                value={batchForm.endYear}
                onChange={(e) => setBatchForm({ ...batchForm, endYear: Number(e.target.value) })}
                className="mt-1 font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsBatchModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create Batch
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 5: Create Subject */}
      <Modal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        title="Add Curriculum Subject"
        description="Define subject code, syllabus credits, and programming lab profile."
        size="md"
      >
        <form onSubmit={handleCreateSubject} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>Subject Code</Label>
              <Input
                required
                placeholder="e.g. 26MCA301"
                value={subjectForm.subjectCode}
                onChange={(e) => setSubjectForm({ ...subjectForm, subjectCode: e.target.value })}
                className="mt-1 font-mono uppercase"
              />
            </div>
            <div>
              <Label>Credits</Label>
              <Input
                type="number"
                value={subjectForm.credits}
                onChange={(e) => setSubjectForm({ ...subjectForm, credits: Number(e.target.value) })}
                className="mt-1 font-mono"
              />
            </div>
          </div>
          <div>
            <Label required>Subject Name</Label>
            <Input
              required
              placeholder="e.g. Full Stack Web Development"
              value={subjectForm.subjectName}
              onChange={(e) => setSubjectForm({ ...subjectForm, subjectName: e.target.value })}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>Regulation</Label>
              <Select
                required
                value={subjectForm.academicRegulationId}
                onChange={(e) => {
                  const regId = e.target.value;
                  const regSems = semesters.filter(s =>
                    regId && (s.academicRegulationId === regId || s.academicRegulationId?._id === regId)
                  );
                  const matchedSem = regSems.find(s => s.semesterNumber === subjectForm.semesterNumber) || regSems[0];
                  setSubjectForm({
                    ...subjectForm,
                    academicRegulationId: regId,
                    semesterId: matchedSem ? matchedSem._id : '',
                    semesterNumber: matchedSem ? matchedSem.semesterNumber : subjectForm.semesterNumber
                  });
                }}
                className="mt-1"
              >
                <option value="">Select Regulation</option>
                {regulations.map(r => (
                  <option key={r._id} value={r._id}>{r.name} ({r.code})</option>
                ))}
              </Select>
            </div>
            <div>
              <Label required>Semester</Label>
              <Select
                required
                value={subjectForm.semesterId || ''}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const found = semesters.find(s => s._id === selectedId);
                  setSubjectForm({
                    ...subjectForm,
                    semesterId: selectedId,
                    semesterNumber: found ? found.semesterNumber : subjectForm.semesterNumber
                  });
                }}
                className="mt-1"
              >
                {(() => {
                  const regSems = semesters.filter(s =>
                    !subjectForm.academicRegulationId ||
                    s.academicRegulationId === subjectForm.academicRegulationId ||
                    s.academicRegulationId?._id === subjectForm.academicRegulationId
                  );

                  if (regSems.length === 0) {
                    return <option value="">No Semesters Configured</option>;
                  }

                  return regSems.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.semesterName || `Semester ${s.semesterNumber}`}
                    </option>
                  ));
                })()}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 items-center pt-1">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 text-xs">
              <input
                type="checkbox"
                checked={subjectForm.hasProgramming}
                onChange={(e) => setSubjectForm({ ...subjectForm, hasProgramming: e.target.checked })}
                className="rounded text-slate-900 focus:ring-blue-500"
              />
              <span>Has Coding Lab</span>
            </label>
            <div>
              <Select
                disabled={!subjectForm.hasProgramming}
                value={subjectForm.primaryLanguage}
                onChange={(e) => setSubjectForm({ ...subjectForm, primaryLanguage: e.target.value })}
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="c">C</option>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsSubjectModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create Subject
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 6: Create Academic Year */}
      <Modal
        isOpen={isYearModalOpen}
        onClose={() => setIsYearModalOpen(false)}
        title="Add Academic Year"
        description="Set current collegiate term and date boundaries."
        size="md"
      >
        <form onSubmit={handleCreateYear} className="space-y-3.5">
          <div>
            <Label required>Year Name</Label>
            <Input
              required
              placeholder="e.g. 2026-2027 Even Semester"
              value={yearForm.yearName}
              onChange={(e) => setYearForm({ ...yearForm, yearName: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label required>Year Code</Label>
            <Input
              required
              placeholder="e.g. AY2026-27"
              value={yearForm.code}
              onChange={(e) => setYearForm({ ...yearForm, code: e.target.value })}
              className="mt-1 font-mono uppercase"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 text-xs pt-1">
            <input
              type="checkbox"
              checked={yearForm.isCurrent}
              onChange={(e) => setYearForm({ ...yearForm, isCurrent: e.target.checked })}
              className="rounded text-slate-900 focus:ring-blue-500"
            />
            <span>Set as Active Current Academic Year</span>
          </label>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsYearModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Academic Year
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 7: Assign Faculty to Course */}
      <Modal
        isOpen={isAssignFacultyOpen}
        onClose={() => setIsAssignFacultyOpen(false)}
        title="Assign Faculty to Course"
        description="Authorize a faculty member to upload verified course documents."
        size="md"
      >
        <form onSubmit={handleAssignFaculty} className="space-y-3.5">
          <div>
            <Label required>Select Faculty Member</Label>
            <Select
              required
              value={assignFacultyForm.facultyId}
              onChange={(e) => setAssignFacultyForm({ ...assignFacultyForm, facultyId: e.target.value })}
              className="mt-1"
            >
              <option value="">Select Faculty</option>
              {facultyList.map(f => (
                <option key={f._id} value={f._id}>{f.name} ({f.email})</option>
              ))}
            </Select>
          </div>
          <div>
            <Label required>Select Subject</Label>
            <Select
              required
              value={assignFacultyForm.subjectId}
              onChange={(e) => setAssignFacultyForm({ ...assignFacultyForm, subjectId: e.target.value })}
              className="mt-1"
            >
              <option value="">Select Subject</option>
              {subjects.map(s => (
                <option key={s._id} value={s._id}>{s.subjectName} ({s.subjectCode})</option>
              ))}
            </Select>
          </div>
          <div>
            <Label required>Target Student Batch</Label>
            <Select
              required
              value={assignFacultyForm.batchId}
              onChange={(e) => setAssignFacultyForm({ ...assignFacultyForm, batchId: e.target.value })}
              className="mt-1"
            >
              <option value="">Select Batch</option>
              {batches.map(b => (
                <option key={b._id} value={b._id}>{b.batchName}</option>
              ))}
            </Select>
          </div>
          {academicYears && academicYears.length > 0 && (
            <div>
              <Label>Academic Year (Optional)</Label>
              <Select
                value={assignFacultyForm.academicYearId}
                onChange={(e) => setAssignFacultyForm({ ...assignFacultyForm, academicYearId: e.target.value })}
                className="mt-1"
              >
                <option value="">Default (Current Academic Year)</option>
                {academicYears.map(y => (
                  <option key={y._id} value={y._id}>{y.yearName} ({y.code})</option>
                ))}
              </Select>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAssignFacultyOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Assign Faculty
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 8: Assign Expert Reviewer */}
      <Modal
        isOpen={isAssignExpertOpen}
        onClose={() => setIsAssignExpertOpen(false)}
        title="Assign Subject Expert Reviewer"
        description="Designate an academic expert to audit submissions for this subject."
        size="md"
      >
        <form onSubmit={handleAssignExpert} className="space-y-3.5">
          <div>
            <Label required>Select Expert / Faculty Member</Label>
            <Select
              required
              value={assignExpertForm.expertId}
              onChange={(e) => setAssignExpertForm({ ...assignExpertForm, expertId: e.target.value })}
              className="mt-1"
            >
              <option value="">Select Reviewer</option>
              {facultyList.map(f => (
                <option key={f._id} value={f._id}>
                  {f.name} ({f.email}) {f.role === 'expert' ? '• [Expert]' : '• [Faculty]'}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label required>Select Subject</Label>
            <Select
              required
              value={assignExpertForm.subjectId}
              onChange={(e) => setAssignExpertForm({ ...assignExpertForm, subjectId: e.target.value })}
              className="mt-1"
            >
              <option value="">Select Subject</option>
              {subjects.map(s => (
                <option key={s._id} value={s._id}>{s.subjectName} ({s.subjectCode})</option>
              ))}
            </Select>
          </div>
          {academicYears && academicYears.length > 0 && (
            <div>
              <Label>Academic Year (Optional)</Label>
              <Select
                value={assignExpertForm.academicYearId}
                onChange={(e) => setAssignExpertForm({ ...assignExpertForm, academicYearId: e.target.value })}
                className="mt-1"
              >
                <option value="">Default (Current Academic Year)</option>
                {academicYears.map(y => (
                  <option key={y._id} value={y._id}>{y.yearName} ({y.code})</option>
                ))}
              </Select>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAssignExpertOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Assign Reviewer
            </Button>
          </div>
        </form>
      </Modal>

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
