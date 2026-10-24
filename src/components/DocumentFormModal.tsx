import React, { useState, useEffect } from 'react';
import {
  DocumentItem,
  DocumentDirection,
  DocumentType,
  PriorityLevel,
  ConfidentialityLevel,
  DocumentAttachment
} from '../types/document';
import { AttachmentStorageService } from '../services/attachmentStorageService';
import { CameraCaptureModal } from './CameraCaptureModal';
import { AudioRecordModal } from './AudioRecordModal';
import { AttachmentPreviewModal } from './AttachmentPreviewModal';
import {
  X,
  Upload,
  Trash2,
  Send,
  Lock,
  Camera,
  Mic,
  Eye,
  Download,
  FileText,
  Music,
  Image as ImageIcon
} from 'lucide-react';

interface DocumentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (doc: DocumentItem, sendTelegram: boolean) => void;
  editingDoc?: DocumentItem | null;
  defaultDirection?: DocumentDirection;
}

export const DocumentFormModal: React.FC<DocumentFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingDoc,
  defaultDirection = 'in',
}) => {
  const [direction, setDirection] = useState<DocumentDirection>(defaultDirection);
  const [trackingCode, setTrackingCode] = useState('');
  const [letterNumber, setLetterNumber] = useState('');
  const [inOutBookNumber, setInOutBookNumber] = useState('');
  const [subject, setSubject] = useState('');
  const [summary, setSummary] = useState('');
  const [docType, setDocType] = useState<DocumentType>('លិខិតឆ្លើយឆ្លង');
  const [sender, setSender] = useState('');
  const [receiver, setReceiver] = useState('');
  const [dateReceivedOrIssued, setDateReceivedOrIssued] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('normal');
  const [confidentiality, setConfidentiality] = useState<ConfidentialityLevel>('public');
  const [assignedDepartment, setAssignedDepartment] = useState('នាយកដ្ឋានរដ្ឋបាល');
  const [assignedOfficer, setAssignedOfficer] = useState('');
  const [securityPin, setSecurityPin] = useState('');
  const [attachments, setAttachments] = useState<DocumentAttachment[]>([]);
  const [sendTelegramAlert, setSendTelegramAlert] = useState(true);

  // New media modal states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAudioOpen, setIsAudioOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<DocumentAttachment | null>(null);

  // Initialize or reset form
  useEffect(() => {
    if (editingDoc) {
      setDirection(editingDoc.direction);
      setTrackingCode(editingDoc.trackingCode);
      setLetterNumber(editingDoc.letterNumber);
      setInOutBookNumber(editingDoc.inOutBookNumber || '');
      setSubject(editingDoc.subject);
      setSummary(editingDoc.summary || '');
      setDocType(editingDoc.docType);
      setSender(editingDoc.sender);
      setReceiver(editingDoc.receiver);
      setDateReceivedOrIssued(editingDoc.dateReceivedOrIssued);
      setDeadline(editingDoc.deadline || '');
      setPriority(editingDoc.priority);
      setConfidentiality(editingDoc.confidentiality);
      setAssignedDepartment(editingDoc.assignedDepartment);
      setAssignedOfficer(editingDoc.assignedOfficer);
      setSecurityPin(editingDoc.securityPin || '');
      setAttachments(editingDoc.attachments || []);
    } else {
      const year = new Date().getFullYear();
      const randomSeq = Math.floor(1000 + Math.random() * 9000);
      const code = `DOC-${year}-${defaultDirection.toUpperCase()}-${randomSeq}`;
      const today = new Date().toISOString().slice(0, 10);

      setDirection(defaultDirection);
      setTrackingCode(code);
      setLetterNumber('');
      setInOutBookNumber('');
      setSubject('');
      setSummary('');
      setDocType(defaultDirection === 'in' ? 'លិខិតអញ្ជើញ' : 'លិខិតឆ្លើយឆ្លង');
      setSender(defaultDirection === 'in' ? '' : 'អគ្គនាយកដ្ឋានរដ្ឋបាល និងហិរញ្ញវត្ថុ');
      setReceiver(defaultDirection === 'in' ? 'អគ្គនាយកដ្ឋានរដ្ឋបាល និងហិរញ្ញវត្ថុ' : '');
      setDateReceivedOrIssued(today);
      setDeadline('');
      setPriority('normal');
      setConfidentiality('public');
      setAssignedDepartment('នាយកដ្ឋានរដ្ឋបាល');
      setAssignedOfficer('លោក វ៉ាន់ សុវណ្ណារ៉ា');
      setSecurityPin('');
      setAttachments([]);
      setSendTelegramAlert(true);
    }
  }, [editingDoc, defaultDirection, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      const fileId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const reader = new FileReader();

      reader.onload = async (ev) => {
        const dataUrl = ev.target?.result as string;
        // Save to IndexedDB for large file support
        await AttachmentStorageService.saveLargeFile(fileId, dataUrl);

        const isImg = file.type.startsWith('image/');
        const isAud = file.type.startsWith('audio/');

        const newAtt: DocumentAttachment = {
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type || 'application/pdf',
          uploadedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
          dataUrl,
          blobId: fileId,
          category: isImg ? 'photo' : isAud ? 'audio' : 'document'
        };

        setAttachments((prev) => [...prev, newAtt]);
      };

      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleAddAttachment = (att: DocumentAttachment) => {
    setAttachments((prev) => [...prev, att]);
  };

  const removeAttachment = (id: string) => {
    setAttachments(attachments.filter((a) => a.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !letterNumber.trim()) {
      alert('សូមបំពេញលេខលិខិត និងកម្មវត្ថុជាចាំបាច់!');
      return;
    }

    const now = new Date().toISOString();
    const docData: DocumentItem = {
      id: editingDoc ? editingDoc.id : `doc-${Date.now()}`,
      trackingCode,
      direction,
      letterNumber: letterNumber.trim(),
      inOutBookNumber: inOutBookNumber.trim() || undefined,
      subject: subject.trim(),
      summary: summary.trim() || undefined,
      docType,
      sender: sender.trim() || 'មិនបានបញ្ជាក់',
      receiver: receiver.trim() || 'មិនបានបញ្ជាក់',
      dateReceivedOrIssued,
      deadline: deadline ? deadline : undefined,
      priority,
      confidentiality,
      status: editingDoc ? editingDoc.status : 'received',
      assignedDepartment,
      assignedOfficer: assignedOfficer.trim() || 'មន្ត្រីរដ្ឋបាល',
      securityPin: securityPin.trim() || undefined,
      attachments,
      workflowLogs: editingDoc
        ? editingDoc.workflowLogs
        : [
            {
              id: `wf-${Date.now()}`,
              timestamp: new Date().toLocaleDateString('en-CA') + ' ' + new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit' }),
              status: 'received',
              actorName: assignedOfficer || 'មន្ត្រីចុះបញ្ជី',
              actorRole: 'មន្ត្រីរដ្ឋបាល',
              actionTitle: direction === 'in' ? 'បានទទួល និងចុះបញ្ជីលិខិតចូល' : 'បានបង្កើត និងចុះបញ្ជីលិខិតចេញ',
              notes: 'បានចុះបញ្ជីផ្លូវការក្នុងប្រព័ន្ធ DocuTrack'
            }
          ],
      tags: [docType, direction === 'in' ? 'លិខិតចូល' : 'លិខិតចេញ'],
      createdAt: editingDoc ? editingDoc.createdAt : now,
      updatedAt: now,
    };

    onSave(docData, sendTelegramAlert);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {editingDoc ? 'កែប្រែព័ត៌មានលិខិតរដ្ឋបាល' : 'ចុះបញ្ជីលិខិតរដ្ឋបាលថ្មី'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              លេខកូដតាមដានស្វ័យប្រវត្តិ៖ <span className="font-mono font-bold text-blue-900">{trackingCode}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Direction toggle */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">ទិសដៅលិខិតរដ្ឋបាល</label>
            <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setDirection('in')}
                className={`py-2 px-4 rounded-lg font-semibold text-center transition-all cursor-pointer ${
                  direction === 'in'
                    ? 'bg-blue-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📥 លិខិតចូល (Incoming Document)
              </button>
              <button
                type="button"
                onClick={() => setDirection('out')}
                className={`py-2 px-4 rounded-lg font-semibold text-center transition-all cursor-pointer ${
                  direction === 'out'
                    ? 'bg-blue-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📤 លិខិតចេញ (Outgoing Document)
              </button>
            </div>
          </div>

          {/* Letter number and In-Out Book Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                លេខលិខិតផ្លូវការ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={letterNumber}
                onChange={(e) => setLetterNumber(e.target.value)}
                placeholder="ឧ. ១៤៨/២៦ ស.ជ.ណ ឬ ០៥៤/២៦"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-900 focus:border-blue-900 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                លេខសៀវភៅបញ្ជី (រដ្ឋបាល)
              </label>
              <input
                type="text"
                value={inOutBookNumber}
                onChange={(e) => setInOutBookNumber(e.target.value)}
                placeholder="ឧ. ០២៨"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-900 focus:border-blue-900 text-slate-800"
              />
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              កម្មវត្ថុនៃលិខិត <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="ឧ. ស្តីពីការពង្រឹងវិធានការសន្តិសុខបច្ចេកវិទ្យា និងការគ្រប់គ្រងទិន្នន័យរដ្ឋបាល..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-900 focus:border-blue-900 text-slate-800"
            />
          </div>

          {/* Summary */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              ខ្លឹមសារសង្ខេប / ចំណារបឋម
            </label>
            <textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="បរិយាយសង្ខេបអំពីគោលបំណងសំខាន់នៃលិខិតនេះ..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-900 focus:border-blue-900 text-slate-800"
            />
          </div>

          {/* Document Type, Priority & Confidentiality */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">ប្រភេទឯកសារ</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as DocumentType)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-900 text-slate-800"
              >
                <option value="លិខិតអញ្ជើញ">លិខិតអញ្ជើញ</option>
                <option value="លិខិតស្នើ">លិខិតស្នើ</option>
                <option value="សេចក្តីជូនដំណឹង">សេចក្តីជូនដំណឹង</option>
                <option value="លិខិតអនុញ្ញាតច្បាប់ឈប់សម្រាក">លិខិតអនុញ្ញាតច្បាប់ឈប់សម្រាក</option>
                <option value="លិខិតបញ្ជាបេសកកម្ម">លិខិតបញ្ជាបេសកកម្ម</option>
                <option value="ទិដ្ឋាការធ្វើដំណើរ">ទិដ្ឋាការធ្វើដំណើរ</option>
                <option value="សារាចរ">សារាចរ</option>
                <option value="ប្រកាស">ប្រកាស</option>
                <option value="លិខិតបង្គាប់ការ">លិខិតបង្គាប់ការ</option>
                <option value="លិខិតឆ្លើយឆ្លង">លិខិតឆ្លើយឆ្លង</option>
                <option value="របាយការណ៍">របាយការណ៍</option>
                <option value="កិច្ចសន្យា">កិច្ចសន្យា</option>
                <option value="លិខិតអនុញ្ញាត">លិខិតអនុញ្ញាត</option>
                <option value="ផ្សេងៗ">ផ្សេងៗ</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">កម្រិតបន្ទាន់</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-900 text-slate-800 font-medium"
              >
                <option value="normal">ធម្មតា (Normal)</option>
                <option value="urgent">បន្ទាន់ (Urgent)</option>
                <option value="top_urgent">បន្ទាន់បំផុត (Top Urgent)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">កម្រិតសម្ងាត់</label>
              <select
                value={confidentiality}
                onChange={(e) => setConfidentiality(e.target.value as ConfidentialityLevel)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-900 text-slate-800 font-medium"
              >
                <option value="public">ធម្មតា / ចំហ (Public)</option>
                <option value="internal">ផ្ទៃក្នុង (Internal)</option>
                <option value="confidential">សម្ងាត់ (Confidential)</option>
                <option value="top_secret">សម្ងាត់បំផុត (Top Secret)</option>
              </select>
            </div>
          </div>

          {/* Sender & Receiver */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {direction === 'in' ? 'ស្ថាប័ន / អង្គភាពផ្ញើ' : 'អង្គភាពចេញលិខិត'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                placeholder="ឧ. ទីស្ដីការគណៈរដ្ឋមន្ត្រី, ក្រសួងមហាផ្ទៃ..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-900 focus:border-blue-900 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {direction === 'in' ? 'អង្គភាព / ថ្នាក់ដឹកនាំទទួល' : 'ស្ថាប័ន / បុគ្គលទទួល'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
                placeholder="ឧ. អគ្គនាយកដ្ឋានរដ្ឋបាល, នាយកដ្ឋានបុគ្គលិក..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-900 focus:border-blue-900 text-slate-800"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {direction === 'in' ? 'កាលបរិច្ឆេទចូល' : 'កាលបរិច្ឆេទចេញ'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dateReceivedOrIssued}
                onChange={(e) => setDateReceivedOrIssued(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-900 text-slate-800 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                កាលបរិច្ឆេទកំណត់ / ថ្ងៃផុតកំណត់ (Deadline)
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-900 text-slate-800 font-mono"
              />
            </div>
          </div>

          {/* Department, Officer & Security PIN */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">នាយកដ្ឋានទទួលបន្ទុក</label>
              <input
                type="text"
                value={assignedDepartment}
                onChange={(e) => setAssignedDepartment(e.target.value)}
                placeholder="ឧ. នាយកដ្ឋានរដ្ឋបាល"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-900 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">មន្ត្រីកាន់ការ / ទទួលបន្ទុក</label>
              <input
                type="text"
                value={assignedOfficer}
                onChange={(e) => setAssignedOfficer(e.target.value)}
                placeholder="ឧ. លោក វ៉ាន់ សុវណ្ណារ៉ា"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-900 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-600" />
                <span>កូដ PIN សម្ងាត់ (ជាជម្រើស)</span>
              </label>
              <input
                type="text"
                maxLength={6}
                value={securityPin}
                onChange={(e) => setSecurityPin(e.target.value)}
                placeholder="ឧ. 1234"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-900 text-slate-800 font-mono"
              />
            </div>
          </div>

          {/* Attachments Section with Camera, Audio and Large File Pickers */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-slate-700 font-semibold">
                ឯកសារភ្ជាប់ផ្លូវការ (PNG, PDF, Audio ចំណារសំឡេង)
              </label>
              <span className="text-[11px] text-slate-400">
                គាំទ្រឯកសារទំហំធំ (IndexedDB High-Capacity Storage)
              </span>
            </div>

            {/* 3 Dedicated Media Capture Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Button 1: Camera Photo Capture */}
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="flex items-center justify-center gap-2 p-3 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200 rounded-xl text-blue-900 font-semibold text-xs transition-colors cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-900 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Camera className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <div>ថតរូបកាមេរ៉ា</div>
                  <div className="text-[10px] text-blue-700 font-normal">PNG / PDF ស្កេន</div>
                </div>
              </button>

              {/* Button 2: Audio Voice Recording */}
              <button
                type="button"
                onClick={() => setIsAudioOpen(true)}
                className="flex items-center justify-center gap-2 p-3 bg-rose-50/80 hover:bg-rose-100/80 border border-rose-200 rounded-xl text-rose-900 font-semibold text-xs transition-colors cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Mic className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <div>ថតសំឡេងចំណារ</div>
                  <div className="text-[10px] text-rose-700 font-normal">Voice Directive</div>
                </div>
              </button>

              {/* Button 3: Upload Large PNG / PDF / Audio */}
              <label className="flex items-center justify-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl text-slate-800 font-semibold text-xs transition-colors cursor-pointer group">
                <div className="w-7 h-7 rounded-lg bg-slate-700 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Upload className="w-3.5 h-3.5" />
                </div>
                <div className="text-left truncate">
                  <div>ជ្រើសរើស File ធំ</div>
                  <div className="text-[10px] text-slate-500 font-normal truncate">PDF, PNG, JPG, MP3</div>
                </div>
                <input
                  type="file"
                  multiple
                  accept=".pdf,image/png,image/jpeg,image/webp,audio/*,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Attachments List */}
            {attachments.length > 0 && (
              <div className="mt-3 space-y-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[11px] font-bold text-slate-700 px-1">
                  ឯកសារដែលបានភ្ជាប់ ({attachments.length})៖
                </div>
                {attachments.map((att) => {
                  const isImg = att.type.startsWith('image/') || att.name.match(/\.(png|jpg|jpeg|webp)$/i);
                  const isAud = att.type.startsWith('audio/') || att.name.match(/\.(webm|mp3|m4a|wav)$/i);

                  return (
                    <div
                      key={att.id}
                      className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-slate-200 text-xs shadow-2xs hover:border-blue-900 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 truncate max-w-[65%]">
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
                          <div className="font-semibold text-slate-800 truncate">{att.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {AttachmentStorageService.formatFileSize(att.size)} · {att.uploadedAt}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Preview button */}
                        <button
                          type="button"
                          onClick={() => setPreviewAttachment(att)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-blue-900 hover:bg-blue-50 border border-blue-200 rounded transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>បើកមើល</span>
                        </button>

                        {/* Download button */}
                        {att.dataUrl && (
                          <button
                            type="button"
                            onClick={() => AttachmentStorageService.downloadFile(att.name, att.dataUrl!)}
                            className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 cursor-pointer"
                            title="ទាញយកឯកសារ"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => removeAttachment(att.id)}
                          className="p-1 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50 cursor-pointer"
                          title="លុបឯកសារភ្ជាប់"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Telegram Notification Checkbox */}
          <div className="p-3 bg-sky-50/70 border border-sky-100 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-sky-600" />
              <div>
                <div className="text-xs font-semibold text-slate-900">
                  ផ្ញើដំណឹង & រុញឯកសារភ្ជាប់ទៅ Telegram
                </div>
                <div className="text-[11px] text-slate-500">
                  {attachments.length > 0
                    ? `ប្រព័ន្ធនឹងបញ្ជូនព័ត៌មានលិខិត រួមជាមួយឯកសារភ្ជាប់ ${attachments.length} ឯកសារ (PNG, PDF, Audio) ទៅកាន់ Telegram ដើម្បីទាញយក និងមើល`
                    : 'ប្រព័ន្ធនឹងបញ្ជូនព័ត៌មានលិខិតនេះទៅកាន់ Telegram Bot ភ្លាមៗ'}
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={sendTelegramAlert}
              onChange={(e) => setSendTelegramAlert(e.target.checked)}
              className="w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-900 cursor-pointer"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors font-medium cursor-pointer"
            >
              បោះបង់
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors font-semibold shadow-sm cursor-pointer"
            >
              {editingDoc ? 'រក្សាទុកការកែប្រែ' : 'ចុះបញ្ជីលិខិតផ្លូវការ'}
            </button>
          </div>
        </form>

        {/* Live Camera Scanner Modal */}
        <CameraCaptureModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onCapture={handleAddAttachment}
          documentTitle={subject || 'ឯកសារលិខិតរដ្ឋបាល'}
        />

        {/* Live Audio Recorder Modal */}
        <AudioRecordModal
          isOpen={isAudioOpen}
          onClose={() => setIsAudioOpen(false)}
          onSaveAudio={handleAddAttachment}
          defaultTitle={subject ? `សំឡេង_${subject.slice(0, 20)}` : 'សំឡេងចំណារ'}
        />

        {/* Attachment Full Preview Modal */}
        <AttachmentPreviewModal
          isOpen={!!previewAttachment}
          onClose={() => setPreviewAttachment(null)}
          attachment={previewAttachment}
          documentTitle={subject || 'ឯកសាររដ្ឋបាល'}
        />
      </div>
    </div>
  );
};
