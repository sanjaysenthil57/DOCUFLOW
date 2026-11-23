import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Building2,
  Mail,
  ShieldAlert
} from 'lucide-react';
import { Button, Input, Label, Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui';

export default function FacultyPasswordSettings() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword) {
      setError('Current password is required.');
      return;
    }

    if (!newPassword) {
      setError('New password is required.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password cannot be the same as your existing password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation password do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword
      });

      if (res.data?.success) {
        setSuccess(res.data.message || 'Your password has been securely updated in the database!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Password update failed. Please verify your current password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* 1. Profile Security Overview */}
      <Card>
        <div className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200/80 text-slate-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900 tracking-tight">Account & Security Settings</h2>
                <p className="text-xs text-slate-500 font-normal mt-0.5">
                  Self-service credential management and institutional identity protection.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80 self-start sm:self-auto flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Active Institutional Profile</span>
            </span>
          </div>

          {/* Profile Attributes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1">Faculty Name</span>
              <span className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                {user?.name || 'Faculty Member'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1">Institutional Email</span>
              <span className="font-mono text-slate-800 text-xs flex items-center gap-1.5 truncate">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {user?.email}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1">Department</span>
              <span className="font-medium text-slate-800 text-xs flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {user?.department || 'Master of Computer Applications (MCA)'}
              </span>
            </div>
          </div>

          {/* Security Independence Banner */}
          <div className="mt-3.5 p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed font-normal">
              <strong>Security Isolation Notice:</strong> In accordance with academic policy, administrators and HODs cannot view or reset passwords for faculty accounts. Only you have authority to update your credentials through this self-service panel.
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Change Password Form Card */}
      <Card className="max-w-xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <KeyRound className="w-3.5 h-3.5" />
            </div>
            <div>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Enter your existing password and choose a secure new password.</CardDescription>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleChangePassword}>
          <CardContent className="space-y-4">
            {success && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="leading-relaxed">{success}</span>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200/80 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Current Password */}
            <div>
              <Label htmlFor="curr-pass" required>Current Password</Label>
              <div className="relative">
                <Input
                  id="curr-pass"
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  icon={Lock}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter existing password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <Label htmlFor="faculty-new-pass" required>New Password</Label>
              <div className="relative">
                <Input
                  id="faculty-new-pass"
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  icon={Lock}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <Label htmlFor="faculty-conf-pass" required>Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="faculty-conf-pass"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  icon={Lock}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
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
              icon={KeyRound}
              className="w-full text-xs font-medium py-2 mt-2"
            >
              Update Password
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
