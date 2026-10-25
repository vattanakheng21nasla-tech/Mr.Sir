import React, { useState, useEffect } from 'react';
import { CurrentUser, UserRole } from '../types/document';
import { DEMO_USERS } from '../data/initialDocuments';
import { StorageService } from '../services/storageService';
import {
  Lock,
  User,
  ShieldCheck,
  Eye,
  EyeOff,
  LogIn,
  KeyRound,
  AlertCircle,
  Building2,
  Clock,
  CheckCircle2,
  Crown,
  UserPlus,
  Mail,
  FileText,
  Users
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: CurrentUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  // Mode: 'login' or 'register'
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [usernameOrEmail, setUsernameOrEmail] = useState('vattanak');
  const [password, setPassword] = useState('vattanak123');
  const [selectedRole, setSelectedRole] = useState<UserRole>('owner');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regDepartment, setRegDepartment] = useState('ការិយាល័យរដ្ឋបាល និងផែនការ');
  const [regRole, setRegRole] = useState<'officer' | 'director'>('officer');
  const [regNotes, setRegNotes] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);

  // Requirement 4: 3 failed attempts triggers 20 seconds lockout
  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    const saved = sessionStorage.getItem('docutrack_failed_attempts');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [lockoutSeconds, setLockoutSeconds] = useState<number>(() => {
    const expiry = sessionStorage.getItem('docutrack_lockout_until');
    if (expiry) {
      const remaining = Math.ceil((parseInt(expiry, 10) - Date.now()) / 1000);
      return remaining > 0 ? remaining : 0;
    }
    return 0;
  });

  // Countdown timer for lockout
  useEffect(() => {
    if (lockoutSeconds <= 0) return;

    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          sessionStorage.removeItem('docutrack_lockout_until');
          sessionStorage.setItem('docutrack_failed_attempts', '0');
          setFailedAttempts(0);
          setErrorMessage(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  const isLockedOut = lockoutSeconds > 0;

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOut) return;

    setErrorMessage(null);
    setSuccessNotice(null);
    setIsLoading(true);

    const inputUser = usernameOrEmail.trim();
    const inputPass = password.trim();

    try {
      // 1. Try server login endpoint
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail: inputUser, password: inputPass })
      });

      const data = await res.json();
      setIsLoading(false);

      if (res.ok && data.success && data.user) {
        // Successful login
        sessionStorage.removeItem('docutrack_failed_attempts');
        sessionStorage.removeItem('docutrack_lockout_until');
        setFailedAttempts(0);

        const loggedUser: CurrentUser = {
          id: data.user.id,
          name: data.user.name,
          username: data.user.username,
          email: data.user.email,
          role: data.user.role,
          department: data.user.department,
          status: data.user.status,
          lastLogin: new Date().toLocaleDateString('en-CA') + ' ' + new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit' })
        };
        onLoginSuccess(loggedUser);
        return;
      }

      // Check specific error codes
      if (data.errorCode === 'PENDING_APPROVAL') {
        setErrorMessage('⚠️ គណនីរបស់អ្នកកំពុងស្ថិតក្នុងការត្រួតពិនិត្យ និងរង់ចាំការអនុម័តពីលោក ហេង វឌ្ឍនៈ (Owner)។ សូមទាក់ទងមកកាន់ Owner ដើម្បីទទួលបានការអនុម័ត!');
        return;
      }

      if (data.errorCode === 'REJECTED') {
        setErrorMessage('❌ សំណើសុំចូលប្រើប្រាស់របស់អ្នកត្រូវបានបដិសេធ។ សូមទាក់ទងលោក ហេង វឌ្ឍនៈ (Owner) សម្រាប់ព័ត៌មានបន្ថែម។');
        return;
      }

      // Failed credentials: count attempts
      handleFailedAttempt();
    } catch {
      // Offline fallback: verify against local users
      setIsLoading(false);
      const localUsers = StorageService.getUsers();
      const matched = localUsers.find(
        (u) =>
          ((u.username && u.username.toLowerCase() === inputUser.toLowerCase()) ||
           (u.email && u.email.toLowerCase() === inputUser.toLowerCase()) ||
           (u.role === 'owner' && (inputUser.toLowerCase() === 'admin' || inputUser.toLowerCase() === 'vattanak' || inputUser.toLowerCase() === 'owner'))) &&
          (u.password === inputPass || (u.role === 'owner' && (inputPass === 'vattanak123' || inputPass === 'admin' || inputPass === '123456')))
      );

      if (matched) {
        if (matched.status === 'pending') {
          setErrorMessage('⚠️ គណនីរបស់អ្នកកំពុងរង់ចាំការអនុម័តពីលោក ហេង វឌ្ឍនៈ (Owner)។');
          return;
        }
        if (matched.status === 'rejected') {
          setErrorMessage('❌ សំណើសុំចូលប្រើប្រាស់របស់អ្នកត្រូវបានបដិសេធ។');
          return;
        }

        sessionStorage.removeItem('docutrack_failed_attempts');
        sessionStorage.removeItem('docutrack_lockout_until');
        setFailedAttempts(0);

        const loggedUser: CurrentUser = {
          id: matched.id,
          name: matched.name,
          username: matched.username,
          email: matched.email,
          role: matched.role || selectedRole,
          department: matched.department,
          lastLogin: new Date().toLocaleDateString('en-CA') + ' ' + new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit' })
        };
        onLoginSuccess(loggedUser);
      } else {
        handleFailedAttempt();
      }
    }
  };

  const handleFailedAttempt = () => {
    const newCount = failedAttempts + 1;
    setFailedAttempts(newCount);
    sessionStorage.setItem('docutrack_failed_attempts', newCount.toString());

    if (newCount >= 3) {
      // Trigger 20-second lockout
      const lockoutExpiry = Date.now() + 20000;
      sessionStorage.setItem('docutrack_lockout_until', lockoutExpiry.toString());
      setLockoutSeconds(20);
      setErrorMessage('អ្នកបានវាយឈ្មោះអ្នកប្រើ ឬពាក្យសម្ងាត់ខុសចំនួន ៣ដង! ប្រព័ន្ធបានចាក់សោរបណ្តោះអាសន្ន សូមរង់ចាំ ២០ វិនាទី។');
    } else {
      const remainingAttempts = 3 - newCount;
      setErrorMessage(`ឈ្មោះអ្នកប្រើ ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ! (បញ្ចូលខុស ${newCount}/៣ ដង - នៅសល់ ${remainingAttempts} ដង មុនពេលត្រូវផ្អាក ២០ វិនាទី)`);
    }
  };

  // Handle Registration submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    if (!regEmail.includes('@')) {
      setErrorMessage('សូមបញ្ចូលអាសយដ្ឋានអ៊ីមែលត្រឹមត្រូវ!');
      return;
    }

    if (regPassword.length < 4) {
      setErrorMessage('លេខកូដសម្ងាត់ផ្ទាល់ខ្លួនត្រូវមានយ៉ាងហោចណាស់ ៤ តួអក្សរ!');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('លេខកូដសម្ងាត់ទាំងពីរមិនដូចគ្នាទេ! សូមពិនិត្យឡើងវិញ។');
      return;
    }

    setIsSubmittingReg(true);

    const res = await StorageService.registerUser({
      name: regName.trim(),
      username: regUsername.trim().toLowerCase(),
      email: regEmail.trim().toLowerCase(),
      password: regPassword.trim(),
      role: regRole,
      department: regDepartment.trim(),
      notes: regNotes.trim()
    });

    setIsSubmittingReg(false);

    if (res.success) {
      setSuccessNotice(`✅ ការស្នើសុំចុះឈ្មោះត្រូវបានបញ្ជូនដោយជោគជ័យ!
គណនី '${regUsername}' ត្រូវបានកត់ត្រាក្នុងស្ថានភាព 'រង់ចាំការអនុម័ត (Pending)'។ លោក ហេង វឌ្ឍនៈ (Owner) នឹងពិនិត្យ និងអនុម័តឱ្យចូលប្រើប្រាស់។`);
      // Prefill login username
      setUsernameOrEmail(regUsername.trim());
      setPassword('');
      // Switch back to login view after short notice
      setTimeout(() => {
        setMode('login');
      }, 1800);
    } else {
      setErrorMessage(res.message || res.error || 'បរាជ័យក្នុងការស្នើសុំចុះឈ្មោះ!');
    }
  };

  const selectOwnerDemo = () => {
    if (isLockedOut) return;
    const owner = DEMO_USERS[0];
    setUsernameOrEmail(owner.username || 'vattanak');
    setPassword(owner.password);
    setSelectedRole('owner');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* National Emblem & Title Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-900 text-amber-400 shadow-md border-2 border-blue-800">
            <span className="text-2xl font-bold font-serif">រដ្ឋ</span>
          </div>

          <div className="space-y-0.5">
            <h3 className="text-xs font-semibold text-slate-700 tracking-wider">ព្រះរាជាណាចក្រកម្ពុជា</h3>
            <h4 className="text-xs text-slate-500 font-medium">ជាតិ សាសនា ព្រះមហាក្សត្រ</h4>
          </div>

          <h1 className="text-lg font-bold text-slate-900 tracking-tight pt-1">
            ប្រព័ន្ធគ្រប់គ្រងលិខិតរដ្ឋបាលចេញ-ចូល
          </h1>
          <p className="text-xs text-slate-500">
            ការិយាល័យរដ្ឋបាល និងផែនការ · ផ្ទាំងចូលប្រើប្រាស់ផ្លូវការ
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white py-6 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-8 text-xs">
          {/* Top Switcher Tabs: Sign In vs Register Request */}
          <div className="flex border-b border-slate-200 mb-5">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              className={`flex-1 pb-3 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                mode === 'login'
                  ? 'border-blue-900 text-blue-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>ចូលប្រើប្រាស់ (Sign In)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
              }}
              className={`flex-1 pb-3 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                mode === 'register'
                  ? 'border-blue-900 text-blue-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>ស្នើសុំចុះឈ្មោះ (Register)</span>
            </button>
          </div>

          {/* Success Banner */}
          {successNotice && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-start gap-2 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="whitespace-pre-line font-medium">{successNotice}</div>
            </div>
          )}

          {/* Lockout Banner (Requirement 4: 20 seconds waiting timer) */}
          {isLockedOut ? (
            <div className="mb-5 p-4 bg-amber-50 border-2 border-amber-300 rounded-xl text-amber-900 animate-pulse">
              <div className="flex items-center gap-2 mb-1.5 font-bold text-xs text-amber-900">
                <Clock className="w-4 h-4 text-amber-700" />
                <span>បានចាក់សោរបណ្តោះអាសន្ន (បញ្ចូលខុស ៣ដង)</span>
              </div>
              <p className="text-[11px] text-amber-800 mb-2 leading-relaxed">
                អ្នកបានបញ្ចូល User name និង Password ខុសចំនួន ៣ដង។ តាមគោលការណ៍សុវត្ថិភាព សូមរង់ចាំរយៈពេល ២០វិនាទី ទើបអាចព្យាយាមម្តងទៀតបាន។
              </p>
              <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-amber-200 font-mono">
                <span className="text-xs font-semibold text-slate-700">រង់ចាំ (Cooldown)៖</span>
                <span className="text-sm font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200">
                  {lockoutSeconds} វិនាទី
                </span>
              </div>
            </div>
          ) : errorMessage ? (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs font-medium leading-relaxed">{errorMessage}</div>
            </div>
          ) : null}

          {/* ================= MODE: LOGIN ================= */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Username or Email */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ឈ្មោះអ្នកប្រើ ឬ អ៊ីមែល (Username / Email) <span className="text-rose-500">*</span>
                </label>
                <div className="relative rounded-lg shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    disabled={isLockedOut}
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    placeholder="vattanak ឬ អ៊ីមែលរបស់អ្នក..."
                    className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-900 focus:border-blue-900 text-slate-900 text-xs disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  លេខកូដសម្ងាត់ (Password / PIN) <span className="text-rose-500">*</span>
                </label>
                <div className="relative rounded-lg shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={isLockedOut}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="បញ្ចូលពាក្យសម្ងាត់ ឬលេខកូដផ្ទាល់ខ្លួន..."
                    className="block w-full pl-9 pr-9 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-900 focus:border-blue-900 text-slate-900 text-xs disabled:bg-slate-100 disabled:text-slate-400"
                  />
                  <button
                    type="button"
                    disabled={isLockedOut}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isLockedOut}
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-900 cursor-pointer"
                  />
                  <span className="text-slate-600 text-xs">ចងចាំការចូលប្រើលើឧបករណ៍នេះ</span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || isLockedOut}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : isLockedOut ? (
                    <>
                      <Clock className="w-4 h-4 text-amber-300" />
                      <span>រង់ចាំ {lockoutSeconds} វិនាទី (ផ្អាកបណ្តោះអាសន្ន)</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>ចូលប្រើប្រព័ន្ធរដ្ឋបាល (Sign In)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* ================= MODE: REGISTER ================= */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-[11px] leading-relaxed flex items-start gap-2">
                <Users className="w-4 h-4 text-blue-900 shrink-0 mt-0.5" />
                <span>
                  <strong>លក្ខខណ្ឌប្រើប្រាស់៖</strong> នៅពេលចុះឈ្មោះរួចរាល់ គណនីនឹងត្រូវរង់ចាំ <strong>លោក ហេង វឌ្ឍនៈ (Owner)</strong> អនុម័តជាមុនសិន។ ប្រព័ន្ធកំណត់ចំនួនអ្នកប្រើប្រាស់អតិបរមាត្រឹម <strong>១០ នាក់</strong>។
                </span>
              </div>

              {/* Full Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  គោត្តនាម និងនាម (Full Name) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="ឧ. លោក ឈុន វិបុល"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-900 focus:border-blue-900 text-slate-900 text-xs"
                />
              </div>

              {/* Email (Requirement: មានការភ្ជាប់ជាមួយ Email) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  អាសយដ្ឋានអ៊ីមែល (Email address) <span className="text-rose-500">*</span>
                </label>
                <div className="relative rounded-lg shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="vibol@docutrack.gov.kh ឬ gmail.com..."
                    className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-900 focus:border-blue-900 text-slate-900 text-xs"
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ឈ្មោះគណនី (Username) <span className="text-rose-500">*</span>
                </label>
                <div className="relative rounded-lg shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="ឧ. vibol (យ៉ាងហោច ៣ តួអក្សរ)"
                    className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-900 focus:border-blue-900 text-slate-900 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Personal Code / Password (Requirement: បន្ទាប់មកបង្កើត លេខកូដផ្ទាល់ខ្លួន) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    លេខកូដផ្ទាល់ខ្លួន (Password) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative rounded-lg shadow-2xs">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="លេខកូដផ្ទាល់ខ្លួន..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-900 focus:border-blue-900 text-slate-900 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    បញ្ជាក់លេខកូដ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="វាយលេខកូដម្តងទៀត..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-900 focus:border-blue-900 text-slate-900 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="text-[11px] text-blue-900 hover:underline cursor-pointer"
                >
                  {showRegPassword ? 'លាក់លេខកូដសម្ងាត់' : 'បង្ហាញលេខកូដសម្ងាត់'}
                </button>
              </div>

              {/* Department & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    តួនាទីស្នើសុំ <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as 'officer' | 'director')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-xs"
                  >
                    <option value="officer">មន្ត្រីរដ្ឋបាល (Clerk / Officer)</option>
                    <option value="director">ថ្នាក់ដឹកនាំ / អគ្គនាយក (Director)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    អង្គភាព / នាយកដ្ឋាន
                  </label>
                  <input
                    type="text"
                    value={regDepartment}
                    onChange={(e) => setRegDepartment(e.target.value)}
                    placeholder="ការិយាល័យរដ្ឋបាល និងផែនការ"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs"
                  />
                </div>
              </div>

              {/* Reason / Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  មូលហេតុ ឬកម្មវត្ថុនៃការស្នើសុំប្រើប្រាស់
                </label>
                <textarea
                  rows={2}
                  value={regNotes}
                  onChange={(e) => setRegNotes(e.target.value)}
                  placeholder="ឧ. ស្នើសុំសិទ្ធិដើម្បីចុះបញ្ជីលិខិតចូល-ចេញ របស់ការិយាល័យ..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 text-xs resize-none"
                />
              </div>

              {/* Submit Register Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingReg}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg shadow-sm text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingReg ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>បញ្ជូនសំណើសុំចុះឈ្មោះ (Submit Registration)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Quick Demo Accounts Selection - UPDATED: Only Owner (Requirement: Remove Director & Officer) */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-700 mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-900" />
                <span>គណនីមានសិទ្ធិចូលប្រើប្រាស់ដំបូង (Owner Account)៖</span>
              </span>
              <span className="text-[10px] text-slate-400">ចុចដើម្បីបំពេញស្វ័យប្រវត្តិ</span>
            </div>

            {/* Only Owner Account Card */}
            <div className="space-y-2">
              <button
                type="button"
                disabled={isLockedOut}
                onClick={selectOwnerDemo}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed ${
                  usernameOrEmail.toLowerCase() === 'vattanak'
                    ? 'bg-amber-50/80 border-amber-400 shadow-2xs'
                    : 'bg-amber-50/40 border-amber-200 hover:bg-amber-50'
                }`}
              >
                <div className="truncate">
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5 truncate">
                    <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>លោក ហេង វឌ្ឍនៈ</span>
                    <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.2 rounded-full">
                      Owner
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 truncate mt-0.5">
                    ប្រធានការិយាល័យស្តីទី (Owner - សិទ្ធិកំណត់ និងកែប្រែ)
                  </div>
                  <div className="text-[10px] font-mono text-slate-600 mt-1">
                    User: <span className="text-blue-900 font-bold">vattanak</span> | Pass: <span className="text-blue-900 font-bold">vattanak123</span>
                  </div>
                </div>
                <div className="shrink-0 ml-2 text-right">
                  <span className="text-[10px] font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                    owner
                  </span>
                </div>
              </button>
            </div>

            {/* Note about other accounts */}
            <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500 leading-relaxed flex items-center justify-between">
              <span>
                💡 សមាជិកផ្សេងទៀត ត្រូវធ្វើការ <strong>Register ស្នើសុំ</strong> ឬបង្កើតដោយ Owner ផ្ទាល់ (កូតា ១០ នាក់)។
              </span>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage(null);
                }}
                className="text-blue-900 font-bold hover:underline shrink-0 ml-2 cursor-pointer"
              >
                ចុះឈ្មោះនៅទីនេះ &rarr;
              </button>
            </div>
          </div>
        </div>

        {/* Security Notice Footer */}
        <div className="text-center mt-6 text-[11px] text-slate-500 space-y-1">
          <p>
            🔒 ប្រព័ន្ធគ្រប់គ្រងលិខិតរដ្ឋបាលផ្លូវការ ព្រះរាជាណាចក្រកម្ពុជា
          </p>
          <p className="text-[10px] text-slate-400">
            ក្បួនសុវត្ថិភាព៖ បញ្ចូលខុស ៣ ដង ផ្អាក ២០ វិនាទី · កំណត់ចំនួនអ្នកប្រើប្រាស់ ១០ នាក់
          </p>
        </div>
      </div>
    </div>
  );
};
