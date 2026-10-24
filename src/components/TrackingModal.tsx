import React, { useState, useEffect } from 'react';
import { DocumentItem, DocumentStatus, DocumentAttachment } from '../types/document';
import { AttachmentStorageService } from '../services/attachmentStorageService';
import { TelegramService } from '../services/telegramService';
import { StorageService } from '../services/storageService';
import { AttachmentPreviewModal } from './AttachmentPreviewModal';
import QRCode from 'qrcode';
import {
  X,
  Printer,
  CheckCircle2,
  Lock,
  Unlock,
  Copy,
  Check,
  Building2,
  Calendar,
  AlertTriangle,
  Paperclip,
  Download,
  Eye,
  Music,
  Image as ImageIcon,
  FileText,
  Send,
  Loader2
} from 'lucide-react';

interface TrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem | null;
  onPrintDocument: (doc: DocumentItem) => void;
}

const WORKFLOW_STAGES: { status: DocumentStatus; title: string }[] = [
  { status: 'received', title: 'បានទទួល' },
  { status: 'reviewing', title: 'កំពុងពិនិត្យ' },
  { status: 'forwarded_leader', title: 'ឆ្លងថ្នាក់ដឹកនាំ' },
  { status: 'approved', title: 'បានឯកភាព' },
  { status: 'dispatched', title: 'បានបញ្ជូនបន្ត' },
  { status: 'completed', title: 'បានបញ្ចប់' },
  { status: 'archived', title: 'តម្កល់ទុក' },
];

export const TrackingModal: React.FC<TrackingModalProps> = ({
  isOpen,
  onClose,
  document,
  onPrintDocument,
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<DocumentAttachment | null>(null);
  const [sendingAttId, setSendingAttId] = useState<string | null>(null);
  const [sendingAll, setSendingAll] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<{ message: string; isError: boolean } | null>(null);

  const handleSendSingleAttachment = async (att: DocumentAttachment) => {
    if (!document) return;
    setSendingAttId(att.id);
    setTelegramStatus(null);
    const config = StorageService.getTelegramConfig();
    const res = await TelegramService.sendAttachmentToTelegram(att, document, config);
    setSendingAttId(null);
    setTelegramStatus({ message: res.message, isError: !res.success });
    setTimeout(() => setTelegramStatus(null), 5000);
  };

  const handleSendAllAttachments = async () => {
    if (!document) return;
    setSendingAll(true);
    setTelegramStatus(null);
    const config = StorageService.getTelegramConfig();
    const res = await TelegramService.sendAllAttachmentsToTelegram(document, config);
    setSendingAll(false);
    setTelegramStatus({ message: res.message, isError: !res.success });
    setTimeout(() => setTelegramStatus(null), 6000);
  };

  useEffect(() => {
    if (document) {
      // Generate QR Code data
      const trackingPayload = JSON.stringify({
        code: document.trackingCode,
        num: document.letterNumber,
        type: document.docType,
        verified: true,
        issued: document.dateReceivedOrIssued,
        sender: document.sender,
        url: `${window.location.origin}/?track=${document.trackingCode}`
      });

      QRCode.toDataURL(trackingPayload, {
        width: 180,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error('Error generating QR', err));

      // Check if unlocked by default
      if (document.confidentiality === 'public' || !document.securityPin) {
        setIsUnlocked(true);
      } else {
        setIsUnlocked(false);
      }
      setPinInput('');
      setPinError(false);
    }
  }, [document, isOpen]);

  if (!isOpen || !document) return null;

  const handleCopyLink = () => {
    const link = `${window.location.origin}/?track=${document.trackingCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUnlockPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === (document.securityPin || '1234')) {
      setIsUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  // Find current step index
  const currentStageIndex = WORKFLOW_STAGES.findIndex((s) => s.status === document.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold">
              QR
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                ផ្ទៀងផ្ទាត់ & តាមដានលិខិតរដ្ឋបាល
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span>កូដតាមដាន៖</span>
                <span className="font-mono font-bold text-blue-900">{document.trackingCode}</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> ឯកសារមានសុពលភាពផ្លូវការ
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Top Info Card with QR code */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl border border-slate-200 bg-slate-50/60">
            {/* QR Code */}
            <div className="shrink-0 flex flex-col items-center bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt={`QR for ${document.trackingCode}`}
                  className="w-36 h-36"
                />
              ) : (
                <div className="w-36 h-36 bg-slate-100 flex items-center justify-center text-slate-400">
                  កំពុងបង្កើត QR...
                </div>
              )}
              <span className="text-[10px] text-slate-500 mt-1 font-mono">{document.trackingCode}</span>
            </div>

            {/* Document key details */}
            <div className="flex-1 w-full space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">លេខលិខិតផ្លូវការ៖</span>
                <span className="font-bold text-slate-900 text-sm">{document.letterNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">ប្រភេទឯកសារ៖</span>
                <span className="font-medium text-slate-800">{document.docType} ({document.direction === 'in' ? 'លិខិតចូល' : 'លិខិតចេញ'})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">ស្ថាប័នបញ្ជូន៖</span>
                <span className="font-medium text-slate-800">{document.sender}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">ស្ថាប័ន/បុគ្គលទទួល៖</span>
                <span className="font-medium text-slate-800">{document.receiver}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">កាលបរិច្ឆេទចុះបញ្ជី៖</span>
                <span className="font-mono tabular-nums text-slate-800">{document.dateReceivedOrIssued}</span>
              </div>
              {document.deadline && (
                <div className="flex items-center justify-between text-rose-700">
                  <span className="font-medium">កាលបរិច្ឆេទកំណត់ (Deadline)៖</span>
                  <span className="font-mono tabular-nums font-bold">{document.deadline}</span>
                </div>
              )}
            </div>
          </div>

          {/* Subject banner */}
          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-slate-800">
            <div className="text-[11px] font-semibold text-blue-900 mb-0.5">កម្មវត្ថុផ្លូវការ</div>
            <div className="text-sm font-medium text-slate-900 leading-relaxed">{document.subject}</div>
            {document.summary && (
              <div className="text-xs text-slate-600 mt-1.5">{document.summary}</div>
            )}
          </div>

          {/* Visual Step Progress Bar */}
          <div>
            <h3 className="text-xs font-semibold text-slate-700 mb-3">ដំណាក់កាលចរាចរលិខិតបច្ចុប្បន្ន</h3>
            <div className="grid grid-cols-7 gap-1">
              {WORKFLOW_STAGES.map((stage, idx) => {
                const isPassed = currentStageIndex >= idx;
                const isCurrent = currentStageIndex === idx;

                return (
                  <div key={stage.status} className="flex flex-col items-center text-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                        isCurrent
                          ? 'bg-blue-900 text-white ring-4 ring-blue-100'
                          : isPassed
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span
                      className={`text-[10px] mt-1.5 leading-tight ${
                        isCurrent
                          ? 'font-bold text-blue-900'
                          : isPassed
                          ? 'font-medium text-slate-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {stage.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Security PIN Lock Section (for confidential documents) */}
          {!isUnlocked && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs">
                <Lock className="w-4 h-4 text-amber-700" />
                <span>ឯកសារនេះជាប្រភេទសម្ងាត់ ({document.confidentiality})</span>
              </div>
              <p className="text-[11px] text-amber-800">
                ដើម្បីការពារសុវត្ថិភាពរដ្ឋបាល សូមបញ្ចូលកូដ PIN សម្ងាត់ដើម្បីពិនិត្យមើលចំណារផ្ទៃក្នុង និងឯកសារភ្ជាប់ (កូដ PIN សាកល្បង៖ {document.securityPin || '1234'})។
              </p>
              <form onSubmit={handleUnlockPin} className="flex items-center gap-2">
                <input
                  type="password"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="បញ្ចូល PIN សម្ងាត់..."
                  className="px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono w-44 focus:ring-1 focus:ring-amber-600 text-slate-800"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-amber-700 text-white rounded-lg font-medium hover:bg-amber-800 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>ផ្ទៀងផ្ទាត់</span>
                </button>
                {pinError && (
                  <span className="text-[11px] text-rose-600 font-medium">កូដ PIN មិនត្រឹមត្រូវ!</span>
                )}
              </form>
            </div>
          )}

          {/* Workflow Routing Audit Timeline (Unlocked) */}
          {isUnlocked && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-slate-800">
                  កំណត់ត្រាដំណាក់កាលចរាចរលម្អិត ({document.workflowLogs.length} ដំណាក់កាល)
                </h3>
                <span className="text-[11px] text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> សុវត្ថិភាពទិន្នន័យបានផ្ទៀងផ្ទាត់
                </span>
              </div>

              <div className="space-y-3 border-l-2 border-blue-200 ml-3 pl-4">
                {document.workflowLogs.map((log) => (
                  <div key={log.id} className="relative group">
                    {/* Circle on timeline line */}
                    <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-blue-900 ring-4 ring-white" />
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="font-bold text-slate-900 text-xs">{log.actionTitle}</span>
                        <span className="font-mono tabular-nums text-[11px] text-slate-600">{log.timestamp}</span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        មន្ត្រីទទួលបន្ទុក៖ <span className="font-medium text-slate-800">{log.actorName}</span> ({log.actorRole})
                      </div>
                      {log.notes && (
                        <div className="mt-2 text-xs text-blue-950 bg-white p-2 rounded border border-blue-100 font-medium">
                          📝 ចំណារ៖ "{log.notes}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Attachments list */}
              {document.attachments.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                    <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-blue-900" />
                      <span>ឯកសារភ្ជាប់ផ្លូវការ ({document.attachments.length})</span>
                    </h4>

                    <button
                      type="button"
                      onClick={handleSendAllAttachments}
                      disabled={sendingAll}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      title="រុញឯកសារភ្ជាប់ទាំងអស់ទៅកាន់ Telegram គ្រុប/ឆានែល ដើម្បីទាញយក និងមើល"
                    >
                      {sendingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>{sendingAll ? 'កំពុងរុញ...' : 'រុញឯកសារទាំងអស់ទៅ Telegram'}</span>
                    </button>
                  </div>

                  {telegramStatus && (
                    <div
                      className={`p-2.5 rounded-lg text-xs font-medium mb-3 flex items-center justify-between gap-2 animate-in fade-in ${
                        telegramStatus.isError
                          ? 'bg-rose-50 border border-rose-200 text-rose-800'
                          : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{telegramStatus.message}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTelegramStatus(null)}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {document.attachments.map((att) => {
                      const isImg = att.type.startsWith('image/') || att.name.match(/\.(png|jpg|jpeg|webp)$/i);
                      const isAud = att.type.startsWith('audio/') || att.name.match(/\.(webm|mp3|m4a|wav)$/i);

                      return (
                        <div
                          key={att.id}
                          className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 hover:border-blue-900 transition-colors shadow-2xs"
                        >
                          <div className="flex items-center gap-2 truncate max-w-[50%] sm:max-w-[55%]">
                            <div
                              className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${
                                isImg
                                  ? 'bg-blue-100 text-blue-900'
                                  : isAud
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isImg ? (
                                <ImageIcon className="w-3.5 h-3.5" />
                              ) : isAud ? (
                                <Music className="w-3.5 h-3.5" />
                              ) : (
                                <FileText className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <div className="truncate">
                              <div className="font-semibold text-slate-800 truncate" title={att.name}>{att.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {AttachmentStorageService.formatFileSize(att.size)} · {att.uploadedAt}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {/* Preview button */}
                            <button
                              type="button"
                              onClick={() => setPreviewAttachment(att)}
                              className="px-2 py-1 text-[11px] font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors cursor-pointer inline-flex items-center gap-0.5"
                              title="បើកមើលឯកសារ"
                            >
                              <Eye className="w-3 h-3" />
                              <span>មើល</span>
                            </button>

                            {/* Push to Telegram button */}
                            <button
                              type="button"
                              onClick={() => handleSendSingleAttachment(att)}
                              disabled={sendingAttId === att.id}
                              className="px-2 py-1 text-[11px] font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded transition-colors cursor-pointer inline-flex items-center gap-0.5 disabled:opacity-50"
                              title="រុញឯកសារនេះទៅ Telegram (Download & View)"
                            >
                              {sendingAttId === att.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Send className="w-3 h-3" />
                              )}
                              <span>Telegram</span>
                            </button>

                            {/* Download button */}
                            <button
                              type="button"
                              onClick={() => {
                                if (att.dataUrl) {
                                  AttachmentStorageService.downloadFile(att.name, att.dataUrl);
                                } else {
                                  setPreviewAttachment(att);
                                }
                              }}
                              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                              title="ទាញយកឯកសារទៅក្នុងកុំព្យូទ័រ"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 text-xs text-slate-700 hover:text-blue-900 font-medium cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'បានចម្លងតំណភ្ជាប់ជោគជ័យ!' : 'ចម្លងតំណភ្ជាប់តាមដាន'}</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onClose();
                onPrintDocument(document);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>បោះពុម្ពប័ណ្ណតាមដាន</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition-colors cursor-pointer"
            >
              បិទផ្ទាំង
            </button>
          </div>
        </div>

        {/* Attachment Full Preview Modal */}
        <AttachmentPreviewModal
          isOpen={!!previewAttachment}
          onClose={() => setPreviewAttachment(null)}
          attachment={previewAttachment}
          documentTitle={document.subject}
          document={document}
        />
      </div>
    </div>
  );
};
