import React, { useState, useEffect } from 'react';
import { authApi } from '../services/api';
import {
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  Clock,
  Key,
  ChevronRight
} from 'lucide-react';
import { Button, Input, Label } from '../components/ui';

export default function ForgotPasswordPage({ onNavigate, initialEmail = '' }) {
  const [step, setStep] = useState('request'); // 'request' | 'reset_form' | 'completed'
  const [email, setEmail] = useState(initialEmail);
  const [verificationCode, setVerificationCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    const emailParam = params.get('email');
    if (tokenParam) {
      setResetToken(tokenParam);
      if (emailParam) setEmail(emailParam);
      setStep('reset_form');
    }
  }, []);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('Please provide your registered institutional email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.forgotPassword({ email: trimmedEmail });
      if (res.data.success) {
        if (res.data.verificationCode) {
          setVerificationCode(res.data.verificationCode);
        }
        setSuccess(res.data.message);
        setStep('reset_form');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not process password recovery request.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const codeToUse = verificationCode.trim() || resetToken.trim();
    if (!codeToUse) {
      setError('Please enter the 6-digit verification code or token.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match. Please verify.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.resetPassword({
        email: email.trim().toLowerCase(),
        code: codeToUse,
        token: resetToken.trim(),
        newPassword,
        confirmPassword
      });

      if (res.data.success) {
        setSuccess(res.data.message);
        setStep('completed');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Password update failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-11 w-11 rounded-xl bg-slate-900 items-center justify-center text-white shadow-2xs mb-3.5">
          <KeyRound className="w-5 h-5" />
        </div>
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
          Password Recovery
        </h1>
        <p className="mt-1 text-xs text-slate-500 font-normal">
          Kongu Engineering College • Self-Service Security
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-7 px-6 sm:px-8 border border-slate-200/80 rounded-xl shadow-xs">
          {/* STEP 1: REQUEST VERIFICATION CODE */}
          {step === 'request' && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200/80 text-blue-900 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-blue-600" />
                <span>Enter your registered email to receive a secure 6-digit verification code.</span>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200/80 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleRequestReset}>
                <div>
                  <Label htmlFor="forgot-email" required>Institutional Email Address</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    required
                    icon={Mail}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="faculty@kongu.edu"
                    className="font-mono"
                  />
                  <p className="mt-1 text-[11px] text-slate-400 font-normal">
                    A 6-digit verification code valid for 15 minutes will be dispatched.
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={loading}
                  icon={Mail}
                  className="w-full text-xs font-medium py-2.5"
                >
                  Send Verification Code
                </Button>
              </form>
            </div>
          )}

          {/* STEP 2: VERIFICATION CODE & NEW PASSWORD FORM */}
          {step === 'reset_form' && (
            <form className="space-y-4" onSubmit={handleResetSubmit}>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs text-slate-700 flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-900 block truncate max-w-xs">{email}</span>
                  <span className="text-[11px] text-slate-500">Code valid for 15 minutes</span>
                </div>
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              </div>

              {success && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs leading-relaxed">
                  {success}
                </div>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200/80 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              {/* 6-Digit Code */}
              <div>
                <Label htmlFor="reset-code" required>Verification Code</Label>
                <Input
                  id="reset-code"
                  type="text"
                  required
                  maxLength={32}
                  icon={Key}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="e.g. 849201"
                  className="font-mono tracking-widest text-sm font-semibold uppercase"
                />
              </div>

              {/* New Password */}
              <div>
                <Label htmlFor="new-pass" required>New Password</Label>
                <div className="relative">
                  <Input
                    id="new-pass"
                    type={showPassword ? 'text' : 'password'}
                    required
                    icon={Lock}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <Label htmlFor="conf-new-pass" required>Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="conf-new-pass"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    icon={Lock}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={loading}
                icon={CheckCircle2}
                className="w-full text-xs font-medium py-2.5"
              >
                Set New Password
              </Button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setStep('request')}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium hover:underline cursor-pointer"
                >
                  Did not receive code? Request another
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: COMPLETED */}
          {step === 'completed' && (
            <div className="text-center space-y-4 py-2">
              <div className="inline-flex h-11 w-11 rounded-xl bg-emerald-50 border border-emerald-200 items-center justify-center text-emerald-600 shadow-2xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 tracking-tight">Password Updated Successfully</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                Your credentials have been securely updated. You can now log in with your new password.
              </p>
              <Button
                type="button"
                variant="primary"
                size="md"
                icon={ChevronRight}
                onClick={() => onNavigate('login')}
                className="w-full text-xs font-medium py-2.5"
              >
                Proceed to Sign In
              </Button>
            </div>
          )}

          {/* Back to Login Link */}
          {step !== 'completed' && (
            <div className="mt-5 text-center text-xs border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="inline-flex items-center text-slate-500 hover:text-slate-900 font-medium transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                <span>Return to Sign In</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
