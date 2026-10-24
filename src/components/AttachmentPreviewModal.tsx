import React, { useState, useEffect } from 'react';
import { DocumentAttachment, DocumentItem } from '../types/document';
import { AttachmentStorageService } from '../services/attachmentStorageService';
import { TelegramService } from '../services/telegramService';
import { StorageService } from '../services/storageService';
import {
  X,
  Download,
  FileText,
  Image as ImageIcon,
  Music,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ExternalLink,
  Calendar,
  HardDrive,
  Send,
  Loader2,
  Check
} from 'lucide-react';

interface AttachmentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachment: DocumentAttachment | null;
  documentTitle?: string;
  document?: DocumentItem | null;
}

export const AttachmentPreviewModal: React.FC<AttachmentPreviewModalProps> = ({
  isOpen,
  onClose,
  attachment,
  documentTitle = 'ឯកសាររដ្ឋបាល',
  document = null,
}) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [sendingTelegram, setSendingTelegram] = useState(false);
  const [telegramFeedback, setTelegramFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !attachment) {
      setDataUrl(null);
      setZoomLevel(1);
      setRotation(0);
      return;
    }

    const loadData = async () => {
      // If already has dataUrl
      if (attachment.dataUrl) {
        setDataUrl(attachment.dataUrl);
        return;
      }

      // Check IndexedDB
      if (attachment.blobId) {
        setLoading(true);
        const stored = await AttachmentStorageService.getLargeFile(attachment.blobId);
        setDataUrl(stored);
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, attachment]);

  if (!isOpen || !attachment) return null;

  const isImage =
    attachment.type.startsWith('image/') ||
    attachment.name.match(/\.(png|jpg|jpeg|webp|gif)$/i) ||
    attachment.category === 'photo';

  const isPDF =
    attachment.type.includes('pdf') ||
    attachment.name.toLowerCase().endsWith('.pdf');

  const isAudio =
    attachment.type.startsWith('audio/') ||
    attachment.name.match(/\.(mp3|wav|ogg|webm|m4a)$/i) ||
    attachment.category === 'audio';

  const handleDownload = () => {
    if (dataUrl) {
      AttachmentStorageService.downloadFile(attachment.name, dataUrl);
    } else {
      // Fallback download if no direct dataUrl
      const blob = new Blob([`Official Document: ${attachment.name}`], { type: attachment.type });
      const url = URL.createObjectURL(blob);
      AttachmentStorageService.downloadFile(attachment.name, url);
    }
  };

  const handlePushToTelegram = async () => {
    setSendingTelegram(true);
    setTelegramFeedback(null);
    const config = StorageService.getTelegramConfig();
    const docToUse: DocumentItem = document || {
      id: 'preview-doc',
      trackingCode: 'DOC-OFFICIAL',
      direction: 'in',
      letterNumber: '---',
      subject: documentTitle || attachment.name,
      docType: 'លិខិតស្នើ',
      sender: 'ស្ថាប័នរដ្ឋបាល',
      receiver: 'មន្ត្រីរដ្ឋបាល',
      dateReceivedOrIssued: new Date().toISOString().split('T')[0],
      priority: 'normal',
      confidentiality: 'internal',
      status: 'approved',
      assignedDepartment: 'នាយកដ្ឋានរដ្ឋបាល',
      assignedOfficer: 'មន្ត្រីរដ្ឋបាល',
      attachments: [attachment],
      workflowLogs: [],
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const res = await TelegramService.sendAttachmentToTelegram(attachment, docToUse, config);
    setSendingTelegram(false);
    setTelegramFeedback(res.message);
    setTimeout(() => setTelegramFeedback(null), 5000);
  };

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.25, 0.5));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3 truncate max-w-[60%] sm:max-w-[70%]">
            <div className="w-9 h-9 rounded-lg bg-blue-900 text-white flex items-center justify-center shrink-0">
              {isImage ? (
                <ImageIcon className="w-4 h-4" />
              ) : isAudio ? (
                <Music className="w-4 h-4" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
            </div>
            <div className="truncate">
              <h3 className="text-sm font-bold text-slate-900 truncate">
                {attachment.name}
              </h3>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                <span>{AttachmentStorageService.formatFileSize(attachment.size)}</span>
                <span aria-hidden="true">·</span>
                <span>{attachment.uploadedAt}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Action: Push to Telegram */}
            <button
              onClick={handlePushToTelegram}
              disabled={sendingTelegram}
              className="px-3 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-semibold hover:bg-sky-500 transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              title="រុញឯកសារនេះទៅ Telegram ដើម្បីទាញយក និងមើល"
            >
              {sendingTelegram ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {sendingTelegram ? 'កំពុងរុញ...' : 'រុញទៅ Telegram'}
              </span>
            </button>

            {/* Quick Action: Download */}
            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 bg-blue-900 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ទាញយកឯកសារ (Download)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Telegram Feedback Banner */}
        {telegramFeedback && (
          <div className="px-5 py-2 bg-sky-50 border-b border-sky-100 flex items-center justify-between text-xs font-medium text-sky-900 animate-in fade-in">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{telegramFeedback}</span>
            </div>
            <button onClick={() => setTelegramFeedback(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Viewport Center */}
        <div className="flex-1 bg-slate-900/90 flex items-center justify-center min-h-[380px] max-h-[65vh] overflow-auto p-4 relative select-none">
          {loading ? (
            <div className="text-white text-xs flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>កំពុងទាញយកឯកសារទំហំធំពី IndexedDB...</span>
            </div>
          ) : isImage ? (
            dataUrl ? (
              <div className="flex items-center justify-center w-full h-full overflow-hidden">
                <img
                  src={dataUrl}
                  alt={attachment.name}
                  style={{
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                    transition: 'transform 0.15s ease-out'
                  }}
                  className="max-h-[55vh] max-w-full object-contain rounded-lg shadow-lg"
                />
              </div>
            ) : (
              <div className="text-center text-slate-400 text-xs">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>រូបភាពមិនមានទិន្នន័យ Preview ឡើយ</p>
              </div>
            )
          ) : isAudio ? (
            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 max-w-md w-full text-center space-y-5 shadow-xl">
              <div className="w-16 h-16 rounded-full bg-rose-600 text-white flex items-center justify-center mx-auto shadow-md">
                <Music className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-white mb-1">
                  {attachment.name}
                </h4>
                <p className="text-xs text-slate-400">
                  សំឡេងចំណារផ្លូវការ · {AttachmentStorageService.formatFileSize(attachment.size)}
                </p>
              </div>

              {dataUrl && (
                <div className="pt-2">
                  <audio
                    controls
                    src={dataUrl}
                    className="w-full focus:outline-none"
                    autoPlay={false}
                  />
                </div>
              )}
            </div>
          ) : isPDF ? (
            dataUrl ? (
              <div className="w-full h-full flex flex-col items-center">
                <iframe
                  src={dataUrl}
                  title={attachment.name}
                  className="w-full h-[58vh] rounded-lg border border-slate-700 bg-white"
                />
              </div>
            ) : (
              <div className="text-center text-slate-300 p-8 bg-slate-800 rounded-xl max-w-md space-y-4">
                <FileText className="w-12 h-12 text-rose-500 mx-auto" />
                <div>
                  <h4 className="text-sm font-bold text-white">{attachment.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">ឯកសារប្រភេទ PDF (Adobe Acrobat)</p>
                </div>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 cursor-pointer inline-flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>ទាញយកដើម្បីបើកមើលលើឧបករណ៍</span>
                </button>
              </div>
            )
          ) : (
            <div className="text-center text-slate-300 p-8 bg-slate-800 rounded-xl max-w-md space-y-4">
              <FileText className="w-12 h-12 text-blue-400 mx-auto" />
              <div>
                <h4 className="text-sm font-bold text-white">{attachment.name}</h4>
                <p className="text-xs text-slate-400 mt-1">
                  ទំហំ: {AttachmentStorageService.formatFileSize(attachment.size)}
                </p>
              </div>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 cursor-pointer inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>ទាញយកឯកសារ (Download)</span>
              </button>
            </div>
          )}

          {/* Image Toolbar Floating Overlay */}
          {isImage && dataUrl && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700 flex items-center gap-3 text-white text-xs">
              <button
                onClick={handleZoomOut}
                title="Zoom Out"
                className="p-1 hover:text-blue-400 cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="font-mono text-[11px] min-w-[40px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                title="Zoom In"
                className="p-1 hover:text-blue-400 cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-slate-700" />
              <button
                onClick={handleRotate}
                title="Rotate 90deg"
                className="p-1 hover:text-blue-400 cursor-pointer"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Footer Details */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-slate-800">ឯកសារនៃលិខិត៖</span>
            <span className="text-slate-600 truncate">{documentTitle}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium cursor-pointer"
            >
              បិទផ្ទាំង
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
