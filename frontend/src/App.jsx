import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import FacultyDashboard from './pages/FacultyDashboard';
import ExpertDashboard from './pages/ExpertDashboard';
import HodDashboard from './pages/HodDashboard';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import CodingPlatform from './pages/CodingPlatform';
import NotificationsPage from './pages/NotificationsPage';

export default function App() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [authView, setAuthView] = useState('login'); // 'login' | 'register' | 'forgot-password'
  const [authEmail, setAuthEmail] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 mt-4 font-mono font-medium tracking-wide">
          Initializing DocuFlow AI Security & Context...
        </p>
      </div>
    );
  }

  if (!user) {
    const handleAuthNavigate = (view, options = {}) => {
      if (options.initialEmail) setAuthEmail(options.initialEmail);
      setAuthView(view);
    };

    if (authView === 'register') {
      return (
        <RegisterPage
          onNavigate={handleAuthNavigate}
          initialEmail={authEmail}
        />
      );
    }

    if (authView === 'forgot-password') {
      return (
        <ForgotPasswordPage
          onNavigate={handleAuthNavigate}
          initialEmail={authEmail}
        />
      );
    }

    return <LoginPage onNavigate={handleAuthNavigate} />;
  }

  // Render main view based on role and tab
  const renderContent = () => {
    if (currentTab === 'notifications') {
      return <NotificationsPage />;
    }

    if (currentTab === 'coding') {
      return <CodingPlatform />;
    }

    switch (user.role) {
      case 'admin':
        return <AdminDashboard currentSubTab={currentTab} onNavigate={setCurrentTab} />;
      case 'faculty':
        return <FacultyDashboard currentSubTab={currentTab} />;
      case 'expert':
        return <ExpertDashboard currentSubTab={currentTab} />;
      case 'hod':
        return <HodDashboard currentSubTab={currentTab} />;
      case 'student':
        return <StudentDashboard currentSubTab={currentTab} onNavigate={setCurrentTab} />;
      default:
        return <div>Unknown role</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col relative antialiased">
      <Navbar
        onNavigate={setCurrentTab}
        currentTab={currentTab}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          currentTab={currentTab}
          onNavigate={setCurrentTab}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
        <main className="flex-1 p-3.5 sm:p-5 lg:p-6 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
