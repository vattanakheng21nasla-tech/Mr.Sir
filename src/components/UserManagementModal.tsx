import React, { useState, useEffect } from 'react';
import { UserAccount, CurrentUser, UserRole } from '../types/document';
import { StorageService } from '../services/storageService';
import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  Clock,
  Shield,
  Crown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Trash2,
  Mail,
  Building2,
  KeyRound,
  X,
  Lock,
  User as UserIcon,
  HelpCircle,
  RefreshCw
} from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentUser;
  onUserListChanged?: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserListChanged
}) => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'create'>('pending');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New user form state (direct creation by Owner)
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'director' | 'officer'>('officer');
  const [newDepartment, setNewDepartment] = useState('ការិយាល័យរដ្ឋបាល និងផែនការ');
  const [newTitle, setNewTitle] = useState('មន្ត្រីរដ្ឋបាល');

  const maxUsers = 10;
  const activeUsers = users.filter((u) => u.status === 'active');
  const pendingUsers = users.filter((u) => u.status === 'pending');
  const rejectedUsers = users.filter((u) => u.status === 'rejected');
  const activeCount = activeUsers.length;
  const isQuotaFull = activeCount >= maxUsers;

  const loadUsers = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const remoteData = await StorageService.fetchRemoteUsers();
      if (remoteData) {
        setUsers(remoteData.users);
      } else {
        setUsers(StorageService.getUsers());
      }
    } catch {
      setUsers(StorageService.getUsers());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      setSuccessMessage(null);
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Approve
  const handleApprove = async (user: UserAccount) => {
    if (isQuotaFull) {
      setErrorMessage(`មិនអាចអនុម័តបានទេ! ប្រព័ន្ធកំណត់ចំនួនអ្នកប្រើប្រាស់អតិបរមាត្រឹម ${maxUsers} នាក់ ហើយបច្ចុប្បន្នបានពេញកូតាហើយ (${activeCount}/${maxUsers} នាក់)។`);
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    const res = await StorageService.approveUser(user.id, `${currentUser.name} (Owner)`);
    setIsLoading(false);

    if (res.success) {
      setSuccessMessage(`បានអនុម័តគណនី '${user.name}' ឱ្យចូលប្រើប្រាស់ជោគជ័យ!`);
      loadUsers();
      if (onUserListChanged) onUserListChanged();
    } else {
      setErrorMessage(res.error || 'បរាជ័យក្នុងការអនុម័ត!');
    }
  };

  // Handle Reject
  const handleReject = async (user: UserAccount) => {
    if (user.role === 'owner') return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    const res = await StorageService.rejectUser(user.id, 'បដិសេធដោយ Owner');
    setIsLoading(false);

    if (res.success) {
      setSuccessMessage(`បានបដិសេធសំណើសុំរបស់ '${user.name}'!`);
      loadUsers();
      if (onUserListChanged) onUserListChanged();
    } else {
      setErrorMessage(res.error || 'បរាជ័យក្នុងការបដិសេធ!');
    }
  };

  // Handle Delete
  const handleDelete = async (user: UserAccount) => {
    if (user.role === 'owner' || user.username === 'vattanak') {
      setErrorMessage('មិនអាចលុបគណនី Owner លោក ហេង វឌ្ឍនៈ បានឡើយ!');
      return;
    }

    const confirmDelete = window.confirm(`តើលោកអ្នកពិតជាចង់លុបគណនី '${user.name}' (${user.username}) មែនទេ?`);
    if (!confirmDelete) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    const res = await StorageService.deleteUser(user.id);
    setIsLoading(false);

    if (res.success) {
      setSuccessMessage(`បានលុបគណនី '${user.name}' និងបន្ថែមកូតាទំនេរឡើងវិញ!`);
      loadUsers();
      if (onUserListChanged) onUserListChanged();
    } else {
      setErrorMessage(res.error || 'បរាជ័យក្នុងការលុបគណនី!');
    }
  };

  // Handle Create User directly by Owner
  const handleCreateDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isQuotaFull) {
      setErrorMessage(`មិនអាចបង្កើតបានទេ! ចំនួនអ្នកប្រើប្រាស់សកម្មបានពេញកម្រិតកំណត់ ${maxUsers} នាក់រួចហើយ!`);
      return;
    }

    if (!newName.trim() || !newUsername.trim() || !newEmail.trim() || !newPassword.trim()) {
      setErrorMessage('សូមបំពេញព័ត៌មានចាំបាច់ទាំងអស់!');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    const res = await StorageService.createUserDirect({
      name: newName.trim(),
      username: newUsername.trim().toLowerCase(),
      email: newEmail.trim().toLowerCase(),
      password: newPassword.trim(),
      role: newRole,
      department: newDepartment.trim(),
      title: newTitle.trim()
    });

    setIsLoading(false);

    if (res.success) {
      setSuccessMessage(`បានបង្កើតគណនី '${newName}' ដោយផ្ទាល់ជោគជ័យ!`);
      setNewName('');
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setActiveTab('active');
      loadUsers();
      if (onUserListChanged) onUserListChanged();
    } else {
      setErrorMessage(res.error || 'បរាជ័យក្នុងការបង្កើតគណនី!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-blue-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-blue-950 flex items-center justify-center font-bold shadow-sm">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  ការគ្រប់គ្រង និងអនុម័តអ្នកប្រើប្រាស់ (User Management)
                </h2>
                <span className="text-[10px] bg-amber-400 text-blue-950 font-bold px-2 py-0.5 rounded-full">
                  Owner Panel
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                សិទ្ធិផ្តាច់មុខរបស់លោក ហេង វឌ្ឍនៈ (Owner) · កំណត់ចំនួនអ្នកប្រើប្រាស់អតិបរមា {maxUsers} នាក់
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
            aria-label="បិទផ្ទាំង"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quota Progress Bar Banner */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-900" />
              <span className="font-semibold text-slate-800">
                កូតាអ្នកប្រើប្រាស់បច្ចុប្បន្ន (User Quota)៖
              </span>
              <span className="font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded border border-slate-300">
                {activeCount} / {maxUsers} នាក់
              </span>
              {isQuotaFull ? (
                <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>ពេញកូតា ១០នាក់</span>
                </span>
              ) : (
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>នៅសល់ {maxUsers - activeCount} កន្លែង</span>
                </span>
              )}
            </div>
            {/* Visual Progress Bar */}
            <div className="w-full sm:w-80 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isQuotaFull ? 'bg-rose-500' : activeCount >= 8 ? 'bg-amber-500' : 'bg-blue-600'
                }`}
                style={{ width: `${Math.min(100, (activeCount / maxUsers) * 100)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadUsers}
              disabled={isLoading}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-xs font-medium"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>ផ្ទុកឡើងវិញ</span>
            </button>
            <button
              onClick={() => setActiveTab('create')}
              disabled={isQuotaFull}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors cursor-pointer text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ បង្កើតគណនីថ្មីដោយ Owner</span>
            </button>
          </div>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="mx-6 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-600 hover:text-rose-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="px-6 pt-3 flex border-b border-slate-200 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'border-blue-900 text-blue-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>សំណើសុំចុះឈ្មោះ (Pending)</span>
            {pendingUsers.length > 0 && (
              <span className="text-[10px] bg-amber-500 text-white font-bold px-2 py-0.2 rounded-full">
                {pendingUsers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('active')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'active'
                ? 'border-blue-900 text-blue-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>អ្នកប្រើប្រាស់សកម្ម ({activeCount}/{maxUsers})</span>
          </button>

          <button
            onClick={() => setActiveTab('create')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'border-blue-900 text-blue-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>បង្កើតគណនីថ្មីដោយផ្ទាល់</span>
          </button>
        </div>

        {/* Tab Content (Scrollable) */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: Pending Requests */}
          {activeTab === 'pending' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-semibold text-slate-800">
                  បញ្ជីសំណើសុំចុះឈ្មោះចូលប្រើប្រាស់ ({pendingUsers.length} សំណើ)
                </span>
                <span className="text-slate-500 text-[11px]">
                  មានតែ Owner ប៉ុណ្ណោះដែលមានសិទ្ធិអនុម័ត (Approve) ឬបដិសេធ (Reject)
                </span>
              </div>

              {pendingUsers.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-500 text-xs">
                  <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                  <p className="font-semibold text-slate-700">ពុំមានសំណើសុំចុះឈ្មោះថ្មីដែលកំពុងរង់ចាំឡើយ</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    នៅពេលមានមន្ត្រីចុះឈ្មោះតាមប៊ូតុង Register សំណើនឹងបង្ហាញនៅត្រង់នេះភ្លាមៗ។
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingUsers.map((user) => (
                    <div
                      key={user.id}
                      className="p-4 bg-amber-50/40 border border-amber-200 rounded-xl hover:shadow-xs transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">{user.name}</span>
                          <span className="text-[11px] bg-amber-100 text-amber-900 font-semibold px-2 py-0.5 rounded border border-amber-300 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-700" />
                            <span>រង់ចាំការអនុម័ត (Pending)</span>
                          </span>
                          <span className="text-[11px] bg-blue-50 text-blue-900 font-mono px-2 py-0.5 rounded border border-blue-200">
                            តួនាទីស្នើសុំ៖ {user.role === 'director' ? 'ថ្នាក់ដឹកនាំ' : 'មន្ត្រីរដ្ឋបាល'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                          <div className="flex items-center gap-1.5">
                            <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span>Username: <strong className="text-slate-800 font-mono">{user.username}</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>Email: <strong className="text-slate-800 font-mono">{user.email}</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>អង្គភាព៖ {user.department}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                            <span>កាលបរិច្ឆេទស្នើសុំ៖ {user.requestedAt || 'ថ្មីៗ'}</span>
                          </div>
                        </div>

                        {user.notes && (
                          <div className="text-[11px] bg-white p-2 rounded-lg border border-amber-200 text-slate-700 mt-2">
                            <span className="font-semibold text-slate-900">កម្មវត្ថុ/មូលហេតុស្នើសុំ៖</span> {user.notes}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        <button
                          onClick={() => handleApprove(user)}
                          disabled={isLoading || isQuotaFull}
                          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                          title={isQuotaFull ? 'កូតា ១០ នាក់បានពេញហើយ' : 'អនុម័តឱ្យចូលប្រើប្រាស់'}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>អនុម័ត (Approve)</span>
                        </button>
                        <button
                          onClick={() => handleReject(user)}
                          disabled={isLoading}
                          className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          title="បដិសេធសំណើ"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>បដិសេធ</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Active Users List */}
          {activeTab === 'active' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-semibold text-slate-800">
                  អ្នកប្រើប្រាស់ដែលមានសិទ្ធិចូលប្រើប្រាស់ប្រព័ន្ធ ({activeCount} / {maxUsers} នាក់)
                </span>
                <span className="text-[11px] text-slate-500">
                  កូតាអតិបរមាត្រឹម ១០ នាក់
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                {activeUsers.map((user) => {
                  const isOwner = user.role === 'owner' || user.username === 'vattanak';
                  return (
                    <div
                      key={user.id}
                      className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isOwner ? 'bg-amber-50/30' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isOwner && <Crown className="w-4 h-4 text-amber-500 shrink-0" />}
                          <span className="font-bold text-slate-900 text-sm">{user.name}</span>
                          {isOwner ? (
                            <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                              👑 Owner (ប្រធានការិយាល័យស្តីទី)
                            </span>
                          ) : (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                              Active Member
                            </span>
                          )}
                          <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                            {user.role}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span>Username: <strong className="font-mono text-slate-700">{user.username}</strong></span>
                          <span>Email: <strong className="font-mono text-slate-700">{user.email}</strong></span>
                          <span>អង្គភាព៖ {user.department}</span>
                          {user.approvedAt && <span>កាលបរិច្ឆេទអនុម័ត៖ {user.approvedAt}</span>}
                        </div>
                      </div>

                      {/* Action */}
                      <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                        {isOwner ? (
                          <span className="text-[11px] text-amber-800 bg-amber-100/70 px-2.5 py-1 rounded-md font-medium border border-amber-200">
                            គណនីមេ (មិនអាចលុប)
                          </span>
                        ) : (
                          <button
                            onClick={() => handleDelete(user)}
                            className="flex items-center gap-1 px-2.5 py-1 text-rose-700 hover:text-white hover:bg-rose-600 bg-rose-50 border border-rose-200 rounded-md transition-colors cursor-pointer text-xs font-semibold"
                            title="លុបគណនី (ផ្ទេរកូតាទំនេរ)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>លុប</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Rejected Users Section (Collapsible / Informational) */}
              {rejectedUsers.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-200">
                  <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <UserX className="w-3.5 h-3.5 text-rose-600" />
                    <span>សំណើដែលត្រូវបានបដិសេធ ({rejectedUsers.length})</span>
                  </h4>
                  <div className="space-y-2">
                    {rejectedUsers.map((u) => (
                      <div
                        key={u.id}
                        className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs text-slate-600"
                      >
                        <div>
                          <span className="font-semibold text-slate-800">{u.name}</span> ({u.username}) · {u.email}
                        </div>
                        <button
                          onClick={() => handleApprove(u)}
                          disabled={isQuotaFull}
                          className="text-[11px] font-semibold text-blue-900 hover:underline cursor-pointer disabled:opacity-40"
                        >
                          អនុម័តឡើងវិញ
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Create User Directly by Owner */}
          {activeTab === 'create' && (
            <div className="max-w-xl mx-auto space-y-4">
              <div className="text-center space-y-1 mb-4">
                <h3 className="text-sm font-bold text-slate-900">
                  បង្កើតគណនីអ្នកប្រើប្រាស់ថ្មីដោយផ្ទាល់ (Direct Creation by Owner)
                </h3>
                <p className="text-xs text-slate-500">
                  Owner អាចបង្កើត និងបើកសិទ្ធិប្រើប្រាស់ភ្លាមៗដល់មន្ត្រីចំណុះ (កូតានៅសល់៖ {maxUsers - activeCount} នាក់)
                </p>
              </div>

              {isQuotaFull ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">កូតាអ្នកប្រើប្រាស់បានពេញ ១០ នាក់ហើយ!</p>
                    <p className="mt-0.5">
                      លោកអ្នកមិនអាចបង្កើតគណនីបន្ថែមបានទៀតទេ លុះត្រាតែលុបគណនីចាស់មួយជាមុនសិន។
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateDirect} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      គោត្តនាម និងនាម (Full Name) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="ឧ. លោក ឈុន វិបុល ឬ ឯកឧត្តម គង់ សុខា"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-900 focus:border-blue-900 text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        ឈ្មោះគណនី (Username) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="ឧ. vibol"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-900 focus:border-blue-900 text-slate-900 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        អាសយដ្ឋានអ៊ីមែល (Email) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="vibol@docutrack.gov.kh"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-900 focus:border-blue-900 text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      លេខកូដសម្ងាត់ផ្ទាល់ខ្លួន (Password / PIN) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="បញ្ចូលពាក្យសម្ងាត់..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-900 focus:border-blue-900 text-slate-900 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        តួនាទី (Role) <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={newRole}
                        onChange={(e) => {
                          const r = e.target.value as 'director' | 'officer';
                          setNewRole(r);
                          setNewTitle(r === 'director' ? 'ថ្នាក់ដឹកនាំ / អគ្គនាយក' : 'មន្ត្រីរដ្ឋបាល');
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-900 focus:border-blue-900 text-slate-900"
                      >
                        <option value="officer">មន្ត្រីរដ្ឋបាល (Clerk / Officer)</option>
                        <option value="director">ថ្នាក់ដឹកនាំ / អគ្គនាយក (Director General)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        ចំណងជើងការងារ (Title)
                      </label>
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="ឧ. មន្ត្រីរដ្ឋបាលចុះបញ្ជី"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-900 focus:border-blue-900 text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      អង្គភាព / នាយកដ្ឋាន
                    </label>
                    <input
                      type="text"
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value)}
                      placeholder="ការិយាល័យរដ្ឋបាល និងផែនការ"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-900 focus:border-blue-900 text-slate-900"
                    />
                  </div>

                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={isLoading || isQuotaFull}
                      className="w-full py-2.5 px-4 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      {isLoading ? 'កំពុងដំណើរការ...' : 'រក្សាទុក និងបើកសិទ្ធិប្រើប្រាស់ភ្លាមៗ'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-blue-900" />
            <span>ប្រព័ន្ធគ្រប់គ្រងសិទ្ធិតាមឋានានុក្រមរដ្ឋបាល · កំណត់ចំនួនអ្នកប្រើប្រាស់ ១០ នាក់</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-medium cursor-pointer transition-colors"
          >
            បិទ
          </button>
        </div>
      </div>
    </div>
  );
};
