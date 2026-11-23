import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  AlertCircle,
  LogIn,
  Lock,
  Mail,
  Eye,
  EyeOff,
  UserPlus,
  ShieldCheck
} from 'lucide-react';
import { Button, Input, Label } from '../components/ui';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage({ onNavigate }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await login(trimmedEmail, password, rememberMe);
    } catch (err) {
      const respData = err.response?.data;
      setError(respData?.message || err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Full-Screen Animated Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="fixed inset-0 w-full h-full object-cover pointer-events-none select-none"
        style={{ zIndex: -2 }}
        src="/assets/login-bg.mp4"
      />

      {/* Subtle Dark Vignette Overlay for Crisp Readability */}
      <div
        className="fixed inset-0 bg-slate-950/65 backdrop-blur-[2px] pointer-events-none"
        style={{ zIndex: -1 }}
      />

      {/* Login Container */}
      <div className="relative w-full max-w-md mx-auto" style={{ zIndex: 1 }}>
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 items-center justify-center text-white shadow-lg mb-3">
            <FileText className="w-6 h-6 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm">
            DocuFlow <span className="text-blue-400 font-extrabold">AI</span>
          </h1>
        </div>

        {/* Main Login Card */}
        <div className="bg-white/95 backdrop-blur-md py-7 px-6 sm:px-8 border border-white/40 rounded-2xl shadow-2xl">
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight">Sign in to your account</h2>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              Enter your institutional credentials to access your workspace.
            </p>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200/80 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Email Address */}
            <div>
              <Label htmlFor="login-email" required>Institutional Email</Label>
              <Input
                id="login-email"
                type="email"
                required
                icon={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@kongu.edu"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <Label htmlFor="login-password" required className="mb-0">Password</Label>
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate('forgot-password')}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  icon={Lock}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between py-0.5">
              <label className="flex items-center text-xs text-slate-600 font-normal cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer"
                />
                <span className="ml-2 text-slate-600">Remember credentials on this device</span>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              icon={LogIn}
              className="w-full text-xs font-medium py-2.5"
            >
              Sign In
            </Button>
          </form>

          {/* Footer Registration Link */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>New student or faculty?</span>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('register')}
                className="font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer hover:underline"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create account</span>
              </button>
            )}
          </div>
        </div>

        {/* Security badge footer */}
        <div className="mt-4 text-center">
          <p className="text-[11px] text-slate-300/90 flex items-center justify-center gap-1.5 font-normal drop-shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Audited Role-Based Academic Workflow • AES-256</span>
          </p>
        </div>
      </div>
    </div>
  );
}
