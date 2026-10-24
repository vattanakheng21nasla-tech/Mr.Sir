import React, { useState } from 'react';
import { DocumentItem, DocumentStatus, WorkflowStep, CurrentUser, DocumentAttachment } from '../types/document';
import { AudioRecordModal } from './AudioRecordModal';
import { X, Send, History, Mic, Volume2 } from 'lucide-react';

interface WorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem | null;
  currentUser: CurrentUser;
  onApplyWorkflow: (
    docId: string,
    newStatus: DocumentStatus,
    directiveNote: string,
    notifyTelegram: boolean,
    audioAttachment?: DocumentAttachment
  ) => void;
}

const STATUS_OPTIONS: { status: DocumentStatus; title: string; desc: string }[] = [
  { status: 'received', title: 'បានទទួល / ចុះបញ្ជី', desc: 'លិខិតទើបមកដល់ និងបានបញ្ចូលក្នុងប្រព័ន្ធ' },
  { status: 'reviewing', title: 'កំពុងត្រួតពិនិត្យ', desc: 'មន្ត្រីជំនាញកំពុងពិនិត្យទិដ្ឋភាពច្បាប់ និងបច្ចេកទេស' },
  { status: 'forwarded_leader', title: 'ឆ្លងថ្នាក់ដឹកនាំ', desc: 'បញ្ជូនឆ្លងឯកឧត្តម/លោកជំទាវដើម្បីពិនិត្យ និងផ្តល់ចំណារ' },
  { status: 'approved', title: 'បានឯកភាព / ចុះហត្ថលេខា', desc: 'ថ្នាក់ដឹកនាំបានចុះហត្ថលេខា និងវាយត្រាជាផ្លូវការ' },
  { status: 'dispatched', title: 'បានបញ្ជូនបន្តអនុវត្ត', desc: 'បានចែកចាយទៅកាន់នាយកដ្ឋាន ឬសាមីខ្លួនពាក់ព័ន្ធ' },
  { status: 'completed', title: 'បានបញ្ចប់នីតិវិធី', desc: 'កិច្ចការត្រូវបានអនុវត្តចប់សព្វគ្រប់' },
  { status: 'archived', title: 'បានតម្កល់ទុកបណ្ណសារ', desc: 'រក្សាទុកជាឯកសារយោងផ្លូវការក្នុងបណ្ណសារដ្ឋាន' },
];

const PRESET_DIRECTIVES = [
  'ឯកភាពតាមសំណើ',
  'សូមនាយកដ្ឋានជំនាញពិនិត្យ និងផ្តល់មតិ',
  'សូមចាត់ចែងអនុវត្តជាបន្ទាន់',
  'សូមរៀបចំសេចក្តីព្រាងលិខិតឆ្លើយតប',
  'សូមតម្កល់ទុកជាឯកសារយោង',
];

export const WorkflowModal: React.FC<WorkflowModalProps> = ({
  isOpen,
  onClose,
  document,
  currentUser,
  onApplyWorkflow,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<DocumentStatus>('reviewing');
  const [directiveNote, setDirectiveNote] = useState('');
  const [notifyTelegram, setNotifyTelegram] = useState(true);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<DocumentAttachment | null>(null);

  React.useEffect(() => {
    if (document) {
      setSelectedStatus(document.status);
      setDirectiveNote('');
      setRecordedAudio(null);
    }
  }, [document, isOpen]);

  if (!isOpen || !document) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalNote = directiveNote.trim();
    if (recordedAudio) {
      finalNote = finalNote
        ? `${finalNote} (🎙️ បានភ្ជាប់សំឡេងចំណារ៖ ${recordedAudio.name})`
        : `🎙️ បានភ្ជាប់សំឡេងចំណារ៖ ${recordedAudio.name}`;
    }
    onApplyWorkflow(document.id, selectedStatus, finalNote, notifyTelegram, recordedAudio || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              កែប្រែស្ថានភាព & ផ្តល់ចំណារថ្នាក់ដឹកនាំ
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              លេខលិខិត៖ <span className="font-semibold text-slate-900">{document.letterNumber}</span> · កូដ៖ <span className="font-mono text-blue-900 font-bold">{document.trackingCode}</span>
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
          {/* Document Subject preview */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
            <span className="font-semibold text-slate-900">កម្មវត្ថុ៖ </span>
            {document.subject}
          </div>

          {/* Status selector */}
          <div>
            <label className="block text-slate-700 font-semibold mb-2">
              ជ្រើសរើសស្ថានភាពថ្មី <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50/50">
              {STATUS_OPTIONS.map((opt) => (
                <label
                  key={opt.status}
                  className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    selectedStatus === opt.status
                      ? 'bg-blue-50/90 border-blue-900 shadow-xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="statusOption"
                    value={opt.status}
                    checked={selectedStatus === opt.status}
                    onChange={() => setSelectedStatus(opt.status)}
                    className="mt-0.5 text-blue-900 focus:ring-blue-900"
                  />
                  <div>
                    <div className="font-bold text-slate-900">{opt.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Directive Note / Comment */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-slate-700 font-semibold">
                ចំណារ / មតិយោបល់ណែនាំរបស់ថ្នាក់ដឹកនាំ ឬមន្ត្រី
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAudioModalOpen(true)}
                  className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>ថតសំឡេងចំណារ</span>
                </button>
                <span className="text-[11px] text-slate-400">អនុវត្តដោយ: {currentUser.name}</span>
              </div>
            </div>

            {recordedAudio && (
              <div className="mb-2 p-2 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between text-xs text-rose-900">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-rose-600" />
                  <span className="font-semibold">{recordedAudio.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ({(recordedAudio.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setRecordedAudio(null)}
                  className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold cursor-pointer"
                >
                  លុបចេញ
                </button>
              </div>
            )}

            <textarea
              rows={3}
              value={directiveNote}
              onChange={(e) => setDirectiveNote(e.target.value)}
              placeholder="សូមបញ្ចូលចំណារ ឬការណែនាំលម្អិតសម្រាប់ជំហានបន្ទាប់..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-900 focus:border-blue-900 text-slate-800"
            />

            {/* Quick preset chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] text-slate-500">ចំណាររហ័ស៖</span>
              {PRESET_DIRECTIVES.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDirectiveNote(preset)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] transition-colors cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Previous Workflow Timeline preview */}
          <div>
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 mb-2">
              <History className="w-3.5 h-3.5 text-blue-900" />
              <span>ប្រវត្តិដំណាក់កាលកន្លងមក ({document.workflowLogs.length})</span>
            </div>
            <div className="space-y-2 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
              {document.workflowLogs.map((log: WorkflowStep) => (
                <div
                  key={log.id}
                  className="p-2 bg-white rounded border border-slate-200 text-[11px]"
                >
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="font-semibold text-slate-800">{log.actionTitle}</span>
                    <span className="font-mono tabular-nums">{log.timestamp}</span>
                  </div>
                  <div className="text-slate-600 mt-0.5">
                    ដោយ៖ {log.actorName} ({log.actorRole})
                  </div>
                  {log.notes && (
                    <div className="text-blue-950 font-medium mt-1 pl-2 border-l-2 border-blue-200 bg-blue-50/50 py-0.5">
                      "{log.notes}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Telegram notification toggle */}
          <div className="p-3 bg-sky-50/70 border border-sky-100 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-sky-600" />
              <div>
                <div className="text-xs font-semibold text-slate-900">ជូនដំណឹងបច្ចុប្បន្នភាពតាម Telegram</div>
                <div className="text-[11px] text-slate-500">ផ្ញើស្ថានភាពថ្មី និងចំណារទៅកាន់ក្រុមការងារ Telegram</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notifyTelegram}
              onChange={(e) => setNotifyTelegram(e.target.checked)}
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
              កត់ត្រា និងប្តូរស្ថានភាព
            </button>
          </div>
        </form>

        {/* Live Audio Recorder Modal */}
        <AudioRecordModal
          isOpen={isAudioModalOpen}
          onClose={() => setIsAudioModalOpen(false)}
          onSaveAudio={(att) => {
            setRecordedAudio(att);
            setIsAudioModalOpen(false);
          }}
          defaultTitle={`សំឡេងចំណារ_${document.trackingCode}`}
        />
      </div>
    </div>
  );
};
