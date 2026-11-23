import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Upload,
  FileCheck,
  CheckCircle2,
  BookOpen,
  Code2,
  MessageSquare,
  Users,
  Settings,
  Bell,
  History,
  FileText,
  Layers,
  GraduationCap,
  ShieldCheck,
  X
} from 'lucide-react';

export default function Sidebar({ currentTab, onNavigate, isMobileMenuOpen, setIsMobileMenuOpen }) {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;
  const navItems = [];

  // Common Dashboard
  navItems.push({ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard });

  // Role Menus
  if (role === 'admin') {
    navItems.push(
      { id: 'assignments', label: 'Subject Assignments', icon: BookOpen },
      { id: 'users', label: 'User & Role Directory', icon: Users },
      { id: 'approvals', label: 'Role Authorizations', icon: CheckCircle2 },
      { id: 'curriculum', label: 'Curriculum & Structure', icon: Layers },
      { id: 'audit', label: 'Security Audit Trail', icon: ShieldCheck },
      { id: 'settings', label: 'Account Security', icon: Settings }
    );
  } else if (role === 'faculty') {
    navItems.push(
      { id: 'upload', label: 'Upload Document', icon: Upload },
      { id: 'documents', label: 'My Submissions', icon: FileText },
      { id: 'settings', label: 'Account Security', icon: Settings }
    );
  } else if (role === 'expert') {
    navItems.push(
      { id: 'review', label: 'Assigned Reviews', icon: FileCheck },
      { id: 'history', label: 'Review Decisions', icon: History },
      { id: 'settings', label: 'Account Security', icon: Settings }
    );
  } else if (role === 'hod') {
    navItems.push(
      { id: 'approvals', label: 'Document Approvals', icon: CheckCircle2 },
      { id: 'history', label: 'Approval History', icon: History },
      { id: 'library', label: 'Published Library', icon: BookOpen },
      { id: 'curriculum', label: 'Curriculum Reference', icon: Layers },
      { id: 'settings', label: 'Account Security', icon: Settings }
    );
  } else if (role === 'student') {
    navItems.push(
      { id: 'library', label: 'Approved Study Library', icon: BookOpen },
      { id: 'notes', label: 'AI Summaries & Notes', icon: GraduationCap },
      { id: 'coding', label: 'Coding Sandbox', icon: Code2 },
      { id: 'chatbot', label: 'Academic Chatbot', icon: MessageSquare }
    );
  }

  // Common notification tab
  navItems.push({ id: 'notifications', label: 'Notifications', icon: Bell });

  const handleItemClick = (id) => {
    onNavigate(id);
    if (setIsMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  const navContent = (
    <div className="flex flex-col justify-between h-full p-3.5">
      <div className="space-y-3">
        <div className="px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">
          {role} Workspace
        </div>
        <nav className="space-y-0.5" aria-label="Sidebar Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-2xs font-medium'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Institutional Metadata Footer */}
      <div className="pt-3 border-t border-slate-100 px-2 space-y-1">
        <p className="text-[11px] text-slate-700 font-medium leading-tight">Dept. of Computer Applications</p>
        <p className="text-[10px] text-slate-400 leading-tight">Kongu Engineering College</p>
        <div className="pt-1 text-[10px] text-emerald-600 flex items-center gap-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>System Connected</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-56 bg-white border-r border-slate-200/80 min-h-[calc(100vh-3.5rem)] hidden md:block shrink-0">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-64 max-w-[80vw] bg-white border-r border-slate-200 flex flex-col z-50 animate-in slide-in-from-left duration-200">
            <div className="p-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900">Navigation</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {navContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
