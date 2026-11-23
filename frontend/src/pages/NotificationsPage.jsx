import React, { useState, useEffect } from 'react';
import { notificationApi } from '../services/api';
import {
  Bell,
  CheckCircle2,
  CheckCheck,
  FileText,
  AlertTriangle,
  Sparkles,
  Clock,
  ArrowRight,
  Inbox
} from 'lucide-react';
import { Button, Card, EmptyState } from '../components/ui';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filterUnread, setFilterUnread] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationApi.getNotifications();
      if (res.data?.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (e) {
      console.error('Failed to load notifications', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      fetchNotifications();
    } catch (e) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      fetchNotifications();
    } catch (e) {}
  };

  const displayedList = filterUnread
    ? notifications.filter(n => !n.isRead)
    : notifications;

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              <Bell className="w-3.5 h-3.5" />
            </div>
            <h1 className="text-base font-semibold text-slate-900 tracking-tight">
              Notifications & System Alerts
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-normal mt-1 ml-9">
            Real-time status updates on document reviews, AI verification audits, and HOD approvals.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:self-center self-start">
          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              icon={CheckCheck}
              onClick={handleMarkAllRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200/80 pb-2">
        <button
          onClick={() => setFilterUnread(false)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            !filterUnread
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilterUnread(true)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            filterUnread
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Unread Only ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
            <span>Loading notifications...</span>
          </div>
        ) : displayedList.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={filterUnread ? 'No unread notifications' : 'Your notification inbox is clean'}
            description="When faculty upload course notes, AI completes verification, or experts review materials, status updates will appear here."
          />
        ) : (
          displayedList.map((n) => (
            <div
              key={n._id}
              onClick={() => !n.isRead && handleMarkRead(n._id)}
              className={`p-4 rounded-xl border transition-all duration-150 flex items-start justify-between gap-3 cursor-pointer ${
                n.isRead
                  ? 'bg-white border-slate-200/70 hover:border-slate-300'
                  : 'bg-blue-50/40 border-blue-200/70 shadow-2xs hover:border-blue-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    n.type === 'APPROVAL'
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/80'
                      : n.type === 'AI_VERIFICATION'
                      ? 'bg-blue-50 text-blue-600 border border-blue-200/80'
                      : n.type === 'REJECTION'
                      ? 'bg-rose-50 text-rose-600 border border-rose-200/80'
                      : 'bg-slate-100 text-slate-600 border border-slate-200/80'
                  }`}
                >
                  {n.type === 'APPROVAL' ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : n.type === 'AI_VERIFICATION' ? (
                    <Sparkles className="w-3.5 h-3.5" />
                  ) : n.type === 'REJECTION' ? (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  ) : (
                    <FileText className="w-3.5 h-3.5" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold text-slate-900 leading-snug">
                      {n.title || 'System Notification'}
                    </h4>
                    {!n.isRead && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 font-normal leading-relaxed">
                    {n.message}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-normal pt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(n.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {n.documentId && (
                      <span className="font-mono text-slate-500">Doc ID: {String(n.documentId).slice(-6)}</span>
                    )}
                  </div>
                </div>
              </div>

              {!n.isRead && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkRead(n._id);
                  }}
                  className="text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:underline shrink-0"
                >
                  Mark read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
