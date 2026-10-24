export type DocumentDirection = 'in' | 'out';

export type DocumentType =
  | 'សារាចរ'
  | 'ប្រកាស'
  | 'លិខិតអញ្ជើញ'
  | 'លិខិតបង្គាប់ការ'
  | 'លិខិតឆ្លើយឆ្លង'
  | 'របាយការណ៍'
  | 'កិច្ចសន្យា'
  | 'លិខិតអនុញ្ញាត'
  | 'លិខិតស្នើ'
  | 'សេចក្តីជូនដំណឹង'
  | 'លិខិតអនុញ្ញាតច្បាប់ឈប់សម្រាក'
  | 'លិខិតបញ្ជាបេសកកម្ម'
  | 'ទិដ្ឋាការធ្វើដំណើរ'
  | 'ផ្សេងៗ';

export type PriorityLevel = 'normal' | 'urgent' | 'top_urgent';
export type ConfidentialityLevel = 'public' | 'internal' | 'confidential' | 'top_secret';

export type DocumentStatus =
  | 'received'          // បានទទួល / ចុះបញ្ជី
  | 'reviewing'         // កំពុងត្រួតពិនិត្យ
  | 'forwarded_leader'  // ឆ្លងថ្នាក់ដឹកនាំ
  | 'approved'          // បានឯកភាព/ចុះហត្ថលេខា
  | 'dispatched'        // បានបញ្ជូនបន្តអនុវត្ត
  | 'completed'         // បានបញ្ចប់
  | 'archived';         // បានតម្កល់ទុក

export interface WorkflowStep {
  id: string;
  timestamp: string;
  status: DocumentStatus;
  actorName: string;
  actorRole: string;
  actionTitle: string;
  notes?: string;
}

export interface DocumentAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  dataUrl?: string;
  blobId?: string;
  category?: 'photo' | 'audio' | 'document';
}

export interface DocumentItem {
  id: string;
  trackingCode: string; // e.g. DOC-2026-IN-0089
  direction: DocumentDirection;
  letterNumber: string; // e.g. ០៤៥/២៦ សរណ
  inOutBookNumber?: string; // លេខសៀវភៅបញ្ជីចូល-ចេញ
  subject: string; // កម្មវត្ថុ
  summary?: string; // ខ្លឹមសារសង្ខេប
  docType: DocumentType;
  sender: string; // អង្គភាព/ក្រសួងផ្ញើ
  receiver: string; // អង្គភាព/បុគ្គលទទួល
  dateReceivedOrIssued: string; // YYYY-MM-DD
  deadline?: string; // YYYY-MM-DD
  priority: PriorityLevel;
  confidentiality: ConfidentialityLevel;
  status: DocumentStatus;
  assignedDepartment: string;
  assignedOfficer: string;
  securityPin?: string; // For protected confidential docs
  attachments: DocumentAttachment[];
  workflowLogs: WorkflowStep[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TelegramConfig {
  enabled: boolean;
  botToken: string;
  chatId: string;
  channelId?: string;
  notifyOnNewDoc: boolean;
  notifyOnStatusChange: boolean;
  notifyOnUrgent: boolean;
  notifyOnBackup: boolean;
  includeAttachmentsInTelegram?: boolean;
  lastTestStatus?: 'success' | 'failed' | 'untested';
  lastTestMessage?: string;
  lastTestTimestamp?: string;
}

export interface TelegramMessageLog {
  id: string;
  timestamp: string;
  documentTrackingCode?: string;
  messageType: 'new_doc' | 'status_update' | 'urgent_reminder' | 'backup_completed' | 'attachment_file' | 'test';
  content: string;
  status: 'sent' | 'failed' | 'simulated';
  chatIdTarget: string;
}

export interface BackupRecord {
  id: string;
  timestamp: string;
  checksum: string;
  documentCount: number;
  sizeBytes: number;
  destination: 'local_storage' | 'cloud_download' | 'telegram_sync' | 'automated_schedule';
  status: 'success' | 'failed';
  notes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  action: string;
  targetId?: string;
  details: string;
}

export type UserRole = 'admin' | 'director' | 'officer';

export interface CurrentUser {
  id: string;
  name: string;
  role: UserRole;
  department: string;
  email?: string;
  username?: string;
  lastLogin?: string;
}
