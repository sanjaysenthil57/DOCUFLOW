import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  FileText,
  Clock,
  Cpu,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Modal, Button } from './ui';

// Safe string extractor to guarantee no raw object is ever rendered as a React child
const safeText = (val, fallback = '') => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    if (typeof val.issue === 'string' && val.issue.trim()) return val.issue;
    if (typeof val.description === 'string' && val.description.trim()) return val.description;
    if (typeof val.suggestion === 'string' && val.suggestion.trim()) return val.suggestion;
    if (typeof val.recommendation === 'string' && val.recommendation.trim()) return val.recommendation;
    if (typeof val.section === 'string' && val.section.trim()) return val.section;
    if (typeof val.word === 'string' && val.word.trim()) return val.word;
    if (typeof val.type === 'string' && val.type.trim()) return val.type;
    try {
      return JSON.stringify(val);
    } catch {
      return fallback;
    }
  }
  return fallback;
};

export default function AiReportModal({ report, documentTitle, onClose }) {
  if (!report) return null;

  const score = report.qualityScore || 0;
  const scoreConfig =
    score >= 85
      ? { text: 'text-emerald-700', bg: 'bg-emerald-50/70', border: 'border-emerald-200/80', label: 'High Academic Quality' }
      : score >= 70
      ? { text: 'text-blue-700', bg: 'bg-blue-50/70', border: 'border-blue-200/80', label: 'Meets Syllabus Standards' }
      : { text: 'text-amber-800', bg: 'bg-amber-50/70', border: 'border-amber-200/80', label: 'Revisions Recommended' };

  return (
    <Modal
      isOpen={!!report}
      onClose={onClose}
      title="AI Preliminary Verification Audit Report"
      description={`Automated syllabus compliance & structure analysis for ${documentTitle}`}
      maxWidth="max-w-3xl"
      footer={
        <Button variant="secondary" size="sm" onClick={onClose}>
          Close Audit Report
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Top Score Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center ${scoreConfig.bg} ${scoreConfig.border}`}>
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Quality Score</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className={`text-3xl font-semibold tracking-tight ${scoreConfig.text}`}>{score}</span>
              <span className="text-xs text-slate-400 font-normal">/100</span>
            </div>
            <span className={`text-[11px] font-medium mt-1 ${scoreConfig.text}`}>
              {scoreConfig.label}
            </span>
          </div>

          <div className="sm:col-span-2 p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Audit Summary</span>
              <p className="text-xs text-slate-700 mt-1 leading-relaxed font-normal">
                {report.summary || 'Document audited against Autonomous MCA syllabus standards and structural criteria.'}
              </p>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-2.5 border-t border-slate-200/70 mt-2">
              <span className="flex items-center gap-1.5 font-mono">
                <Cpu className="w-3.5 h-3.5 text-blue-600" />
                {report.modelInfo?.modelName || 'llama3.2:1b'}
              </span>
              <span className="flex items-center gap-1.5 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {report.modelInfo?.executionTimeMs || 420}ms
              </span>
            </div>
          </div>
        </div>

        {/* Missing Standard Academic Sections */}
        {report.missingSections && report.missingSections.length > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-medium text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Missing Standard Syllabus Sections</span>
            </div>
            <ul className="space-y-1 pl-6">
              {report.missingSections.map((sec, idx) => (
                <li key={idx} className="text-xs text-amber-800 list-disc font-normal">
                  {safeText(sec, 'Missing Section')}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Structural & Clarity Observations */}
        {report.structuralIssues && report.structuralIssues.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5 text-rose-500" />
              Structural & Clarity Observations
            </h4>
            <div className="space-y-1.5">
              {report.structuralIssues.map((item, idx) => {
                const issueText = safeText(item?.issue || item?.description || item, 'Observation noted');
                const sectionName = typeof item === 'object' && item?.section ? safeText(item.section) : null;
                const pageNum = typeof item === 'object' && item?.page !== undefined && item?.page !== null ? String(item.page) : null;

                return (
                  <div key={idx} className="p-2.5 rounded-lg border border-slate-200/80 bg-white text-xs text-slate-700 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                      <div>
                        {sectionName && (
                          <span className="font-semibold text-slate-900 block mb-0.5">
                            {sectionName}
                          </span>
                        )}
                        <span className="leading-relaxed font-normal text-slate-600">
                          {issueText}
                        </span>
                      </div>
                    </div>
                    {pageNum && (
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                        p. {pageNum}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recommended Improvements / Suggestions */}
        {((report.recommendations && report.recommendations.length > 0) || (report.suggestedCorrections && report.suggestedCorrections.length > 0)) && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Preliminary AI Suggestions for Reviewer
            </h4>
            <div className="space-y-1.5">
              {(report.recommendations || report.suggestedCorrections || []).map((rec, idx) => {
                const recText = safeText(rec, 'Suggested revision');
                return (
                  <div key={idx} className="p-2.5 rounded-lg border border-slate-200/80 bg-white text-xs text-slate-700 flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed font-normal">{recText}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Institutional Governance Notice */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>Academic Policy Notice:</strong> AI verification provides structural assessment only. Final academic decision rests solely with Subject Expert and HOD.
          </span>
        </div>
      </div>
    </Modal>
  );
}
