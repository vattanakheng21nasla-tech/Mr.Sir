import { DocumentItem, TelegramConfig, TelegramMessageLog, BackupRecord, AuditLog, CurrentUser } from '../types/document';
import { INITIAL_DOCUMENTS, INITIAL_TELEGRAM_CONFIG, CURRENT_OFFICER_USER } from '../data/initialDocuments';

const STORAGE_KEYS = {
  DOCUMENTS: 'docutrack_documents_v1',
  TELEGRAM_CONFIG: 'docutrack_telegram_config_v1',
  TELEGRAM_LOGS: 'docutrack_telegram_logs_v1',
  BACKUP_RECORDS: 'docutrack_backup_records_v1',
  AUDIT_LOGS: 'docutrack_audit_logs_v1',
  CURRENT_USER: 'docutrack_current_user_v1',
  AUTO_BACKUP_SETTINGS: 'docutrack_auto_backup_settings_v1',
};

export interface AutoBackupSettings {
  enabled: boolean;
  frequency: 'change' | 'hourly' | 'daily';
  lastBackupTime?: string;
  autoSyncTelegram: boolean;
  encryptData: boolean;
}

export const StorageService = {
  getDocuments(): DocumentItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(INITIAL_DOCUMENTS));
        return INITIAL_DOCUMENTS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_DOCUMENTS;
    }
  },

  saveDocuments(docs: DocumentItem[]): void {
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
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
  },

  getCurrentUser(): CurrentUser {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : CURRENT_OFFICER_USER;
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
  }
};
