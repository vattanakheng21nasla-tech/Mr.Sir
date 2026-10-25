import { DocumentItem, TelegramConfig, TelegramMessageLog, BackupRecord, AuditLog, CurrentUser, UserAccount } from '../types/document';
import { INITIAL_DOCUMENTS, INITIAL_TELEGRAM_CONFIG, CURRENT_OFFICER_USER, INITIAL_USERS } from '../data/initialDocuments';

const STORAGE_KEYS = {
  DOCUMENTS: 'docutrack_documents_v1',
  TELEGRAM_CONFIG: 'docutrack_telegram_config_v1',
  TELEGRAM_LOGS: 'docutrack_telegram_logs_v1',
  BACKUP_RECORDS: 'docutrack_backup_records_v1',
  AUDIT_LOGS: 'docutrack_audit_logs_v1',
  CURRENT_USER: 'docutrack_current_user_v1',
  AUTO_BACKUP_SETTINGS: 'docutrack_auto_backup_settings_v1',
  USERS: 'docutrack_users_v2',
};

export interface AutoBackupSettings {
  enabled: boolean;
  frequency: 'change' | 'hourly' | 'daily';
  lastBackupTime?: string;
  autoSyncTelegram: boolean;
  encryptData: boolean;
}

// Helper to sanitize historical data (rename to Lok Heng Vattanak)
function sanitizeDocuments(docs: DocumentItem[]): DocumentItem[] {
  return docs.map((doc) => {
    let changed = false;
    const sanitizedWf = doc.workflowLogs.map((wf) => {
      if (wf.actorName && wf.actorName.includes('ឯកឧត្តម ហេង វឌ្ឍនៈ')) {
        changed = true;
        return {
          ...wf,
          actorName: 'លោក ហេង វឌ្ឍនៈ',
          actorRole: 'ប្រធានការិយាល័យស្តីទី'
        };
      }
      return wf;
    });
    if (changed) {
      return { ...doc, workflowLogs: sanitizedWf };
    }
    return doc;
  });
}

export const StorageService = {
  getDocuments(): DocumentItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(INITIAL_DOCUMENTS));
        return INITIAL_DOCUMENTS;
      }
      const parsed = JSON.parse(data);
      const sanitized = sanitizeDocuments(parsed);
      return sanitized;
    } catch {
      return INITIAL_DOCUMENTS;
    }
  },

  /**
   * Save documents locally and asynchronously broadcast to full-stack server
   * for Requirement 6 (cross-machine data consistency)
   */
  saveDocuments(docs: DocumentItem[]): void {
    const sanitized = sanitizeDocuments(docs);
    try {
      localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(sanitized));
    } catch (e) {
      console.warn('localStorage quota warning', e);
    }

    // Sync to server asynchronously
    fetch('/api/documents/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documents: sanitized })
    }).catch((err) => {
      // Offline fallback: purely local mode
      console.log('Server sync status: stored locally', err);
    });
  },

  /**
   * Fetch live documents from server database
   */
  async fetchRemoteDocuments(): Promise<DocumentItem[] | null> {
    try {
      const res = await fetch('/api/documents');
      if (!res.ok) return null;
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        const sanitized = sanitizeDocuments(json.data);
        localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(sanitized));
        return sanitized;
      }
      return null;
    } catch {
      return null;
    }
  },

  getTelegramConfig(): TelegramConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TELEGRAM_CONFIG);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.TELEGRAM_CONFIG, JSON.stringify(INITIAL_TELEGRAM_CONFIG));
        return INITIAL_TELEGRAM_CONFIG;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_TELEGRAM_CONFIG;
    }
  },

  saveTelegramConfig(config: TelegramConfig): void {
    localStorage.setItem(STORAGE_KEYS.TELEGRAM_CONFIG, JSON.stringify(config));
    fetch('/api/telegram-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    }).catch(() => {});
  },

  getTelegramLogs(): TelegramMessageLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TELEGRAM_LOGS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addTelegramLog(log: TelegramMessageLog): void {
    const logs = this.getTelegramLogs();
    const updated = [log, ...logs].slice(0, 50); // keep last 50
    localStorage.setItem(STORAGE_KEYS.TELEGRAM_LOGS, JSON.stringify(updated));
    fetch('/api/telegram-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log)
    }).catch(() => {});
  },

  getBackupRecords(): BackupRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BACKUP_RECORDS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addBackupRecord(record: BackupRecord): void {
    const records = this.getBackupRecords();
    const updated = [record, ...records].slice(0, 30);
    localStorage.setItem(STORAGE_KEYS.BACKUP_RECORDS, JSON.stringify(updated));
    fetch('/api/backup-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    }).catch(() => {});
  },

  getAuditLogs(): AuditLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addAuditLog(action: string, details: string, user: CurrentUser, targetId?: string): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toLocaleString('en-CA', { hour12: false }).replace(',', ''),
      userName: user.name,
      userRole: user.role,
      action,
      targetId,
      details
    };
    const updated = [newLog, ...logs].slice(0, 100);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(updated));
    fetch('/api/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLog)
    }).catch(() => {});
  },

  getCurrentUser(): CurrentUser {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (!data) return CURRENT_OFFICER_USER;
      const parsed = JSON.parse(data);
      // Migrate historical name if old title was stored
      if (parsed.name && parsed.name.includes('ឯកឧត្តម ហេង វឌ្ឍនៈ')) {
        parsed.name = 'លោក ហេង វឌ្ឍនៈ';
        parsed.role = 'owner';
        parsed.department = 'ការិយាល័យរដ្ឋបាល និងផែនការ';
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      return CURRENT_OFFICER_USER;
    }
  },

  saveCurrentUser(user: CurrentUser): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  },

  getAutoBackupSettings(): AutoBackupSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUTO_BACKUP_SETTINGS);
      if (!data) {
        const defaultSettings: AutoBackupSettings = {
          enabled: true,
          frequency: 'daily',
          autoSyncTelegram: true,
          encryptData: true,
        };
        localStorage.setItem(STORAGE_KEYS.AUTO_BACKUP_SETTINGS, JSON.stringify(defaultSettings));
        return defaultSettings;
      }
      return JSON.parse(data);
    } catch {
      return {
        enabled: true,
        frequency: 'daily',
        autoSyncTelegram: true,
        encryptData: true,
      };
    }
  },

  saveAutoBackupSettings(settings: AutoBackupSettings): void {
    localStorage.setItem(STORAGE_KEYS.AUTO_BACKUP_SETTINGS, JSON.stringify(settings));
  },

  isAuthenticated(): boolean {
    try {
      return localStorage.getItem('docutrack_auth_session_v1') === 'true';
    } catch {
      return false;
    }
  },

  login(user: CurrentUser): void {
    localStorage.setItem('docutrack_auth_session_v1', 'true');
    this.saveCurrentUser(user);
    this.addAuditLog('ចូលប្រើប្រព័ន្ធ (Sign In)', `អ្នកប្រើប្រាស់ ${user.name} (${user.role}) បានចូលប្រើប្រព័ន្ធ`, user);
  },

  logout(): void {
    const user = this.getCurrentUser();
    this.addAuditLog('ចាកចេញពីប្រព័ន្ធ (Sign Out)', `អ្នកប្រើប្រាស់ ${user.name} បានចាកចេញពីប្រព័ន្ធ`, user);
    localStorage.removeItem('docutrack_auth_session_v1');
  },

  // ----------------- User Management & Quota (Max 10) -----------------
  getUsers(): UserAccount[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
        return INITIAL_USERS;
      }
      const parsed: UserAccount[] = JSON.parse(data);
      // Clean out removed demo accounts
      const cleaned = parsed.filter(u => u.username !== 'director' && u.username !== 'officer');
      if (!cleaned.some(u => u.username === 'vattanak')) {
        cleaned.unshift(INITIAL_USERS[0]);
      }
      return cleaned;
    } catch {
      return INITIAL_USERS;
    }
  },

  saveUsers(users: UserAccount[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (e) {
      console.warn('Failed to save users to local storage', e);
    }
  },

  async fetchRemoteUsers(): Promise<{ users: UserAccount[]; maxUsers: number; activeCount: number; pendingCount: number } | null> {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) return null;
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        this.saveUsers(json.data);
        return {
          users: json.data,
          maxUsers: json.maxUsers || 10,
          activeCount: json.activeCount || 0,
          pendingCount: json.pendingCount || 0
        };
      }
      return null;
    } catch {
      return null;
    }
  },

  async registerUser(userData: {
    name: string;
    username: string;
    email: string;
    password: string;
    role?: 'director' | 'officer';
    department?: string;
    notes?: string;
  }): Promise<{ success: boolean; message: string; user?: any; error?: string }> {
    try {
      const res = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'បរាជ័យក្នុងការស្នើសុំចុះឈ្មោះ!', error: data.error };
      }
      return { success: true, message: data.message, user: data.user };
    } catch (err: any) {
      // Local fallback
      const localUsers = this.getUsers();
      const normalizedUser = userData.username.trim().toLowerCase();
      if (localUsers.some(u => u.username.toLowerCase() === normalizedUser)) {
        return { success: false, message: 'ឈ្មោះគណនីនេះមានរួចហើយ!', error: 'DUPLICATE' };
      }
      const newUser: UserAccount = {
        id: `usr-reg-${Date.now()}`,
        name: userData.name,
        username: normalizedUser,
        email: userData.email,
        password: userData.password,
        role: userData.role || 'officer',
        department: userData.department || 'ការិយាល័យរដ្ឋបាល',
        status: 'pending',
        requestedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        notes: userData.notes || 'ស្នើសុំចុះឈ្មោះប្រើប្រាស់'
      };
      this.saveUsers([newUser, ...localUsers]);
      return { success: true, message: 'បានបញ្ជូនសំណើសុំចុះឈ្មោះជោគជ័យ! សូមរង់ចាំ Owner អនុម័ត។' };
    }
  },

  async approveUser(userId: string, approvedBy = 'លោក ហេង វឌ្ឍនៈ'): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      const res = await fetch('/api/users/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, approvedBy })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'បរាជ័យក្នុងការអនុម័ត' };
      }
      return { success: true, message: data.message };
    } catch {
      // Local fallback
      const localUsers = this.getUsers();
      const activeCount = localUsers.filter(u => u.status === 'active').length;
      if (activeCount >= 10) {
        return { success: false, error: 'មិនអាចអនុម័តបានទេ ព្រោះចំនួនអ្នកប្រើប្រាស់ពេញកម្រិតកំណត់ (១០នាក់) រួចហើយ!' };
      }
      const updated = localUsers.map(u => u.id === userId ? { ...u, status: 'active' as const, approvedAt: new Date().toISOString() } : u);
      this.saveUsers(updated);
      return { success: true, message: 'បានអនុម័តជោគជ័យ' };
    }
  },

  async rejectUser(userId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/users/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, reason })
      });
      const data = await res.json();
      return { success: res.ok, error: data.error };
    } catch {
      const localUsers = this.getUsers();
      const updated = localUsers.map(u => u.id === userId ? { ...u, status: 'rejected' as const, rejectionReason: reason } : u);
      this.saveUsers(updated);
      return { success: true };
    }
  },

  async createUserDirect(userData: {
    name: string;
    username: string;
    email: string;
    password: string;
    role: 'director' | 'officer';
    department: string;
    title?: string;
  }): Promise<{ success: boolean; error?: string; user?: any }> {
    try {
      const res = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error };
      }
      return { success: true, user: data.user };
    } catch {
      const localUsers = this.getUsers();
      const activeCount = localUsers.filter(u => u.status === 'active').length;
      if (activeCount >= 10) {
        return { success: false, error: 'ចំនួនអ្នកប្រើប្រាស់សកម្មបានពេញកម្រិតកំណត់ ១០ នាក់រួចហើយ!' };
      }
      const newUser: UserAccount = {
        id: `usr-direct-${Date.now()}`,
        name: userData.name,
        username: userData.username.toLowerCase(),
        email: userData.email,
        password: userData.password,
        role: userData.role,
        department: userData.department,
        status: 'active',
        requestedAt: new Date().toISOString(),
        approvedAt: new Date().toISOString(),
        approvedBy: 'លោក ហេង វឌ្ឍនៈ (Owner)'
      };
      this.saveUsers([...localUsers, newUser]);
      return { success: true, user: newUser };
    }
  },

  async deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      return { success: true };
    } catch {
      const localUsers = this.getUsers().filter(u => u.id !== userId);
      this.saveUsers(localUsers);
      return { success: true };
    }
  }
};
