import React, { useState, useEffect } from 'react';
import { expertApi } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import AiReportModal from '../components/AiReportModal';
import DocumentPreviewModal from '../components/DocumentPreviewModal';
import FacultyPasswordSettings from '../components/FacultyPasswordSettings';
import {
  FileCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Sparkles,
  History,
  Send,
  MessageSquare,
  ShieldCheck,
  Calendar,
  User,
  BookOpen
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, EmptyState, Modal, Input, Label, Textarea } from '../components/ui';

export default function ExpertDashboard({ currentSubTab }) {
  const [activeTab, setActiveTab] = useState(currentSubTab || 'pending');
  const [documents, setDocuments] = useState([]);
  const [reviewHistory, setReviewHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review Modal State
  const [reviewingDoc, setReviewingDoc] = useState(null);
  const [decision, setDecision] = useState('approved');
  const [comments, setComments] = useState('');
  const [contentQuality, setContentQuality] = useState(8);
  const [formattingCorrect, setFormattingCorrect] = useState(true);
  const [syllabusCoverage, setSyllabusCoverage] = useState(true);
  const [correctionInstructions, setCorrectionInstructions] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [previewDocId, setPreviewDocId] = useState(null);
  const [activeAiReport, setActiveAiReport] = useState(null);
  const [activeAiDocTitle, setActiveAiDocTitle] = useState('');

  useEffect(() => {
    if (currentSubTab) {
      if (currentSubTab === 'dashboard' || currentSubTab === 'review') setActiveTab('pending');
      else if (currentSubTab === 'history') setActiveTab('history');
      else setActiveTab(currentSubTab);
    }
  }, [currentSubTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docsRes, historyRes] = await Promise.all([
        expertApi.getAssignedDocuments().catch(() => ({ data: { success: true, documents: [] } })),
        expertApi.getReviewHistory().catch(() => ({ data: { success: true, reviews: [] } }))
      ]);
      if (docsRes?.data?.documents) setDocuments(docsRes.data.documents);
      if (historyRes?.data?.reviews) setReviewHistory(historyRes.data.reviews);
    } catch (err) {
      console.error('Failed to load expert review items', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenReview = (doc) => {
    setReviewingDoc(doc);
    setDecision('approved');
    setComments('Comprehensive, accurate, and syllabus compliant.');
    setContentQuality(8);
    setFormattingCorrect(true);
    setSyllabusCoverage(true);
    setCorrectionInstructions('');
    setRejectionReason('');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!comments.trim()) {
      alert('Review comments are mandatory.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        decision,
        comments,
        contentQuality: Number(contentQuality),
        formattingCorrect,
        syllabusCoverage,
        correctionInstructions,
        rejectionReason
      };

      const res = await expertApi.submitReview(reviewingDoc._id, payload);
      if (res.data?.success) {
        alert(res.data.message || 'Review submitted successfully.');
        setReviewingDoc(null);
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Review submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInspectAi = async (doc) => {
    try {
      const res = await expertApi.getDocumentDetails(doc._id);
      if (res.data?.success && res.data.aiReports && res.data.aiReports.length > 0) {
        setActiveAiReport(res.data.aiReports[0]);
        setActiveAiDocTitle(doc.title);
      } else {
        alert('AI preliminary audit report is not yet generated for this document.');
      }
    } catch (e) {
      alert('Failed to retrieve AI audit.');
    }
  };

  const pendingCount = documents.filter(d => ['Pending Expert Review', 'Expert Reviewing', 'Re-uploaded'].includes(d.status)).length;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              <FileCheck className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <h1 className="text-base font-semibold text-slate-900 tracking-tight">
              Subject Expert Verification Console
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-normal mt-1 ml-9">
            Peer review of course materials, inspect preliminary AI audits, identify syllabus gaps, and submit recommendations.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200/80 pb-2">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Assigned for Review ({pendingCount})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'history'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Review Decision History ({reviewHistory.length})
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Account Security & Password
        </button>
      </div>

      {/* Pending Reviews Table */}
      {activeTab === 'pending' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Assigned Course Materials</CardTitle>
              <CardDescription>Documents filtered by subjects officially assigned to your expert profile by HOD.</CardDescription>
            </div>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2.5">Document Title</th>
                  <th className="px-4 py-2.5">Faculty In-Charge</th>
                  <th className="px-4 py-2.5">Subject</th>
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
                      <span>Loading assigned reviews...</span>
                    </td>
                  </tr>
                ) : documents.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-4">
                      <EmptyState
                        icon={FileCheck}
                        title="No reviews pending"
                        description="There are currently no course documents waiting for your expert review."
                      />
                    </td>
                  </tr>
                ) : (
                  documents.map((doc) => (
                    <tr key={doc._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-900 block">{doc.title}</span>
                        <span className="text-[11px] text-slate-400 capitalize">{doc.documentType?.replace('_', ' ')}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium">
                        {doc.facultyId?.name || 'Faculty Member'}
                      </td>
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
                            icon={Sparkles}
                            onClick={() => handleInspectAi(doc)}
                            title="Inspect AI Audit"
                          >
                            AI Audit
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={Eye}
                            onClick={() => setPreviewDocId(doc._id)}
                            title="Preview Content"
                          >
                            Preview
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            icon={FileCheck}
                            onClick={() => handleOpenReview(doc)}
                          >
                            Review
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

      {/* History Tab */}
      {activeTab === 'history' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Past Expert Review Decisions</CardTitle>
              <CardDescription>Log of all peer review evaluations submitted by your profile.</CardDescription>
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
                  <th className="px-4 py-2.5">Expert Comments</th>
                  <th className="px-4 py-2.5">Quality Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reviewHistory.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-4">
                      <EmptyState
                        icon={History}
                        title="No review history recorded"
                        description="Past evaluations and peer review decisions will be archived here."
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
                          rev.decision === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : rev.decision === 'rejected'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {rev.decision?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-sm truncate italic font-normal">
                        "{rev.comments}"
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {rev.structuralEvaluation?.contentQuality || rev.qualityScore || 8}/10
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Account Security & Password Tab */}
      {activeTab === 'settings' && (
        <FacultyPasswordSettings />
      )}

      {/* Expert Review Modal */}
      {reviewingDoc && (
        <Modal
          isOpen={!!reviewingDoc}
          onClose={() => setReviewingDoc(null)}
          title="Conduct Expert Review Evaluation"
          description={`Peer review for "${reviewingDoc.title}" (${reviewingDoc.subjectId?.subjectName || ''})`}
          maxWidth="max-w-2xl"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setReviewingDoc(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={submitting}
                icon={Send}
                onClick={handleSubmitReview}
              >
                Confirm Decision
              </Button>
            </div>
          }
        >
          <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
            {/* Review Decision Pills */}
            <div>
              <Label required>Expert Review Decision</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'approved', label: 'Approve for HOD', color: 'border-emerald-500 bg-emerald-50/70 text-emerald-800' },
                  { id: 'correction_required', label: 'Request Corrections', color: 'border-amber-500 bg-amber-50/70 text-amber-800' },
                  { id: 'rejected', label: 'Reject Document', color: 'border-rose-500 bg-rose-50/70 text-rose-800' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDecision(item.id)}
                    className={`py-2 px-3 rounded-lg border text-center font-medium transition-colors cursor-pointer ${
                      decision === item.id
                        ? `${item.color} shadow-2xs ring-1 ring-offset-0`
                        : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Review Comments */}
            <div>
              <Label htmlFor="review-comments" required>Expert Review Comments</Label>
              <Textarea
                id="review-comments"
                required
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Detail your evaluation of academic accuracy, syllabus alignment, algorithms, and formatting..."
              />
            </div>

            {/* Quality Rating & Checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50/70 rounded-xl border border-slate-200/80">
              <div>
                <Label htmlFor="quality-score">Quality Score (1-10)</Label>
                <Input
                  id="quality-score"
                  type="number"
                  min="1"
                  max="10"
                  value={contentQuality}
                  onChange={(e) => setContentQuality(e.target.value)}
                />
              </div>
              <div className="flex flex-col justify-center pt-4 sm:pt-0">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formattingCorrect}
                    onChange={(e) => setFormattingCorrect(e.target.checked)}
                    className="h-3.5 w-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span className="font-medium text-slate-800 text-xs">Formatting Valid</span>
                </label>
              </div>
              <div className="flex flex-col justify-center">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={syllabusCoverage}
                    onChange={(e) => setSyllabusCoverage(e.target.checked)}
                    className="h-3.5 w-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span className="font-medium text-slate-800 text-xs">Syllabus Complete</span>
                </label>
              </div>
            </div>

            {/* Corrections Required */}
            {decision === 'correction_required' && (
              <div>
                <Label htmlFor="correction-instructions" required className="text-amber-800">
                  Specific Correction Instructions for Faculty
                </Label>
                <Textarea
                  id="correction-instructions"
                  rows={2}
                  value={correctionInstructions}
                  onChange={(e) => setCorrectionInstructions(e.target.value)}
                  placeholder="Specify missing sections, diagrams, or revisions required before resubmission..."
                  className="border-amber-300 bg-amber-50/20"
                />
              </div>
            )}

            {/* Rejection Reason */}
            {decision === 'rejected' && (
              <div>
                <Label htmlFor="rejection-reason" required className="text-rose-800">
                  Rejection Reason
                </Label>
                <Input
                  id="rejection-reason"
                  type="text"
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="State the academic policy or quality reason for rejection..."
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
