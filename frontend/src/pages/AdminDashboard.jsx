import React, { useState, useEffect } from 'react';
import { adminApi, hodApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
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
  Select,
  Label
} from '../components/ui';
import {
  ShieldCheck,
  Users,
  GraduationCap,
  Award,
  BookOpen,
  FileText,
  Clock,
  Layers,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Trash2,
  UserCheck,
  UserX,
  History,
  Activity,
  Server,
  Database,
  Cpu,
  KeyRound,
  PlusCircle,
  UserPlus
} from 'lucide-react';

export default function AdminDashboard({ currentSubTab }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(currentSubTab || 'overview');
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState([]);

  // Search & Filters for Users
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Curriculum Data
  const [regulations, setRegulations] = useState([]);
  const [batches, setBatches] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Subject Assignments State (Admin Exclusive)
  const [assignments, setAssignments] = useState([]);
  const [assignmentOptions, setAssignmentOptions] = useState({
    users: [],
    subjects: [],
    academicYears: [],
    batches: [],
    regulations: [],
    departments: []
  });
  const [assignForm, setAssignForm] = useState({
    userId: '',
    role: 'faculty',
    subjectId: '',
    department: 'Master of Computer Applications (MCA)',
    academicYearId: '',
    batchId: ''
  });
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignFilterRole, setAssignFilterRole] = useState('all');
  const [assignSearch, setAssignSearch] = useState('');
  const [assignError, setAssignError] = useState('');
  const [assignSuccess, setAssignSuccess] = useState('');

  // Action Modals
  const [selectedUser, setSelectedUser] = useState(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [newRole, setNewRole] = useState('faculty');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (currentSubTab) {
      if (['overview', 'assignments', 'users', 'approvals', 'curriculum', 'audit', 'settings'].includes(currentSubTab)) {
        setActiveTab(currentSubTab);
      } else if (currentSubTab === 'dashboard') {
        setActiveTab('overview');
      }
    }
  }, [currentSubTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [metricsRes, usersRes, logsRes, regRes, batchRes, subRes, assignRes, optRes] = await Promise.all([
        adminApi.getMetrics().catch(() => ({ data: { success: true, metrics: null } })),
        adminApi.getUsers({ role: selectedRole, status: selectedStatus, search: searchQuery }).catch(() => ({ data: { success: true, users: [] } })),
        adminApi.getAuditLogs({ limit: 40 }).catch(() => ({ data: { success: true, logs: [] } })),
        hodApi.getRegulations().catch(() => ({ data: { success: true, regulations: [] } })),
        hodApi.getBatches().catch(() => ({ data: { success: true, batches: [] } })),
        hodApi.getSubjects().catch(() => ({ data: { success: true, subjects: [] } })),
        adminApi.getSubjectAssignments().catch(() => ({ data: { success: true, assignments: [] } })),
        adminApi.getAssignmentOptions().catch(() => ({ data: { success: true, options: {} } }))
      ]);

      if (metricsRes?.data?.metrics) setMetrics(metricsRes.data.metrics);
      if (usersRes?.data?.users) {
        setUsers(usersRes.data.users);
        setTotalUsers(usersRes.data.total || usersRes.data.users.length);
      }
      if (logsRes?.data?.logs) setAuditLogs(logsRes.data.logs);
      if (regRes?.data?.regulations) setRegulations(regRes.data.regulations);
      if (batchRes?.data?.batches) setBatches(batchRes.data.batches);
      if (subRes?.data?.subjects) setSubjects(subRes.data.subjects);
      if (assignRes?.data?.assignments) setAssignments(assignRes.data.assignments);
      if (optRes?.data?.options) setAssignmentOptions(optRes.data.options);
    } catch (err) {
      console.error('Failed to load admin console data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedRole, selectedStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  // Toggle user activation status
  const handleToggleStatus = async (targetUser) => {
    if (targetUser._id === user?._id) {
      alert('You cannot deactivate your own active administrative session.');
      return;
    }
    const newStatus = !targetUser.isActive;
    const confirmMsg = newStatus
      ? `Are you sure you want to activate the account for ${targetUser.name}?`
      : `Are you sure you want to suspend access for ${targetUser.name}? They will not be able to log in.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await adminApi.toggleUserStatus(targetUser._id, newStatus);
      if (res.data.success) {
        alert(res.data.message);
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Operation failed.');
    }
  };

  // Open role modification modal
  const handleOpenRoleModal = (targetUser) => {
    setSelectedUser(targetUser);
    setNewRole(targetUser.role);
    setIsRoleModalOpen(true);
  };

  // Submit role change
  const handleSubmitRoleChange = async () => {
    if (!selectedUser) return;
    if (selectedUser._id === user?._id && newRole !== 'admin') {
      alert('You cannot demote your own active administrator account.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await adminApi.updateUserRole(selectedUser._id, newRole);
      if (res.data.success) {
        alert(res.data.message);
        setIsRoleModalOpen(false);
        setSelectedUser(null);
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to update role.');
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Approve user
  const handleApproveUser = async (targetUser) => {
    try {
      const res = await adminApi.approveUser(targetUser._id);
      if (res.data.success) {
        alert(res.data.message);
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Approval failed.');
    }
  };

  // Quick Reject user
  const handleRejectUser = async (targetUser) => {
    const reason = window.prompt(`Please provide a rejection note for ${targetUser.name}:`, 'Administrative verification requirement not met');
    if (reason === null) return;

    try {
      const res = await adminApi.rejectUser(targetUser._id, reason);
      if (res.data.success) {
        alert(res.data.message);
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Rejection failed.');
    }
  };

  // Delete user permanently
  const handleDeleteUser = async (targetUser) => {
    if (targetUser._id === user?._id) {
      alert('You cannot delete your own active administrator account.');
      return;
    }

    if (!window.confirm(`CAUTION: Are you sure you want to permanently delete ${targetUser.name} (${targetUser.email})? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await adminApi.deleteUser(targetUser._id);
      if (res.data.success) {
        alert(res.data.message);
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Delete operation failed.');
    }
  };

  // Handle Subject Responsibility Assignment
  const handleAssignSubject = async (e) => {
    e.preventDefault();
    setAssignError('');
    setAssignSuccess('');

    if (!assignForm.userId) {
      setAssignError('Please select an institutional user to assign.');
      return;
    }
    if (!assignForm.subjectId) {
      setAssignError('Please select a subject.');
      return;
    }

    setAssignSubmitting(true);
    try {
      const res = await adminApi.assignSubject({
        userId: assignForm.userId,
        role: assignForm.role,
        subjectId: assignForm.subjectId,
        department: assignForm.department,
        academicYearId: assignForm.academicYearId || undefined,
        batchId: assignForm.batchId || undefined
      });

      if (res.data.success) {
        setAssignSuccess(res.data.message || 'Subject assigned successfully.');
        setAssignForm(prev => ({
          ...prev,
          userId: '',
          subjectId: ''
        }));
        loadData();
      }
    } catch (err) {
      setAssignError(err.response?.data?.message || err.message || 'Failed to assign subject.');
    } finally {
      setAssignSubmitting(false);
    }
  };

  // Handle Removal of Subject Responsibility
  const handleRemoveAssignment = async (item) => {
    const roleLabel = item.assignmentType.toUpperCase();
    const userName = item.user?.name || 'User';
    const subjCode = item.subject?.subjectCode || 'Subject';
    if (!window.confirm(`Are you sure you want to remove the ${roleLabel} responsibility for ${userName} on ${subjCode}?`)) {
      return;
    }

    try {
      const res = await adminApi.removeSubjectAssignment(item.assignmentType, item.id);
      if (res.data.success) {
        setAssignSuccess(`Removed ${roleLabel} responsibility for ${userName} on ${subjCode}.`);
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to remove assignment.');
    }
  };

  const pendingApprovalsList = users.filter(u => u.approvalStatus === 'pending');

  const tabs = [
    { id: 'overview', label: 'System Telemetry', icon: Activity },
    { id: 'assignments', label: 'Subject Assignments', count: assignments.length, icon: BookOpen },
    { id: 'users', label: 'User Directory', count: totalUsers, icon: Users },
    { id: 'approvals', label: 'Role Authorizations', count: pendingApprovalsList.length, icon: CheckCircle2 },
    { id: 'curriculum', label: 'Curriculum & Structure', icon: Layers },
    { id: 'audit', label: 'Security Audit Trail', icon: ShieldCheck }
  ];

  const roleBadgeStyle = {
    admin: 'bg-purple-50 text-purple-700 border-purple-200/90 font-bold',
    hod: 'bg-amber-50 text-amber-700 border-amber-200/90 font-semibold',
    expert: 'bg-indigo-50 text-indigo-700 border-indigo-200/90 font-medium',
    faculty: 'bg-blue-50 text-blue-700 border-blue-200/90 font-medium',
    student: 'bg-emerald-50 text-emerald-700 border-emerald-200/90 font-medium'
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">
              System Administrator Command Console
            </span>
            <span className="text-xs text-slate-500 font-mono">Kongu Autonomous MCA</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Institutional Administration & Role Management
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Centralized institutional governance: oversee academic roles, approve privileged accounts, configure curriculum structures, and inspect tamper-evident system audit trails.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            loading={loading}
            icon={RefreshCw}
          >
            Refresh Telemetry
          </Button>
        </div>
      </div>

      {/* Segmented Navigation Tabs */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-1.5 shadow-2xs flex flex-wrap items-center gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SYSTEM OVERVIEW & METRICS */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Users"
              value={metrics?.users?.total || users.length}
              subtext="Registered institutional profiles"
              icon={<Users className="w-5 h-5 text-purple-600" />}
              badge="All Roles"
            />
            <StatCard
              label="Student Accounts"
              value={metrics?.users?.students || users.filter(u => u.role === 'student').length}
              subtext="Enrolled MCA students"
              status="success"
              icon={<GraduationCap className="w-5 h-5 text-emerald-600" />}
            />
            <StatCard
              label="Faculty & Reviewers"
              value={(metrics?.users?.faculty || 0) + (metrics?.users?.experts || 0)}
              subtext={`${metrics?.users?.faculty || 0} Faculty • ${metrics?.users?.experts || 0} Experts`}
              icon={<Award className="w-5 h-5 text-blue-600" />}
            />
            <StatCard
              label="HOD & Admin Desks"
              value={(metrics?.users?.hods || 0) + (metrics?.users?.admins || 0)}
              subtext={`${metrics?.users?.hods || 0} HOD • ${metrics?.users?.admins || 0} Administrator`}
              icon={<ShieldCheck className="w-5 h-5 text-amber-600" />}
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Documents"
              value={metrics?.documents?.total || 0}
              subtext="Managed course materials"
              icon={<FileText className="w-5 h-5 text-indigo-600" />}
            />
            <StatCard
              label="Published to Students"
              value={metrics?.documents?.published || 0}
              subtext="Live in student library"
              status="success"
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            />
            <StatCard
              label="Pending Authorizations"
              value={metrics?.users?.pendingApprovals || pendingApprovalsList.length}
              subtext="Accounts awaiting approval"
              status="warning"
              icon={<Clock className="w-5 h-5 text-amber-600" />}
            />
            <StatCard
              label="Active Regulations"
              value={metrics?.curriculum?.regulations || regulations.length}
              subtext={`${metrics?.curriculum?.subjects || subjects.length} subjects registered`}
              icon={<Layers className="w-5 h-5 text-blue-600" />}
            />
          </div>

          {/* System Health Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-4 h-4 text-purple-600" />
                DocuFlow AI Infrastructure Health & Services
              </CardTitle>
              <CardDescription>
                Live operational status across database persistence, AI inference service, and secure execution sandboxes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-emerald-600" /> MongoDB 9.0 Enterprise
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      CONNECTED
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Persistent storage at 127.0.0.1:27017</p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-blue-600" /> Python FastAPI Microservice
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                      ONLINE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">AI auditor & syllabus verification pipeline</p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-purple-600" /> Multi-Role Access Control
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                      ACTIVE (5 ROLES)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Admin, HOD, Expert, Faculty, Student</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SUBJECT ASSIGNMENT MANAGEMENT (ADMIN EXCLUSIVE) */}
      {/* ========================================================================= */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Faculty Allocations"
              value={assignments.filter(a => a.assignmentType === 'faculty').length}
              subtext="Active course teaching assignments"
              icon={<Award className="w-5 h-5 text-blue-600" />}
            />
            <StatCard
              label="Expert Reviewers"
              value={assignments.filter(a => a.assignmentType === 'expert').length}
              subtext="Designated peer review verifiers"
              icon={<ShieldCheck className="w-5 h-5 text-indigo-600" />}
            />
            <StatCard
              label="HOD Subject Oversight"
              value={assignments.filter(a => a.assignmentType === 'hod').length}
              subtext="Head of Dept academic oversight"
              icon={<CheckCircle2 className="w-5 h-5 text-amber-600" />}
            />
            <StatCard
              label="Registered Subjects"
              value={subjects.length}
              subtext="Total autonomous curriculum courses"
              icon={<BookOpen className="w-5 h-5 text-purple-600" />}
            />
          </div>

          {/* Form Card: Assign Subject Responsibility */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                Assign Subject Responsibility
              </CardTitle>
              <CardDescription>
                Allocate teaching, peer-review, or departmental oversight responsibility to verified institutional faculty, experts, and HODs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assignError && (
                <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{assignError}</span>
                </div>
              )}
              {assignSuccess && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{assignSuccess}</span>
                </div>
              )}

              <form onSubmit={handleAssignSubject} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Select User */}
                  <div>
                    <Label required>Institutional User</Label>
                    <Select
                      value={assignForm.userId}
                      onChange={(e) => setAssignForm(prev => ({ ...prev, userId: e.target.value }))}
                      required
                    >
                      <option value="">-- Choose User --</option>
                      {assignmentOptions.users.map(u => (
                        <option key={u._id} value={u._id}>
                          {u.name} ({u.role.toUpperCase()}) - {u.email}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Select Responsibility */}
                  <div>
                    <Label required>Role Responsibility</Label>
                    <Select
                      value={assignForm.role}
                      onChange={(e) => setAssignForm(prev => ({ ...prev, role: e.target.value }))}
                      required
                    >
                      <option value="faculty">Faculty (Course Material Upload & Teaching)</option>
                      <option value="expert">Expert Reviewer (Peer Document Verification)</option>
                      <option value="hod">HOD (Departmental Final Sign-Off Oversight)</option>
                    </Select>
                  </div>

                  {/* Select Department */}
                  <div>
                    <Label>Department</Label>
                    <Select
                      value={assignForm.department}
                      onChange={(e) => setAssignForm(prev => ({ ...prev, department: e.target.value }))}
                    >
                      {(assignmentOptions.departments || ['Master of Computer Applications (MCA)']).map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Select Subject */}
                  <div>
                    <Label required>Autonomous Subject</Label>
                    <Select
                      value={assignForm.subjectId}
                      onChange={(e) => setAssignForm(prev => ({ ...prev, subjectId: e.target.value }))}
                      required
                    >
                      <option value="">-- Choose Subject --</option>
                      {assignmentOptions.subjects.map(s => (
                        <option key={s._id} value={s._id}>
                          {s.subjectCode} - {s.subjectName} (Sem {s.semesterNumber})
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Select Academic Year */}
                  <div>
                    <Label>Academic Year</Label>
                    <Select
                      value={assignForm.academicYearId}
                      onChange={(e) => setAssignForm(prev => ({ ...prev, academicYearId: e.target.value }))}
                    >
                      <option value="">-- Default / Current Academic Year --</option>
                      {assignmentOptions.academicYears.map(y => (
                        <option key={y._id} value={y._id}>
                          {y.yearString} {y.isCurrent ? '(Current)' : ''}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Select Batch */}
                  <div>
                    <Label>Batch / Academic Context</Label>
                    <Select
                      value={assignForm.batchId}
                      onChange={(e) => setAssignForm(prev => ({ ...prev, batchId: e.target.value }))}
                    >
                      <option value="">-- Default Regulation Batch --</option>
                      {assignmentOptions.batches.map(b => (
                        <option key={b._id} value={b._id}>
                          {b.batchName} ({b.academicYear})
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    variant="brand"
                    size="sm"
                    loading={assignSubmitting}
                    icon={PlusCircle}
                  >
                    Assign Subject Responsibility
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Assignments Table Card */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  Active Subject Assignment Records
                </CardTitle>
                <CardDescription>
                  List of verified MongoDB subject responsibilities assigned across Faculty, Experts, and HODs.
                </CardDescription>
              </div>

              {/* Filter Pills & Search */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
                  {['all', 'faculty', 'expert', 'hod'].map((r) => (
                    <button
                      key={r}
                      onClick={() => setAssignFilterRole(r)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase transition-all cursor-pointer ${
                        assignFilterRole === r
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={assignSearch}
                    onChange={(e) => setAssignSearch(e.target.value)}
                    placeholder="Search user or subject..."
                    className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 w-44 sm:w-52"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Assigned User</th>
                      <th className="py-3 px-4">Responsibility</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Batch / Academic Year</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Assigned On</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assignments
                      .filter((a) => {
                        if (assignFilterRole !== 'all' && a.assignmentType !== assignFilterRole) return false;
                        if (!assignSearch.trim()) return true;
                        const term = assignSearch.trim().toLowerCase();
                        return (
                          a.user?.name?.toLowerCase().includes(term) ||
                          a.user?.email?.toLowerCase().includes(term) ||
                          a.subject?.subjectCode?.toLowerCase().includes(term) ||
                          a.subject?.subjectName?.toLowerCase().includes(term)
                        );
                      })
                      .map((item) => {
                        const typeStyle = {
                          faculty: 'bg-blue-50 text-blue-700 border-blue-200',
                          expert: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                          hod: 'bg-amber-50 text-amber-700 border-amber-200'
                        };

                        const typeLabel = {
                          faculty: 'Faculty (Teaching)',
                          expert: 'Expert (Reviewer)',
                          hod: 'HOD (Oversight)'
                        };

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-900">{item.user?.name || 'Unknown'}</div>
                              <div className="text-[11px] text-slate-500 font-mono">{item.user?.email}</div>
                              {item.user?.institutionalId && (
                                <div className="text-[10px] text-slate-400 font-mono">ID: {item.user.institutionalId}</div>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${typeStyle[item.assignmentType] || 'bg-slate-100 text-slate-700'}`}>
                                {typeLabel[item.assignmentType] || item.assignmentType}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-mono font-bold text-slate-900">{item.subject?.subjectCode}</div>
                              <div className="text-[11px] text-slate-600 line-clamp-1">{item.subject?.subjectName}</div>
                              <div className="text-[10px] text-slate-400">Semester {item.subject?.semesterNumber || 'N/A'}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-600 text-[11px]">
                              <div>{item.batch?.batchName || 'Core Curriculum'}</div>
                              <div className="text-slate-400 font-mono text-[10px]">{item.academicYear?.yearString || 'Current AY'}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-500 text-[11px]">
                              {item.department || 'Master of Computer Applications (MCA)'}
                            </td>
                            <td className="py-3 px-4 text-slate-400 text-[11px] font-mono">
                              {new Date(item.assignedAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleRemoveAssignment(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors font-medium text-[11px] cursor-pointer"
                                title="Remove assignment"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    {assignments.length === 0 && (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-slate-400 text-xs">
                          No subject assignments created yet. Use the form above to assign faculty, experts, or HODs to autonomous subjects.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: USER DIRECTORY & ROLE MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Search & Filter Header */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search users by name, email, institutional ID, or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 outline-hidden focus:border-blue-500"
                />
              </div>
              <Button type="submit" variant="primary" size="sm" icon={Search}>
                Filter
              </Button>
            </form>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium mr-1">Role:</span>
                {['all', 'admin', 'hod', 'faculty', 'expert', 'student'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setSelectedRole(r)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium uppercase transition-colors cursor-pointer ${
                      selectedRole === r
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium mr-1">Status:</span>
                {['all', 'approved', 'pending', 'active', 'inactive'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedStatus(s)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors cursor-pointer ${
                      selectedStatus === s
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* User Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-4 py-3">Institutional User</th>
                    <th className="px-4 py-3">ID / Roll No</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Assigned Role</th>
                    <th className="px-4 py-3">Approval</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No user accounts match the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const isSelf = u._id === user?._id;
                      return (
                        <tr key={u._id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs uppercase">
                                {u.name ? u.name[0] : 'U'}
                              </div>
                              <div>
                                <span className="font-semibold text-slate-900 block leading-tight">
                                  {u.name} {isSelf && <span className="text-[10px] text-blue-600 font-normal">(You)</span>}
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono">{u.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-slate-700">
                            {u.institutionalId || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                            {u.department || 'Master of Computer Applications'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase border ${roleBadgeStyle[u.role] || 'bg-slate-100 text-slate-600'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize border ${
                              u.approvalStatus === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : u.approvalStatus === 'pending'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {u.approvalStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                              u.isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}>
                              {u.isActive ? 'Active' : 'Suspended'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Change Role Button */}
                              <button
                                onClick={() => handleOpenRoleModal(u)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors cursor-pointer"
                                title="Change Role"
                              >
                                Edit Role
                              </button>

                              {/* Toggle Active Status */}
                              {!isSelf && (
                                <button
                                  onClick={() => handleToggleStatus(u)}
                                  className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                                    u.isActive
                                      ? 'hover:bg-amber-50 text-slate-400 hover:text-amber-700'
                                      : 'hover:bg-emerald-50 text-slate-400 hover:text-emerald-700'
                                  }`}
                                  title={u.isActive ? 'Suspend User' : 'Activate User'}
                                >
                                  {u.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                                </button>
                              )}

                              {/* Delete User */}
                              {!isSelf && (
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  className="p-1 rounded text-xs hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                  title="Delete User Permanently"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ROLE AUTHORIZATIONS QUEUE */}
      {/* ========================================================================= */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
                Pending Account Authorizations ({pendingApprovalsList.length})
              </CardTitle>
              <CardDescription>
                Privileged accounts (HOD, Expert Reviewer, Administrator) requesting authorization to access protected academic workflows.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingApprovalsList.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="Authorization Queue Clean"
                  description="All institutional user accounts have been authorized and approved."
                />
              ) : (
                <div className="space-y-3">
                  {pendingApprovalsList.map((targetUser) => (
                    <div
                      key={targetUser._id}
                      className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 text-sm">{targetUser.name}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase border ${roleBadgeStyle[targetUser.requestedRole || targetUser.role]}`}>
                            Requested: {targetUser.requestedRole || targetUser.role}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{targetUser.email}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-600 mt-2">
                          <span><strong>ID:</strong> {targetUser.institutionalId}</span>
                          <span>•</span>
                          <span><strong>Dept:</strong> {targetUser.department}</span>
                          <span>•</span>
                          <span><strong>Phone:</strong> {targetUser.phone || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={XCircle}
                          onClick={() => handleRejectUser(targetUser)}
                        >
                          Reject
                        </Button>
                        <Button
                          variant="brand"
                          size="sm"
                          icon={CheckCircle2}
                          onClick={() => handleApproveUser(targetUser)}
                        >
                          Approve Account
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CURRICULUM & STRUCTURE OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'curriculum' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Academic Regulations</CardTitle>
                <CardDescription>Curriculum framework governance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {regulations.map((r) => (
                  <div key={r._id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800">{r.code}</span>
                    <span className="text-[11px] text-slate-500">{r.name}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Student Batches</CardTitle>
                <CardDescription>Registered academic cohorts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {batches.map((b) => (
                  <div key={b._id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800">{b.batchName}</span>
                    <span className="text-[11px] text-slate-500">Reg: {b.academicRegulationId?.code || 'MCA'}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Registered Subjects</CardTitle>
                <CardDescription>Courses & coding modules</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold text-slate-900">{subjects.length}</div>
                <p className="text-xs text-slate-500">Autonomous curriculum courses registered across all active semesters.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SYSTEM SECURITY AUDIT TRAIL */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              Institutional Security & Operational Audit Trail
            </CardTitle>
            <CardDescription>
              Tamper-evident log of authentication events, administrative role updates, document decisions, and user registrations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Actor / User</th>
                    <th className="px-4 py-3">Target</th>
                    <th className="px-4 py-3">IP Address</th>
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No security audit logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(log.timestamp || log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          <code className="text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200/60 font-mono text-[11px]">
                            {log.action}
                          </code>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {log.userName || log.userId?.name || 'System'}
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">
                          {log.targetCollection ? `${log.targetCollection}` : 'N/A'}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                          {log.ipAddress || '127.0.0.1'}
                        </td>
                        <td className="px-4 py-3 text-slate-600 max-w-xs truncate font-mono text-[10px]">
                          {JSON.stringify(log.details || {})}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* ROLE MODIFICATION MODAL */}
      {/* ========================================================================= */}
      {isRoleModalOpen && selectedUser && (
        <Modal
          isOpen={isRoleModalOpen}
          onClose={() => setIsRoleModalOpen(false)}
          title={`Modify Role for ${selectedUser.name}`}
          description={`Select the new institutional authorization role for ${selectedUser.email}.`}
          maxWidth="max-w-md"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsRoleModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="brand"
                size="sm"
                loading={actionLoading}
                onClick={handleSubmitRoleChange}
              >
                Save Role Assignment
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div>
              <Label>Current Role</Label>
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-semibold uppercase text-slate-700">
                {selectedUser.role}
              </div>
            </div>

            <div>
              <Label required>Assign New Academic / Administrative Role</Label>
              <Select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              >
                <option value="student">Student (MCA Coursework & Coding)</option>
                <option value="faculty">Faculty (Course Material Authoring)</option>
                <option value="expert">Expert Reviewer (Peer Verification)</option>
                <option value="hod">Head of Department (HOD Approval Authority)</option>
                <option value="admin">Administrator (System Platform Governance)</option>
              </Select>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed">
              <strong>Notice:</strong> Changing this user's role will immediately update their navigation workspace, permission boundary, and system access rights.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
