import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationApi } from '../services/api';
import {
  FileText,
  Bell,
  LogOut,
  User,
  Menu,
  X
} from 'lucide-react';

export default function Navbar({ onNavigate, currentTab, isMobileMenuOpen, setIsMobileMenuOpen }) {
  const { user, logout, studentMeta } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await notificationApi.getNotifications();
        if (res.data?.success) {
          setUnreadCount(res.data.unreadCount || 0);
        }
      } catch (e) {}
    };

    if (user) {
      fetchUnread();
      const interval = setInterval(fetchUnread, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const roleStyles = {
    admin: 'bg-purple-50 text-purple-700 border-purple-200/80 font-bold',
    faculty: 'bg-blue-50 text-blue-700 border-blue-200/80',
    expert: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    hod: 'bg-amber-50 text-amber-700 border-amber-200/80',
    student: 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 items-center">
          {/* Left Brand & Mobile Toggle */}
          <div className="flex items-center gap-3">
            {user && (
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}

            <div
              className="flex items-center gap-2.5 cursor-pointer group"
              onClick={() => onNavigate('dashboard')}
            >
              <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-2xs group-hover:bg-blue-600 transition-colors duration-150">
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tracking-tight text-slate-900">
                  DocuFlow <span className="text-blue-600 font-bold">AI</span>
                </span>
                <span className="hidden sm:inline-flex text-[10px] font-medium tracking-normal px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/80">
                  Autonomous MCA
                </span>
              </div>
            </div>
          </div>

          {/* Right Controls */}
          {user && (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Student Metadata (Roll No & Batch) */}
              {user.role === 'student' && studentMeta && (
                <div className="hidden lg:flex items-center gap-1.5 text-[11px] bg-slate-50 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200/80 font-mono">
                  <span className="font-semibold text-slate-900">{studentMeta.registerNumber}</span>
                  <span className="text-slate-300">•</span>
                  <span className="font-sans font-medium text-slate-600">{studentMeta.batch ? studentMeta.batch.batchName : 'MCA'}</span>
                </div>
              )}

              {/* User Avatar & Role Badge */}
              <div
                onClick={() => onNavigate('settings')}
                className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-100/70 transition-colors cursor-pointer group"
                title="Account Settings"
              >
                <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center text-xs font-semibold group-hover:border-blue-400 transition-colors">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-medium text-slate-800 group-hover:text-blue-600 transition-colors leading-tight">
                    {user.name}
                  </span>
                  <span className={`text-[10px] font-medium capitalize px-1.5 py-0.2 rounded border w-fit mt-0.5 ${roleStyles[user.role] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                    {user.role}
                  </span>
                </div>
              </div>

              <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>

              {/* Notifications Bell */}
              <button
                onClick={() => onNavigate('notifications')}
                className={`relative p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors ${
                  currentTab === 'notifications' ? 'bg-slate-100 text-blue-600' : ''
                }`}
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-semibold text-white shadow-2xs">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Sign Out */}
              <button
                onClick={logout}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 px-2.5 py-1.5 rounded-lg border border-slate-200/80 hover:border-rose-200 hover:bg-rose-50/50 transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
