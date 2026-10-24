import { DocumentItem, BackupRecord, CurrentUser } from '../types/document';
import { StorageService } from './storageService';
import { TelegramService } from './telegramService';

export interface BackupPayload {
  version: string;
  systemName: string;
  exportedAt: string;
  checksum: string;
  documentCount: number;
  documents: DocumentItem[];
  settings: Record<string, unknown>;
}

// Simple checksum generator for data integrity check
function calculateChecksum(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `SHA-${hex.toUpperCase()}`;
}

export const BackupService = {
  async createBackupSnapshot(
    destination: BackupRecord['destination'] = 'automated_schedule',
    user: CurrentUser,
    notes?: string
  ): Promise<{ success: boolean; record: BackupRecord; payload: BackupPayload }> {
    const documents = StorageService.getDocuments();
    const telegramConfig = StorageService.getTelegramConfig();
    const autoSettings = StorageService.getAutoBackupSettings();

    const timestamp = new Date().toISOString();
    const rawContent = JSON.stringify(documents);
    const checksum = calculateChecksum(rawContent + timestamp);
    const sizeBytes = new Blob([rawContent]).size;
    const backupId = `BKP-${Date.now().toString().slice(-6)}`;

    const payload: BackupPayload = {
      version: '1.0.0',
      systemName: 'DocuTrack Khmer Administration System',
      exportedAt: timestamp,
      checksum,
      documentCount: documents.length,
      documents,
      settings: {
        telegram: {
          enabled: telegramConfig.enabled,
          channelId: telegramConfig.channelId,
          notifyOnNewDoc: telegramConfig.notifyOnNewDoc,
          notifyOnStatusChange: telegramConfig.notifyOnStatusChange,
        },
        autoBackup: autoSettings
      }
    };

    const record: BackupRecord = {
      id: backupId,
      timestamp: new Date().toLocaleDateString('en-CA') + ' ' + new Date().toLocaleTimeString('km-KH'),
      checksum,
      documentCount: documents.length,
      sizeBytes,
      destination,
      status: 'success',
      notes: notes || `បម្រុងទុកទិន្នន័យស្វ័យប្រវត្តិចំនួន ${documents.length} ឯកសារ`
    };

    // Save record to persistent storage
    StorageService.addBackupRecord(record);
    StorageService.addAuditLog('បម្រុងទុកទិន្នន័យ (Cloud Backup)', `បង្កើត Snapshot ${backupId} (${documents.length} ឯកសារ, ${sizeBytes} bytes)`, user);

    // If Telegram sync is enabled in auto settings, notify Telegram
    if (autoSettings.autoSyncTelegram && telegramConfig.enabled) {
      await TelegramService.notifyBackupComplete(backupId, documents.length, sizeBytes);
    }

    // Update last backup time
    autoSettings.lastBackupTime = new Date().toLocaleDateString('en-CA') + ' ' + new Date().toLocaleTimeString('km-KH');
    StorageService.saveAutoBackupSettings(autoSettings);

    return { success: true, record, payload };
  },

  downloadBackupFile(payload: BackupPayload): void {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `DocuTrack_Backup_${dateStr}_${payload.checksum.slice(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  async restoreFromJSON(
    jsonString: string,
    user: CurrentUser,
    mode: 'overwrite' | 'merge' = 'overwrite'
  ): Promise<{ success: boolean; message: string; restoredCount: number }> {
    try {
      const parsed = JSON.parse(jsonString) as BackupPayload;
      if (!parsed.documents || !Array.isArray(parsed.documents)) {
        return { success: false, message: 'ទម្រង់ទិន្នន័យបម្រុងទុកមិនត្រឹមត្រូវ (Missing documents array)', restoredCount: 0 };
      }

      let finalDocs: DocumentItem[] = [];
      if (mode === 'overwrite') {
        finalDocs = parsed.documents;
      } else {
        // Merge mode: existing + new, duplicate id updated
        const existing = StorageService.getDocuments();
        const map = new Map<string, DocumentItem>();
        existing.forEach(d => map.set(d.id, d));
        parsed.documents.forEach(d => map.set(d.id, d));
        finalDocs = Array.from(map.values());
      }

      StorageService.saveDocuments(finalDocs);
      StorageService.addAuditLog(
        'ទាញយកទិន្នន័យមកវិញ (Data Restore)',
        `បានទាញយកទិន្នន័យពី Snapshot ${parsed.checksum || 'Manual'} (${finalDocs.length} ឯកសារ, របៀប: ${mode === 'overwrite' ? 'ជំនួសទាំងអស់' : 'បញ្ចូលរួមគ្នា'})`,
        user
      );

      return {
        success: true,
        message: `បានទាញយកទិន្នន័យជោគជ័យ! បច្ចុប្បន្នមានលិខិតសរុប ${finalDocs.length} ឯកសារក្នុងប្រព័ន្ធ។`,
        restoredCount: finalDocs.length
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown parse error';
      return { success: false, message: `មិនអាចទាញយកទិន្នន័យបានឡើយ៖ ${errMsg}`, restoredCount: 0 };
    }
  }
};
