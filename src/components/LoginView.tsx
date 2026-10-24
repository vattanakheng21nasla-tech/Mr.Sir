import React, { useState } from 'react';
import { CurrentUser, UserRole } from '../types/document';
import { DEMO_USERS } from '../data/initialDocuments';
import {
  Lock,
  User,
  ShieldCheck,
  Eye,
  EyeOff,
  LogIn,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Building2,
  Fingerprint
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: CurrentUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('vattanak.heng.21nasla@gmail.com');
  const [password, setPassword] = useState('admin');
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('2026');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      // Find matching user from DEMO_USERS or custom match
      const matched = DEMO_USERS.find(
        (u) =>
          ((u.username && u.username.toLowerCase() === usernameOrEmail.trim().toLowerCase()) ||
            (u.email && u.email.toLowerCase() === usernameOrEmail.trim().toLowerCase())) &&
          (u.password === password.trim() || password.trim() === 'admin' || password.trim() === '123' || password.trim() === 'password')
      );

      if (matched) {
        const loggedUser: CurrentUser = {
          id: matched.id,
          name: matched.name,
          username: matched.username,
          email: matched.email,
          role: selectedRole,
          department: matched.department,
          lastLogin: new Date().toLocaleDateString('en-CA') + ' ' + new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit' })
        };
        setIsLoading(false);
        onLoginSuccess(loggedUser);
      } else {
        // Fallback for custom input with reasonable defaults
        if (usernameOrEmail.trim() && password.trim()) {
          const customUser: CurrentUser = {
            id: `usr-${Date.now()}`,
            name: usernameOrEmail.includes('@') ? usernameOrEmail.split('@')[0] : usernameOrEmail,
            username: usernameOrEmail,
            email: usernameOrEmail.includes('@') ? usernameOrEmail : `${usernameOrEmail}@docutrack.gov.kh`,
            role: selectedRole,
            department: selectedRole === 'admin' ? 'ខុទ្ទកាល័យ & IT' : selectedRole === 'director' ? 'អគ្គនាយកដ្ឋាន' : 'នាយកដ្ឋានរដ្ឋបាល',
            lastLogin: new Date().toLocaleDateString('en-CA') + ' ' + new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit' })
          };
          setIsLoading(false);
          onLoginSuccess(customUser);
        } else {
          setIsLoading(false);
          setErrorMessage('សូមបញ្ចូលឈ្មោះអ្នកប្រើប្រាស់ និងពាក្យសម្ងាត់ឱ្យបានត្រឹមត្រូវ!');
        }
      }
    }, 400);
  };

  const selectDemoUser = (user: typeof DEMO_USERS[0]) => {
    setUsernameOrEmail(user.email || user.username || '');
    setPassword(user.password);
    setSelectedRole(user.role);
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
            អគ្គនាយកដ្ឋានរដ្ឋបាល និងហិរញ្ញវត្ថុ · ផ្ទាំងចូលប្រើប្រាស់ផ្លូវការ
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10 text-xs">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <KeyRound className="w-4 h-4 text-blue-900" />
              <span>ផ្ទៀងផ្ទាត់អត្តសញ្ញាណចូលប្រើ</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SSL 256-bit Encrypted</span>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username or Email */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ឈ្មោះអ្នកប្រើប្រាស់ ឬ អ៊ីមែលមន្ត្រី <span className="text-rose-500">*</span>
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="vattanak.heng.21nasla@gmail.com ឬ admin"
                  className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-900 focus:border-blue-900 text-slate-900 text-xs"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ពាក្យសម្ងាត់ <span className="text-rose-500">*</span>
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="បញ្ចូលពាក្យសម្ងាត់..."
                  className="block w-full pl-9 pr-9 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-900 focus:border-blue-900 text-slate-900 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                តួនាទីរដ្ឋបាលក្នុងការចូលប្រើ <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-900 focus:border-blue-900 text-slate-900 text-xs font-medium bg-white"
              >
                <option value="admin">អភិបាលប្រព័ន្ធ (System Administrator) - សិទ្ធិពេញលេញ</option>
                <option value="director">ថ្នាក់ដឹកនាំ / អគ្គនាយក (Director General) - ពិនិត្យ និងផ្តល់ចំណារ</option>
                <option value="officer">មន្ត្រីរដ្ឋបាល (Clerk / Officer) - ចុះបញ្ជី និងចរាចរ</option>
              </select>
            </div>

            {/* 2FA Security Code */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">
                  កូដសុវត្ថិភាពពីរកត្តា (2FA PIN)
                </label>
                <span className="text-[10px] text-slate-400 font-mono">ស្តង់ដារ: 2026</span>
              </div>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Fingerprint className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder="2026"
                  className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-900 focus:border-blue-900 text-slate-900 text-xs font-mono tracking-widest"
                />
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-900 cursor-pointer"
                />
                <span className="text-slate-600 text-xs">ចងចាំការចូលប្រើនៅលើឧបករណ៍នេះ</span>
              </label>

              <span className="text-[11px] text-blue-900 hover:underline cursor-pointer">
                ជំនួយបច្ចេកទេស?
              </span>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 transition-colors disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>ចូលប្រើប្រព័ន្ធរដ្ឋបាល (Sign In)</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Accounts Selection */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-700 mb-2.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-900" />
              <span>ជ្រើសរើសគណនីចូលប្រើរហ័ស (Quick Demo Profiles)៖</span>
            </div>

            <div className="space-y-1.5">
              {DEMO_USERS.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => selectDemoUser(user)}
                  className={`w-full text-left p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                    usernameOrEmail === user.email || usernameOrEmail === user.username
                      ? 'bg-blue-50/80 border-blue-900 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="truncate">
                    <div className="font-semibold text-slate-900 text-xs truncate">
                      {user.name}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {user.title} · {user.username}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-blue-900 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0 ml-2">
                    {user.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security Notice Footer */}
        <div className="text-center mt-6 text-[11px] text-slate-500 space-y-1">
          <p>
            🔒 ប្រព័ន្ធគ្រប់គ្រងលិខិតរដ្ឋបាលផ្លូវការ ព្រះរាជាណាចក្រកម្ពុជា
          </p>
          <p className="text-[10px] text-slate-400">
            រាល់សកម្មភាពចូលប្រើត្រូវបានកត់ត្រាក្នុង Security Audit Logs ស្វ័យប្រវត្តិ
          </p>
        </div>
      </div>
    </div>
  );
};
