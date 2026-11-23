import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  X,
  Download,
  FileText,
  Calendar,
  User,
  Layers,
  History,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Check
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import { Modal, Button } from './ui';

export default function DocumentPreviewModal({ documentId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewContent, setPreviewContent] = useState('');
  const [selectedVersionNum, setSelectedVersionNum] = useState(1);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        setLoading(true);
        let res;
        try {
          res = await api.get(`/documents/${documentId}`);
        } catch {
          res = await api.get(`/faculty/documents/${documentId}`);
        }

        if (res.data?.success) {
          setData(res.data);
          setSelectedVersionNum(res.data.document.currentVersionNumber || 1);
        }

        try {
          const prevRes = await api.get(`/documents/${documentId}/versions/${selectedVersionNum || 1}/preview`);
          if (prevRes.data && prevRes.data.content) {
            setPreviewContent(prevRes.data.content);
          }
        } catch {
          // If not plain text, handled via iframe or download
        }
      } catch (err) {
        console.warn('Could not load full preview stream', err);
      } finally {
        setLoading(false);
      }
    };

    if (documentId) fetchDoc();
  }, [documentId, selectedVersionNum]);

  if (!documentId) return null;

  const doc = data?.document;
  const versions = data?.versions || [];
  const activeVersion = versions.find(v => v.versionNumber === selectedVersionNum) || doc?.currentVersionId;
  const isPdf = activeVersion?.fileExtension === '.pdf' || activeVersion?.mimeType === 'application/pdf';
  const isTxt = activeVersion?.fileExtension === '.txt' || activeVersion?.mimeType === 'text/plain';

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const filename = activeVersion?.originalFilename || `${doc?.title || 'document'}${activeVersion?.fileExtension || '.pdf'}`;

      const res = await api.get(`/documents/${documentId}/versions/${selectedVersionNum}/download`, {
        responseType: 'blob'
      });

      const blob = new Blob([res.data], { type: activeVersion?.mimeType || 'application/octet-stream' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.warn('Authenticated blob download fallback', err);
      const token = localStorage.getItem('docuflow_token');
      const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';
      const fallbackUrl = `${apiBase}/documents/${documentId}/versions/${selectedVersionNum}/download?token=${encodeURIComponent(token || '')}`;
      window.open(fallbackUrl, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal
      isOpen={!!documentId}
      onClose={onClose}
      title={doc?.title || 'Document Preview'}
      description={`Subject: ${doc?.subjectId?.subjectName || 'Course Material'} (${doc?.subjectId?.subjectCode || ''})`}
      maxWidth="max-w-4xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-[11px] text-slate-400 font-mono">
            ID: {documentId}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={Download}
              loading={downloading}
              onClick={handleDownload}
            >
              Download File
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      }
    >
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <div className="w-7 h-7 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-xs mt-3">Loading document metadata and content...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Status & Metadata Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50/70 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Workflow Status:</span>
              {doc && <StatusBadge status={doc.status} />}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
              <span>{doc?.facultyId?.name || 'Faculty Member'}</span>
              <span className="text-slate-300">•</span>
              <span>Semester {doc?.semesterId?.semesterNumber}</span>
              <span className="text-slate-300">•</span>
              <span>{doc?.academicRegulationId?.code || 'Regulation'}</span>
            </div>
          </div>

          {/* Version Selector (if multiple versions exist) */}
          {versions.length > 0 && (
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                <History className="w-3.5 h-3.5 text-slate-400" />
                <span>Version History:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {versions.map((ver) => (
                  <button
                    key={ver._id}
                    onClick={() => setSelectedVersionNum(ver.versionNumber)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                      selectedVersionNum === ver.versionNumber
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    v{ver.versionNumber}.0 {ver.versionNumber === doc?.currentVersionNumber && '(Active)'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Document Content Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900">Document Stream Preview</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200/80 uppercase">
                {activeVersion?.fileExtension || 'PDF'}
              </span>
            </div>

            {isPdf ? (
              <div className="w-full rounded-xl overflow-hidden border border-slate-200/90 shadow-2xs bg-slate-100">
                <iframe
                  src={`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'}/documents/${documentId}/versions/${selectedVersionNum}/preview?token=${encodeURIComponent(localStorage.getItem('docuflow_token') || '')}`}
                  className="w-full h-[450px]"
                  title="PDF Document Preview"
                />
              </div>
            ) : isTxt && previewContent ? (
              <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs overflow-x-auto max-h-80 border border-slate-800 leading-relaxed whitespace-pre-wrap">
                {previewContent}
              </div>
            ) : (
              <div className="p-8 bg-slate-50/60 border border-slate-200/80 rounded-xl text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 mx-auto shadow-2xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 text-xs">{activeVersion?.originalFilename || doc?.title || 'Course Material File'}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {activeVersion?.fileExtension?.toUpperCase() || 'DOCUMENT'} • {((activeVersion?.fileSize || 0) / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Download}
                  loading={downloading}
                  onClick={handleDownload}
                  className="mx-auto"
                >
                  Download and Open File
                </Button>
              </div>
            )}
          </div>

          {/* Expert & HOD Decision Logs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* Expert Feedback */}
            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-indigo-600" />
                  Expert Review Decision
                </span>
              </div>
              {data?.expertReviews && data.expertReviews.length > 0 ? (
                <div className="space-y-1.5">
                  {data.expertReviews.map((rev, idx) => (
                    <div key={idx} className="p-2.5 bg-white rounded-lg border border-slate-200/80 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-800">{rev.expertId?.name || 'Subject Expert'}</span>
                        <span className={`text-[10px] font-medium uppercase px-1.5 py-0.2 rounded border ${
                          rev.decision === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {rev.decision}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-1 italic font-normal">"{rev.comments}"</p>
                      {rev.correctionInstructions && (
                        <p className="text-rose-600 mt-1 text-[11px] font-medium">Corrections: {rev.correctionInstructions}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No expert review recorded yet.</p>
              )}
            </div>

            {/* HOD Feedback */}
            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-amber-600" />
                  HOD Final Approval
                </span>
              </div>
              {data?.hodApprovals && data.hodApprovals.length > 0 ? (
                <div className="space-y-1.5">
                  {data.hodApprovals.map((app, idx) => (
                    <div key={idx} className="p-2.5 bg-white rounded-lg border border-slate-200/80 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-800">{app.hodId?.name || 'Head of Department'}</span>
                        <span className={`text-[10px] font-medium uppercase px-1.5 py-0.2 rounded border ${
                          app.decision === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {app.decision}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-1 italic font-normal">"{app.comments || 'Approved for publication'}"</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Pending HOD final review.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
