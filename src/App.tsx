import React, { useState, useEffect, useCallback } from 'react';
import {
  DocumentItem,
  DocumentDirection,
  DocumentStatus,
  TelegramConfig,
  TelegramMessageLog,
  BackupRecord,
  AuditLog,
  CurrentUser,
  DocumentAttachment
} from './types/document';
import { StorageService, AutoBackupSettings } from './services/storageService';
import { TelegramService } from './services/telegramService';
import { BackupService } from './services/backupService';

import { TopNavigation } from './components/TopNavigation';
import { DocumentStats } from './components/DocumentStats';
import { DocumentList } from './components/DocumentList';
import { DocumentFormModal } from './components/DocumentFormModal';
import { WorkflowModal } from './components/WorkflowModal';
import { TrackingModal } from './components/TrackingModal';
import { TelegramSettingsView } from './components/TelegramSettingsView';
import { BackupSettingsView } from './components/BackupSettingsView';
import { OfficialPrintView } from './components/OfficialPrintView';
import { AuditLogView } from './components/AuditLogView';
import { LoginView } from './components/LoginView';
import { UserManagementModal } from './components/UserManagementModal';

import {
  FileDown,
  FileUp,
  Search,
  CloudCheck,
  Send,
  ShieldCheck,
  History,
  QrCode,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus
} from 'lucide-react';

export default function App() {
  // App state
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>(StorageService.getTelegramConfig());
  const [telegramLogs, setTelegramLogs] = useState<TelegramMessageLog[]>([]);
  const [backupRecords, setBackupRecords] = useState<BackupRecord[]>([]);
  const [autoBackupSettings, setAutoBackupSettings] = useState<AutoBackupSettings>(StorageService.getAutoBackupSettings());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser>(StorageService.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(StorageService.isAuthenticated());

  // Navigation and active view
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'incoming' | 'outgoing' | 'tracking' | 'telegram' | 'backup' | 'audit'>('dashboard');

  // Modals & Active items
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);
  const [formDefaultDirection, setFormDefaultDirection] = useState<DocumentDirection>('in');

  const [workflowDoc, setWorkflowDoc] = useState<DocumentItem | null>(null);
  const [isWorkflowOpen, setIsWorkflowOpen] = useState(false);

  const [trackingDoc, setTrackingDoc] = useState<DocumentItem | null>(null);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);

  const [printingDoc, setPrintingDoc] = useState<DocumentItem | null>(null);

  // User Management State (Owner only, max 10 users quota)
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [pendingUsersCount, setPendingUsersCount] = useState<number>(0);
  const [activeUsersCount, setActiveUsersCount] = useState<number>(1);

  // Quick Tracking search code in tracking tab
  const [directSearchCode, setDirectSearchCode] = useState('');
  const [searchNotFound, setSearchNotFound] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadUserStats = useCallback(() => {
    StorageService.fetchRemoteUsers().then((res) => {
      if (res) {
        setPendingUsersCount(res.pendingCount);
        setActiveUsersCount(res.activeCount);
      } else {
        const local = StorageService.getUsers();
        setPendingUsersCount(local.filter((u) => u.status === 'pending').length);
        setActiveUsersCount(local.filter((u) => u.status === 'active').length);
      }
    });
  }, []);

  // Initial load
  useEffect(() => {
    const docs = StorageService.getDocuments();
    setDocuments(docs);
    setTelegramConfig(StorageService.getTelegramConfig());
    setTelegramLogs(StorageService.getTelegramLogs());
    setBackupRecords(StorageService.getBackupRecords());
    setAutoBackupSettings(StorageService.getAutoBackupSettings());
    setAuditLogs(StorageService.getAuditLogs());
    setCurrentUser(StorageService.getCurrentUser());

    // Load initial user counts
    loadUserStats();

    // Check if initial backup record is needed
    if (StorageService.getBackupRecords().length === 0) {
      BackupService.createBackupSnapshot('automated_schedule', StorageService.getCurrentUser(), 'បម្រុងទុកទិន្នន័យដំបូង');
      setBackupRecords(StorageService.getBackupRecords());
    }

    // Initial load from server for cross-device shared synchronization (Requirement 6)
    StorageService.fetchRemoteDocuments().then((remoteDocs) => {
      if (remoteDocs && remoteDocs.length > 0) {
        setDocuments(remoteDocs);
      }
    });

    // Background polling every 4 seconds to sync live documents and user requests across team members
    const syncInterval = setInterval(() => {
      StorageService.fetchRemoteDocuments().then((remoteDocs) => {
        if (remoteDocs && remoteDocs.length > 0) {
          setDocuments(remoteDocs);
        }
      });
      loadUserStats();
    }, 4000);

    const onFocus = () => {
      StorageService.fetchRemoteDocuments().then((remoteDocs) => {
        if (remoteDocs && remoteDocs.length > 0) {
          setDocuments(remoteDocs);
        }
      });
      loadUserStats();
    };
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('focus', onFocus);
    };
  }, [loadUserStats]);

  // Sync state helpers
  const refreshAll = useCallback(() => {
    setDocuments(StorageService.getDocuments());
    setTelegramLogs(StorageService.getTelegramLogs());
    setBackupRecords(StorageService.getBackupRecords());
    setAuditLogs(StorageService.getAuditLogs());
  }, []);

  // Save document (Create or Update)
  const handleSaveDocument = async (doc: DocumentItem, sendTelegram: boolean) => {
    const isNew = !editingDoc;
    let updatedList: DocumentItem[];

    if (isNew) {
      updatedList = [doc, ...documents];
      StorageService.addAuditLog(
        doc.direction === 'in' ? 'ចុះបញ្ជីលិខិតចូល' : 'ចុះបញ្ជីលិខិតចេញ',
        `បានចុះបញ្ជីលេខ ${doc.letterNumber} (កូដ: ${doc.trackingCode})`,
        currentUser,
        doc.trackingCode
      );
    } else {
      updatedList = documents.map((d) => (d.id === doc.id ? doc : d));
      StorageService.addAuditLog(
        'កែប្រែព័ត៌មានលិខិត',
        `កែប្រែទិន្នន័យលេខ ${doc.letterNumber} (កូដ: ${doc.trackingCode})`,
        currentUser,
        doc.trackingCode
      );
    }

    StorageService.saveDocuments(updatedList);
    setDocuments(updatedList);
    setIsFormOpen(false);
    setEditingDoc(null);

    // If auto backup on change is enabled
    if (autoBackupSettings.enabled && autoBackupSettings.frequency === 'change') {
      await BackupService.createBackupSnapshot('automated_schedule', currentUser);
      setBackupRecords(StorageService.getBackupRecords());
    }

    // Send Telegram alert if requested
    if (sendTelegram) {
      if (isNew) {
        await TelegramService.notifyNewDocument(doc);
      } else {
        await TelegramService.notifyStatusChange(doc, 'បានកែប្រែព័ត៌មានលិខិត');
      }
      setTelegramLogs(StorageService.getTelegramLogs());
    }

    showToast(isNew ? 'បានចុះបញ្ជីលិខិតជោគជ័យ!' : 'បានរក្សាទុកការកែប្រែជោគជ័យ!');
  };

  // Delete document
  const handleDeleteDocument = (docId: string) => {
    const docToDelete = documents.find((d) => d.id === docId);
    if (!docToDelete) return;

    if (window.confirm(`តើអ្នកពិតជាចង់លុបលិខិតលេខ "${docToDelete.letterNumber}" (${docToDelete.trackingCode}) មែនទេ?`)) {
      const updated = documents.filter((d) => d.id !== docId);
      StorageService.saveDocuments(updated);
      setDocuments(updated);
      StorageService.addAuditLog(
        'លុបលិខិតរដ្ឋបាល',
        `បានលុបលិខិតលេខ ${docToDelete.letterNumber} (${docToDelete.trackingCode})`,
        currentUser,
        docToDelete.trackingCode
      );
      setAuditLogs(StorageService.getAuditLogs());
      showToast('បានលុបលិខិតចេញពីប្រព័ន្ធរួចរាល់!');
    }
  };

  // Workflow status transition
  const handleApplyWorkflow = async (
    docId: string,
    newStatus: DocumentStatus,
    directiveNote: string,
    notifyTelegram: boolean,
    audioAttachment?: DocumentAttachment
  ) => {
    const targetDoc = documents.find((d) => d.id === docId);
    if (!targetDoc) return;

    const newStep = {
      id: `wf-${Date.now()}`,
      timestamp: new Date().toLocaleDateString('en-CA') + ' ' + new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit' }),
      status: newStatus,
      actorName: currentUser.name,
      actorRole: currentUser.role === 'owner' ? 'ប្រធានការិយាល័យស្តីទី' : currentUser.role === 'admin' ? 'អភិបាលប្រព័ន្ធ' : currentUser.role === 'director' ? 'ថ្នាក់ដឹកនាំ' : 'មន្ត្រីរដ្ឋបាល',
      actionTitle: `ប្តូរស្ថានភាពទៅជា "${newStatus}"`,
      notes: directiveNote || undefined
    };

    const newAttachments = audioAttachment
      ? [...targetDoc.attachments, audioAttachment]
      : targetDoc.attachments;

    const updatedDoc: DocumentItem = {
      ...targetDoc,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      attachments: newAttachments,
      workflowLogs: [...targetDoc.workflowLogs, newStep]
    };

    const updatedList = documents.map((d) => (d.id === docId ? updatedDoc : d));
    StorageService.saveDocuments(updatedList);
    setDocuments(updatedList);

    StorageService.addAuditLog(
      'ប្តូរស្ថានភាពលិខិត & ផ្តល់ចំណារ',
      `ប្តូរស្ថានភាពកូដ ${updatedDoc.trackingCode} ទៅជា ${newStatus}${directiveNote ? ` | ចំណារ: "${directiveNote}"` : ''}`,
      currentUser,
      updatedDoc.trackingCode
    );
    setAuditLogs(StorageService.getAuditLogs());

    // Send Telegram
    if (notifyTelegram) {
      await TelegramService.notifyStatusChange(updatedDoc, directiveNote);
      setTelegramLogs(StorageService.getTelegramLogs());
    }

    // Auto backup on change
    if (autoBackupSettings.enabled && autoBackupSettings.frequency === 'change') {
      await BackupService.createBackupSnapshot('automated_schedule', currentUser);
      setBackupRecords(StorageService.getBackupRecords());
    }

    showToast('បានកែប្រែស្ថានភាព និងកត់ត្រាចំណារជោគជ័យ!');
  };

  // Quick Telegram Send from table
  const handleQuickTelegramSend = async (doc: DocumentItem) => {
    showToast('កំពុងបញ្ជូនព័ត៌មាន និងរុញឯកសារភ្ជាប់ទៅកាន់ Telegram...');
    const res = await TelegramService.sendToTelegram(
      TelegramService.formatDocumentKhmerMessage(doc, 'new'),
      telegramConfig,
      doc.trackingCode,
      'new_doc'
    );
    let extraMsg = '';
    if (doc.attachments && doc.attachments.length > 0 && telegramConfig.includeAttachmentsInTelegram !== false) {
      const attRes = await TelegramService.sendAllAttachmentsToTelegram(doc, telegramConfig);
      extraMsg = ` · ${attRes.message}`;
    }
    setTelegramLogs(StorageService.getTelegramLogs());
    showToast(`${res.message}${extraMsg}`);
  };

  // Direct tracking lookup
  const handleDirectSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directSearchCode.trim()) return;

    const query = directSearchCode.trim().toLowerCase();
    const match = documents.find(
      (d) =>
        d.trackingCode.toLowerCase() === query ||
        d.letterNumber.toLowerCase() === query ||
        (d.inOutBookNumber && d.inOutBookNumber.toLowerCase() === query)
    );

    if (match) {
      setTrackingDoc(match);
      setIsTrackingOpen(true);
      setSearchNotFound(false);
    } else {
      setSearchNotFound(true);
    }
  };

  // Manual Trigger Backup Now
  const handleTriggerBackupNow = async () => {
    const res = await BackupService.createBackupSnapshot('automated_schedule', currentUser, 'បម្រុងទុកទិន្នន័យដោយដៃ (Manual Backup Now)');
    setBackupRecords(StorageService.getBackupRecords());
    setAuditLogs(StorageService.getAuditLogs());
    showToast(`ការបម្រុងទុកទិន្នន័យ ${res.record.checksum} ទទួលបានជោគជ័យ!`);
  };

  // Export success handler
  const handleExportSuccess = (fileName: string, _format: 'excel' | 'csv', count: number) => {
    showToast(`បានទាញយកឯកសារ ${fileName} (${count} លិខិត) ដោយជោគជ័យ!`);
    setAuditLogs(StorageService.getAuditLogs());
  };

  // User role switch
  const handleChangeUserRole = (newRole: CurrentUser['role']) => {
    const roleMap: Record<CurrentUser['role'], { name: string; department: string }> = {
      owner: { name: 'លោក ហេង វឌ្ឍនៈ', department: 'ការិយាល័យរដ្ឋបាល និងផែនការ' },
      admin: { name: 'លោក ហេង វឌ្ឍនៈ', department: 'ការិយាល័យរដ្ឋបាល និងផែនការ' },
      director: { name: 'ឯកឧត្តម អគ្គនាយក', department: 'ថ្នាក់ដឹកនាំ / អគ្គនាយកដ្ឋាន' },
      officer: { name: 'លោក វ៉ាន់ សុវណ្ណារ៉ា', department: 'នាយកដ្ឋានរដ្ឋបាល និងបុគ្គលិក' }
    };
    const info = roleMap[newRole] || roleMap.owner;
    const updatedUser: CurrentUser = {
      ...currentUser,
      role: newRole,
      name: info.name,
      department: info.department
    };
    setCurrentUser(updatedUser);
    StorageService.saveCurrentUser(updatedUser);
    showToast(`បានប្តូរទៅកាន់គណនី៖ ${updatedUser.name} (${newRole === 'owner' ? 'ប្រធានការិយាល័យស្តីទី' : newRole})`);
  };

  // Authentication Handlers
  const handleLoginSuccess = (user: CurrentUser) => {
    StorageService.login(user);
    setCurrentUser(user);
    setIsAuthenticated(true);
    setAuditLogs(StorageService.getAuditLogs());
    showToast(`សូមស្វាគមន៍មកកាន់ប្រព័ន្ធរដ្ឋបាល! ${user.name}`);
  };

  const handleLogout = () => {
    StorageService.logout();
    setIsAuthenticated(false);
    setAuditLogs(StorageService.getAuditLogs());
    showToast('បានចាកចេញពីប្រព័ន្ធដោយជោគជ័យ!');
  };

  // If user is not authenticated, show the Login Screen
  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // If in Official Print Preview Mode
  if (printingDoc) {
    return (
      <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
        <OfficialPrintView
          document={printingDoc}
          onBack={() => setPrintingDoc(null)}
        />
      </div>
    );
  }

  const latestBackup = backupRecords.length > 0 ? backupRecords[0] : undefined;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Strict Top Navigation Bar */}
      <TopNavigation
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab as typeof currentTab)}
        onOpenNewDocModal={() => {
          setEditingDoc(null);
          setFormDefaultDirection('in');
          setIsFormOpen(true);
        }}
        currentUser={currentUser}
        onChangeUserRole={handleChangeUserRole}
        onLogout={handleLogout}
        onOpenUserManagement={() => setIsUserManagementOpen(true)}
        pendingUsersCount={pendingUsersCount}
        activeUsersCount={activeUsersCount}
      />

      {/* Main Workspace Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPI Strip */}
        <DocumentStats
          documents={documents}
          latestBackup={latestBackup}
        />

        {/* Dynamic Tab Views */}
        {currentTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Quick Actions and Direct QR Tracking lookup */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Direct Tracking search box */}
              <div className="md:col-span-8 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2 text-slate-900 font-bold text-xs">
                  <QrCode className="w-4 h-4 text-blue-900" />
                  <span>ស្វែងរក & ផ្ទៀងផ្ទាត់លិខិតរហ័សតាមលេខកូដតាមដាន (Direct Tracking)</span>
                </div>
                <form onSubmit={handleDirectSearch} className="flex gap-2">
                  <input
                    type="text"
                    value={directSearchCode}
                    onChange={(e) => {
                      setDirectSearchCode(e.target.value);
                      setSearchNotFound(false);
                    }}
                    placeholder="បញ្ចូលលេខកូដតាមដាន ឧ. DOC-2026-IN-0012 ឬលេខលិខិត..."
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-blue-900 focus:bg-white text-slate-800"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>ស្វែងរក</span>
                  </button>
                </form>
                {searchNotFound && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">
                    មិនរកឃើញលិខិតដែលមានលេខកូដ "{directSearchCode}" ឡើយ។ សូមពិនិត្យលេខកូដម្តងទៀត។
                  </p>
                )}
              </div>

              {/* Quick Document Registration Action Card */}
              <div className="md:col-span-4 bg-blue-900 text-white p-5 rounded-xl shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm mb-1 text-amber-300">
                    ចុះបញ្ជីលិខិតរដ្ឋបាលថ្មី
                  </h3>
                  <p className="text-[11px] text-blue-100 leading-relaxed">
                    បង្កើតលេខកូដតាមដានស្វ័យប្រវត្តិ ចេញប័ណ្ណ QR Code និងផ្ញើជូនដំណឹងតាម Telegram ភ្លាមៗ
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-blue-800">
                  <button
                    onClick={() => {
                      setEditingDoc(null);
                      setFormDefaultDirection('in');
                      setIsFormOpen(true);
                    }}
                    className="flex-1 py-1.5 px-3 bg-white text-blue-900 hover:bg-blue-50 text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center"
                  >
                    + លិខិតចូល
                  </button>
                  <button
                    onClick={() => {
                      setEditingDoc(null);
                      setFormDefaultDirection('out');
                      setIsFormOpen(true);
                    }}
                    className="flex-1 py-1.5 px-3 bg-blue-800 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center"
                  >
                    + លិខិតចេញ
                  </button>
                </div>
              </div>
            </div>

            {/* Complete Document Data Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-900">
                  បញ្ជីលិខិតរដ្ឋបាលចុងក្រោយបង្អស់ (All Registered Documents)
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentTab('incoming')}
                    className="text-xs text-blue-900 hover:underline font-medium cursor-pointer"
                  >
                    មើលតែលិខិតចូល →
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    onClick={() => setCurrentTab('outgoing')}
                    className="text-xs text-blue-900 hover:underline font-medium cursor-pointer"
                  >
                    មើលតែលិខិតចេញ →
                  </button>
                </div>
              </div>

              <DocumentList
                documents={documents}
                directionFilter="all"
                onTrackDocument={(doc) => {
                  setTrackingDoc(doc);
                  setIsTrackingOpen(true);
                }}
                onUpdateStatus={(doc) => {
                  setWorkflowDoc(doc);
                  setIsWorkflowOpen(true);
                }}
                onPrintDocument={(doc) => setPrintingDoc(doc)}
                onEditDocument={(doc) => {
                  setEditingDoc(doc);
                  setIsFormOpen(true);
                }}
                onDeleteDocument={handleDeleteDocument}
                onQuickTelegramSend={handleQuickTelegramSend}
                onExportSuccess={handleExportSuccess}
              />
            </div>
          </div>
        )}

        {/* Incoming Documents Tab */}
        {currentTab === 'incoming' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileDown className="w-5 h-5 text-blue-900" />
                  <span>បញ្ជីលិខិតចូលរដ្ឋបាល (Inward Dispatch Registry)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  គ្រប់គ្រងលិខិតចូលពីគ្រប់ក្រសួង ស្ថាប័ន និងអង្គភាពចំណុះ
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingDoc(null);
                  setFormDefaultDirection('in');
                  setIsFormOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>+ ចុះបញ្ជីលិខិតចូលថ្មី</span>
              </button>
            </div>

            <DocumentList
              documents={documents}
              directionFilter="in"
              onTrackDocument={(doc) => {
                setTrackingDoc(doc);
                setIsTrackingOpen(true);
              }}
              onUpdateStatus={(doc) => {
                setWorkflowDoc(doc);
                setIsWorkflowOpen(true);
              }}
              onPrintDocument={(doc) => setPrintingDoc(doc)}
              onEditDocument={(doc) => {
                setEditingDoc(doc);
                setIsFormOpen(true);
              }}
              onDeleteDocument={handleDeleteDocument}
              onQuickTelegramSend={handleQuickTelegramSend}
              onExportSuccess={handleExportSuccess}
            />
          </div>
        )}

        {/* Outgoing Documents Tab */}
        {currentTab === 'outgoing' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileUp className="w-5 h-5 text-emerald-700" />
                  <span>បញ្ជីលិខិតចេញរដ្ឋបាល (Outward Dispatch Registry)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  គ្រប់គ្រងលិខិតចេញ សេចក្តីសម្រេច សារាចរ និងរបាយការណ៍បញ្ជូនចេញក្រៅ
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingDoc(null);
                  setFormDefaultDirection('out');
                  setIsFormOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>+ ចុះបញ្ជីលិខិតចេញថ្មី</span>
              </button>
            </div>

            <DocumentList
              documents={documents}
              directionFilter="out"
              onTrackDocument={(doc) => {
                setTrackingDoc(doc);
                setIsTrackingOpen(true);
              }}
              onUpdateStatus={(doc) => {
                setWorkflowDoc(doc);
                setIsWorkflowOpen(true);
              }}
              onPrintDocument={(doc) => setPrintingDoc(doc)}
              onEditDocument={(doc) => {
                setEditingDoc(doc);
                setIsFormOpen(true);
              }}
              onDeleteDocument={handleDeleteDocument}
              onQuickTelegramSend={handleQuickTelegramSend}
              onExportSuccess={handleExportSuccess}
            />
          </div>
        )}

        {/* Tracking & QR Code Tab */}
        {currentTab === 'tracking' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold">
                  QR
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    មជ្ឈមណ្ឌលតាមដាន & ផ្ទៀងផ្ទាត់លិខិត (Digital Tracking Center)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ស្វែងរកតាមលេខកូដតាមដាន ឬចុចលើលិខិតណាមួយដើម្បីពិនិត្យដំណាក់កាលចរាចរ និង QR Code
                  </p>
                </div>
              </div>

              {/* Search Bar */}
              <form onSubmit={handleDirectSearch} className="flex gap-2 max-w-xl">
                <input
                  type="text"
                  value={directSearchCode}
                  onChange={(e) => {
                    setDirectSearchCode(e.target.value);
                    setSearchNotFound(false);
                  }}
                  placeholder="បញ្ចូលលេខកូដតាមដាន ឧ. DOC-2026-IN-0012..."
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-blue-900 focus:bg-white text-slate-800"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>ពិនិត្យស្ថានភាព</span>
                </button>
              </form>
              {searchNotFound && (
                <p className="text-[11px] text-rose-600 mt-2 font-medium">
                  មិនរកឃើញលិខិតដែលមានលេខកូដ "{directSearchCode}" ឡើយ។
                </p>
              )}
            </div>

            {/* Quick Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => {
                    setTrackingDoc(doc);
                    setIsTrackingOpen(true);
                  }}
                  className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-900 transition-all cursor-pointer shadow-xs hover:shadow-sm space-y-2.5 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-blue-900 text-xs">
                      {doc.trackingCode}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {doc.dateReceivedOrIssued}
                    </span>
                  </div>

                  <div className="font-semibold text-slate-900 text-xs line-clamp-2 group-hover:text-blue-900 transition-colors">
                    {doc.subject}
                  </div>

                  <div className="text-[11px] text-slate-500">
                    {doc.direction === 'in' ? `មកពី៖ ${doc.sender}` : `ផ្ញើទៅ៖ ${doc.receiver}`}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-600 font-medium">
                      ស្ថានភាព៖ {doc.status}
                    </span>
                    <span className="text-blue-900 font-semibold group-hover:underline flex items-center gap-1">
                      <span>តាមដាន</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Telegram Tab */}
        {currentTab === 'telegram' && (
          <TelegramSettingsView
            config={telegramConfig}
            logs={telegramLogs}
            onSaveConfig={(updated) => {
              StorageService.saveTelegramConfig(updated);
              setTelegramConfig(updated);
              showToast('បានរក្សាទុកការកំណត់ Telegram ជោគជ័យ!');
            }}
            onRefreshLogs={() => setTelegramLogs(StorageService.getTelegramLogs())}
          />
        )}

        {/* Cloud Backup & Security Tab */}
        {currentTab === 'backup' && (
          <BackupSettingsView
            settings={autoBackupSettings}
            records={backupRecords}
            currentUser={currentUser}
            onSaveSettings={(updated) => {
              StorageService.saveAutoBackupSettings(updated);
              setAutoBackupSettings(updated);
              showToast('បានរក្សាទុកការកំណត់បម្រុងទុកស្វ័យប្រវត្តិ!');
            }}
            onTriggerBackupNow={handleTriggerBackupNow}
            onRefreshRecords={() => setBackupRecords(StorageService.getBackupRecords())}
            onRestoreSuccess={() => {
              refreshAll();
              showToast('បានទាញយកទិន្នន័យមកវិញជោគជ័យ!');
            }}
          />
        )}

        {/* Audit Log Tab */}
        {currentTab === 'audit' && (
          <AuditLogView logs={auditLogs} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-5 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-semibold text-slate-700">DocuTrack Admin System</span> · ប្រព័ន្ធគ្រប់គ្រងលិខិតរដ្ឋបាលចេញ-ចូល
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setCurrentTab('audit')}
              className="hover:text-blue-900 cursor-pointer font-medium"
            >
              កំណត់ត្រាសវនកម្ម ({auditLogs.length})
            </button>
            <span className="text-slate-300">·</span>
            <span className="text-emerald-700 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> សុវត្ថិភាពខ្ពស់
            </span>
            <span className="text-slate-300">·</span>
            <span>ជំនាន់ ២០២៦.១</span>
          </div>
        </div>
      </footer>

      {/* Document Form Modal (Register & Edit) */}
      <DocumentFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingDoc(null);
        }}
        onSave={handleSaveDocument}
        editingDoc={editingDoc}
        defaultDirection={formDefaultDirection}
      />

      {/* Workflow Modal (Status transition & directives) */}
      <WorkflowModal
        isOpen={isWorkflowOpen}
        onClose={() => {
          setIsWorkflowOpen(false);
          setWorkflowDoc(null);
        }}
        document={workflowDoc}
        currentUser={currentUser}
        onApplyWorkflow={handleApplyWorkflow}
      />

      {/* Tracking Modal (QR Code & Public Verification) */}
      <TrackingModal
        isOpen={isTrackingOpen}
        onClose={() => {
          setIsTrackingOpen(false);
          setTrackingDoc(null);
        }}
        document={trackingDoc}
        onPrintDocument={(doc) => setPrintingDoc(doc)}
      />

      {/* User Management Modal (Owner exclusive, 10 users quota) */}
      <UserManagementModal
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
        currentUser={currentUser}
        onUserListChanged={loadUserStats}
      />

      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
