import React, { useState } from 'react';
import { authApi } from '../services/api';
import {
  FileText,
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  User,
  Building,
  GraduationCap,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  ChevronRight,
  Phone,
  Hash,
  Calendar,
  Layers,
  Award
} from 'lucide-react';
import { Button, Input, Label, Select } from '../components/ui';

const KONGU_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@kongu\.edu$/i;

export default function RegisterPage({ onNavigate, initialEmail = '' }) {
  const [step, setStep] = useState('form'); // 'form' | 'submitted'
  const [role, setRole] = useState('student'); // 'student' | 'faculty' | 'expert' | 'hod' | 'admin'
  const [institutionalId, setInstitutionalId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Master of Computer Applications (MCA)');
  const [year, setYear] = useState('1');
  const [semester, setSemester] = useState('1');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [institutionalAuthCode, setInstitutionalAuthCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  const validateKonguEmail = (val) => {
    return KONGU_EMAIL_REGEX.test(val.trim());
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedId = institutionalId.trim().toUpperCase();

    // 1. Domain Validation
    if (!validateKonguEmail(trimmedEmail)) {
      setError('Access Restricted: Only institutional email addresses ending exactly in @kongu.edu are accepted.');
      return;
    }

    // 2. ID Validation
    if (!trimmedId) {
      setError(
        role === 'student'
          ? 'Student ID (Roll / Register No) is required.'
          : role === 'admin'
          ? 'Administrator ID is required.'
          : 'Faculty ID is required.'
      );
      return;
    }

    // 3. Phone Validation
    if (!phone.trim()) {
      setError('Phone number is required for institutional contact verification.');
      return;
    }

    // 4. Password Validations
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    // 5. Role-Specific Validations for Student
    if (role === 'student') {
      const parsedYear = Number(year);
      if (![1, 2].includes(parsedYear)) {
        setError('Invalid Year of Study: MCA Student registration allows only 1st Year or 2nd Year.');
        return;
      }
      const parsedSemester = Number(semester);
      if (![1, 2, 3, 4].includes(parsedSemester)) {
        setError('Invalid Semester: MCA Student registration allows only Semesters 1, 2, 3, or 4.');
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        id: trimmedId,
        institutionalId: trimmedId,
        name: name.trim(),
        email: trimmedEmail,
        phone: phone.trim(),
        department: department.trim(),
        role: role,
        userCategory: role,
        password,
        confirmPassword
      };

      if (role === 'student') {
        payload.year = Number(year);
        payload.semester = Number(semester);
      }

      if (role === 'expert' || role === 'hod' || role === 'admin') {
        payload.institutionalAuthCode = institutionalAuthCode.trim();
      }

      const res = await authApi.register(payload);

      if (res.data.success) {
        setSuccessInfo({
          email: trimmedEmail,
          role: res.data.user?.role || role,
          approvalStatus: res.data.user?.approvalStatus || 'approved',
          message: res.data.message
        });
        setStep('submitted');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // SUCCESS / REGISTRATION CONFIRMATION SCREEN
  if (step === 'submitted' && successInfo) {
    const isApproved = successInfo.approvalStatus === 'approved';

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="inline-flex h-11 w-11 rounded-xl bg-emerald-50 border border-emerald-200 items-center justify-center text-emerald-600 shadow-2xs mb-3.5">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            {isApproved ? 'Registration Complete' : 'Registration Submitted'}
          </h1>
          <p className="mt-1 text-xs text-slate-500 font-normal">
            Kongu Engineering College • Autonomous MCA
          </p>
        </div>

        <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-7 px-6 sm:px-8 border border-slate-200/80 rounded-xl shadow-xs space-y-4">
            <div className={`p-3.5 rounded-lg border text-left space-y-1.5 ${
              isApproved ? 'bg-emerald-50/60 border-emerald-200/80 text-emerald-900' : 'bg-amber-50/60 border-amber-200/80 text-amber-900'
            }`}>
              <div className="flex items-center gap-1.5 font-medium text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{isApproved ? 'Account Active & Verified' : 'Queued for HOD Authorization'}</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-normal">
                {successInfo.message}
              </p>
              <div className="mt-2 text-[11px] font-mono text-slate-600 border-t border-slate-200/60 pt-2 space-y-0.5">
                <div><span className="text-slate-400">Account:</span> {successInfo.email}</div>
                <div><span className="text-slate-400">Role:</span> <span className="font-semibold text-slate-900 uppercase">{successInfo.role}</span></div>
                <div><span className="text-slate-400">Status:</span> <span className="font-semibold capitalize">{successInfo.approvalStatus}</span></div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70 text-xs text-slate-600 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-medium text-slate-800 block">Domain Verified: @kongu.edu</span>
                <span className="text-[11px] text-slate-500 font-normal leading-normal">
                  {isApproved
                    ? 'Your credentials have been securely registered. You can proceed to log in directly.'
                    : 'Your privileged registration has been recorded. Once authorized by the Head of Department (HOD), you will be able to sign in.'}
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="md"
              icon={ArrowLeft}
              onClick={() => onNavigate('login')}
              className="w-full text-xs font-medium py-2.5"
            >
              Proceed to Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // REGISTRATION FORM
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <div className="inline-flex h-11 w-11 rounded-xl bg-slate-900 items-center justify-center text-white shadow-2xs mb-3.5">
          <FileText className="w-5 h-5" />
        </div>
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
          Create Academic Account
        </h1>
        <p className="mt-1 text-xs text-slate-500 font-normal">
          Kongu Engineering College • Autonomous MCA Platform
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-7 px-6 sm:px-8 border border-slate-200/80 rounded-xl shadow-xs">
          {/* Institutional Domain Notice */}
          <div className="mb-5 p-2.5 rounded-lg bg-blue-50/60 border border-blue-200/80 text-blue-800 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-blue-600" />
            <span>Restricted exclusively to institutional accounts ending in <strong>@kongu.edu</strong></span>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200/80 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleRegisterSubmit}>
            {/* 1. ROLE SELECTOR */}
            <div>
              <Label required>Select Academic Role</Label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'student', label: 'Student', icon: GraduationCap },
                  { id: 'faculty', label: 'Faculty', icon: User },
                  { id: 'expert', label: 'Expert Reviewer', icon: CheckCircle2 },
                  { id: 'hod', label: 'HOD', icon: Award },
                  { id: 'admin', label: 'Administrator', icon: ShieldCheck }
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = role === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setRole(item.id)}
                      className={`p-2.5 rounded-lg border text-xs font-medium flex flex-col items-center justify-center gap-1.5 transition-colors duration-150 cursor-pointer ${
                        isSelected
                          ? 'border-slate-900 bg-slate-900 text-white shadow-2xs'
                          : 'border-slate-200/90 text-slate-600 bg-white hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. INSTITUTIONAL ID & FULL NAME */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="reg-id" required>
                  {role === 'student'
                    ? 'Student ID (Roll No / Reg No)'
                    : role === 'admin'
                    ? 'Administrator ID'
                    : 'Faculty ID'}
                </Label>
                <Input
                  id="reg-id"
                  type="text"
                  required
                  icon={Hash}
                  value={institutionalId}
                  onChange={(e) => setInstitutionalId(e.target.value)}
                  placeholder={role === 'student' ? 'e.g. 24MCA001' : 'e.g. FAC101'}
                  className="uppercase font-mono"
                />
              </div>

              <div>
                <Label htmlFor="reg-name" required>Full Name</Label>
                <Input
                  id="reg-name"
                  type="text"
                  required
                  icon={User}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priyadharshini S"
                />
              </div>
            </div>

            {/* 3. KONGU EMAIL */}
            <div>
              <Label htmlFor="reg-email" required>Kongu Institutional Email</Label>
              <Input
                id="reg-email"
                type="email"
                required
                icon={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="username@kongu.edu"
                className="font-mono"
              />
              <p className="mt-1 text-[11px] text-slate-400 font-normal">
                Only institutional addresses ending in <span className="font-medium text-slate-600">@kongu.edu</span> are valid.
              </p>
            </div>

            {/* 4. PHONE NUMBER & DEPARTMENT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="reg-phone" required>Phone Number</Label>
                <Input
                  id="reg-phone"
                  type="tel"
                  required
                  icon={Phone}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9842712345"
                />
              </div>

              <div>
                <Label htmlFor="reg-dept" required>Department</Label>
                <Input
                  id="reg-dept"
                  type="text"
                  required
                  icon={Building}
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="MCA"
                />
              </div>
            </div>

            {/* 5. YEAR & SEMESTER (STUDENT ONLY) */}
            {role === 'student' && (
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50/80 border border-slate-200/80">
                <div>
                  <Label htmlFor="reg-year" required>Year of Study</Label>
                  <Select
                    id="reg-year"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                  >
                    <option value="1">1st Year (PG / MCA)</option>
                    <option value="2">2nd Year (PG / MCA)</option>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="reg-sem" required>Current Semester</Label>
                  <Select
                    id="reg-sem"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                  >
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                    <option value="3">Semester 3</option>
                    <option value="4">Semester 4</option>
                  </Select>
                </div>
              </div>
            )}

            {/* 6. INSTITUTIONAL AUTH CODE (EXPERT / HOD / ADMIN) */}
            {(role === 'expert' || role === 'hod' || role === 'admin') && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="reg-authcode" className="mb-0">
                    Institutional Authorization Code (Optional)
                  </Label>
                  <span className="text-[10px] text-slate-500 font-medium bg-slate-200/60 px-1.5 py-0.5 rounded">
                    Instant Activation
                  </span>
                </div>
                <Input
                  id="reg-authcode"
                  type="text"
                  icon={ShieldCheck}
                  value={institutionalAuthCode}
                  onChange={(e) => setInstitutionalAuthCode(e.target.value)}
                  placeholder="Enter code (or leave blank for institutional approval)"
                />
                <p className="text-[11px] text-slate-400 font-normal">
                  If provided by institutional administration, enter here for immediate activation; otherwise, account is queued for review.
                </p>
              </div>
            )}

            {/* 7. PASSWORD & CONFIRM PASSWORD */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="reg-pass" required>Password</Label>
                <div className="relative">
                  <Input
                    id="reg-pass"
                    type={showPassword ? 'text' : 'password'}
                    required
                    icon={Lock}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

              <div>
                <Label htmlFor="reg-conf-pass" required>Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="reg-conf-pass"
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
            </div>

            {/* 8. SUBMIT BUTTON */}
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              icon={ChevronRight}
              className="w-full text-xs font-medium py-2.5 mt-2"
            >
              Register as {role.charAt(0).toUpperCase() + role.slice(1)}
            </Button>
          </form>

          {/* Links */}
          <div className="mt-5 text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
            <span>Already registered? </span>
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
            >
              Sign In to Your Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
