import React, { useState, useMemo } from 'react';
import {
  DocumentItem,
  DocumentDirection,
  DocumentStatus,
  PriorityLevel,
  DocumentType,
} from '../types/document';
import {
  Search,
  QrCode,
  FileText,
  Printer,
  Send,
  Edit2,
  Trash2,
  Lock,
  Paperclip,
  CheckCircle2,
  Clock,
  ArrowRightCircle,
  FileCheck2,
  Archive,
  AlertCircle
} from 'lucide-react';

interface DocumentListProps {
  documents: DocumentItem[];
  directionFilter?: DocumentDirection | 'all';
  onTrackDocument: (doc: DocumentItem) => void;
  onUpdateStatus: (doc: DocumentItem) => void;
  onPrintDocument: (doc: DocumentItem) => void;
  onEditDocument: (doc: DocumentItem) => void;
  onDeleteDocument: (docId: string) => void;
  onQuickTelegramSend: (doc: DocumentItem) => void;
}

const STATUS_LABELS: Record<DocumentStatus, { label: string; icon: React.ReactNode; color: string }> = {
  received: { label: 'បានទទួល/ចុះបញ្ជី', icon: <FileCheck2 className="w-3.5 h-3.5" />, color: 'text-slate-700' },
  reviewing: { label: 'កំពុងត្រួតពិនិត្យ', icon: <Clock className="w-3.5 h-3.5" />, color: 'text-amber-700' },
  forwarded_leader: { label: 'ឆ្លងថ្នាក់ដឹកនាំ', icon: <ArrowRightCircle className="w-3.5 h-3.5" />, color: 'text-indigo-700' },
  approved: { label: 'បានឯកភាព/ចុះហត្ថលេខា', icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'text-emerald-700' },
  dispatched: { label: 'បានបញ្ជូនបន្តអនុវត្ត', icon: <Send className="w-3.5 h-3.5" />, color: 'text-blue-700' },
  completed: { label: 'បានបញ្ចប់នីតិវិធី', icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'text-teal-700' },
  archived: { label: 'បានតម្កល់ទុកបណ្ណសារ', icon: <Archive className="w-3.5 h-3.5" />, color: 'text-slate-500' },
};

const PRIORITY_LABELS: Record<PriorityLevel, { label: string; color: string }> = {
  normal: { label: 'ធម្មតា', color: 'text-slate-600' },
  urgent: { label: 'បន្ទាន់', color: 'text-amber-700 font-semibold' },
  top_urgent: { label: 'បន្ទាន់បំផុត', color: 'text-rose-700 font-bold' },
};

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  directionFilter = 'all',
  onTrackDocument,
  onUpdateStatus,
  onPrintDocument,
  onEditDocument,
  onDeleteDocument,
  onQuickTelegramSend,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      if (directionFilter !== 'all' && doc.direction !== directionFilter) {
        return false;
      }
      if (typeFilter !== 'all' && doc.docType !== typeFilter) {
        return false;
      }
      if (priorityFilter !== 'all' && doc.priority !== priorityFilter) {
        return false;
      }
      if (statusFilter !== 'all' && doc.status !== statusFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesCode = doc.trackingCode.toLowerCase().includes(query);
        const matchesLetterNo = doc.letterNumber.toLowerCase().includes(query);
        const matchesSubject = doc.subject.toLowerCase().includes(query);
        const matchesSender = doc.sender.toLowerCase().includes(query);
        const matchesReceiver = doc.receiver.toLowerCase().includes(query);
        const matchesOfficer = doc.assignedOfficer.toLowerCase().includes(query);
        return matchesCode || matchesLetterNo || matchesSubject || matchesSender || matchesReceiver || matchesOfficer;
      }
      return true;
    });
  }, [documents, directionFilter, typeFilter, priorityFilter, statusFilter, searchTerm]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Search and Filters Toolbar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ស្វែងរកតាមលេខកូដតាមដាន, លេខលិខិត, កម្មវត្ថុ, អង្គភាព, មន្ត្រីទទួលបន្ទុក..."
              className="w-full pl-9 pr-4 py-2 bg-white text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900 text-slate-800 placeholder-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                សម្អាត
              </button>
            )}
          </div>

          {/* Quick Stats count */}
          <div className="text-xs text-slate-500 whitespace-nowrap shrink-0 flex items-center gap-2">
            <span>រកឃើញលិខិតចំនួន:</span>
            <span className="font-mono font-bold text-slate-900 tabular-nums text-sm">
              {filteredDocs.length}
            </span>
            <span className="text-slate-400">/</span>
            <span className="font-mono text-slate-600 tabular-nums">
              {documents.length}
            </span>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">ប្រភេទ៖</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-md py-1 px-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-900"
            >
              <option value="all">ទាំងអស់ (All Types)</option>
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

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">កម្រិតបន្ទាន់៖</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-md py-1 px-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-900"
            >
              <option value="all">ទាំងអស់ (All)</option>
              <option value="normal">ធម្មតា (Normal)</option>
              <option value="urgent">បន្ទាន់ (Urgent)</option>
              <option value="top_urgent">បន្ទាន់បំផុត (Top Urgent)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">ស្ថានភាព៖</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-md py-1 px-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-900"
            >
              <option value="all">ទាំងអស់ (All Status)</option>
              <option value="received">បានទទួល / ចុះបញ្ជី</option>
              <option value="reviewing">កំពុងត្រួតពិនិត្យ</option>
              <option value="forwarded_leader">ឆ្លងថ្នាក់ដឹកនាំ</option>
              <option value="approved">បានឯកភាព / ចុះហត្ថលេខា</option>
              <option value="dispatched">បានបញ្ជូនបន្ត</option>
              <option value="completed">បានបញ្ចប់</option>
              <option value="archived">បានតម្កល់ទុក</option>
            </select>
          </div>

          {(searchTerm || typeFilter !== 'all' || priorityFilter !== 'all' || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('all');
                setPriorityFilter('all');
                setStatusFilter('all');
              }}
              className="text-blue-900 font-medium hover:underline ml-auto cursor-pointer"
            >
              សម្អាតតម្រងទាំងអស់
            </button>
          )}
        </div>
      </div>

      {/* Table Data Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 uppercase tracking-wider text-[11px] font-semibold">
              <th className="py-3 px-4 whitespace-nowrap">លេខកូដតាមដាន</th>
              <th className="py-3 px-4 whitespace-nowrap">លេខលិខិត & ប្រភេទ</th>
              <th className="py-3 px-4 min-w-[260px]">កម្មវត្ថុ & ខ្លឹមសារ</th>
              <th className="py-3 px-4 whitespace-nowrap">
                {directionFilter === 'out' ? 'អង្គភាពទទួល' : 'អង្គភាពផ្ញើ'}
              </th>
              <th className="py-3 px-4 whitespace-nowrap">កម្រិតបន្ទាន់</th>
              <th className="py-3 px-4 whitespace-nowrap">ស្ថានភាព & មន្ត្រីកាន់ការ</th>
              <th className="py-3 px-4 whitespace-nowrap">កាលបរិច្ឆេទ</th>
              <th className="py-3 px-4 text-right whitespace-nowrap">សកម្មភាព</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredDocs.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-medium text-slate-700">មិនមានទិន្នន័យលិខិតត្រូវនឹងការស្វែងរកឡើយ</p>
                  <p className="text-[11px] text-slate-400 mt-1">សូមសាកល្បងផ្លាស់ប្តូរពាក្យគន្លឹះ ឬសម្អាតតម្រងស្វែងរក</p>
                </td>
              </tr>
            ) : (
              filteredDocs.map((doc) => {
                const statusMeta = STATUS_LABELS[doc.status];
                const priorityMeta = PRIORITY_LABELS[doc.priority];

                return (
                  <tr
                    key={doc.id}
                    className="hover:bg-blue-50/40 transition-colors group"
                  >
                    {/* Tracking Code */}
                    <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900 tabular-nums">
                          {doc.trackingCode}
                        </span>
                        {doc.confidentiality !== 'public' && (
                          <span title={`កម្រិតសម្ងាត់: ${doc.confidentiality}`}>
                            <Lock className="w-3.5 h-3.5 text-amber-600" />
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {doc.direction === 'in' ? 'លិខិតចូល' : 'លិខិតចេញ'}
                        {doc.inOutBookNumber && ` · សៀវភៅលេខ ${doc.inOutBookNumber}`}
                      </div>
                    </td>

                    {/* Letter Number and Type */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900">{doc.letterNumber}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {doc.docType}
                        {doc.attachments.length > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onTrackDocument(doc);
                            }}
                            title="ចុចដើម្បីពិនិត្យ និងទាញយកឯកសារភ្ជាប់ (PNG, PDF, Audio)"
                            className="inline-flex items-center gap-1 ml-1.5 text-blue-900 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                          >
                            <Paperclip className="w-3 h-3" />
                            <span className="font-mono font-bold text-[10px]">{doc.attachments.length}</span>
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Subject and Summary */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900 line-clamp-2 leading-relaxed">
                        {doc.subject}
                      </div>
                      {doc.summary && (
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {doc.summary}
                        </div>
                      )}
                    </td>

                    {/* Sender / Receiver */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-slate-900 font-medium truncate max-w-[180px]">
                        {doc.direction === 'in' ? doc.sender : doc.receiver}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {doc.direction === 'in' ? `ទទួល: ${doc.receiver}` : `ផ្ញើ: ${doc.sender}`}
                      </div>
                    </td>

                    {/* Priority Level */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={priorityMeta.color}>
                        {priorityMeta.label}
                      </span>
                    </td>

                    {/* Current Status and Officer */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className={`flex items-center gap-1.5 font-medium ${statusMeta.color}`}>
                        {statusMeta.icon}
                        <span>{statusMeta.label}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {doc.assignedOfficer} · {doc.assignedDepartment}
                      </div>
                    </td>

                    {/* Date and Deadline */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono tabular-nums text-slate-700">
                      <div>{doc.dateReceivedOrIssued}</div>
                      {doc.deadline && (
                        <div className="text-[10px] text-rose-600 flex items-center gap-1 mt-0.5">
                          <AlertCircle className="w-3 h-3" />
                          <span>កំណត់: {doc.deadline}</span>
                        </div>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {/* Track & QR modal */}
                        <button
                          onClick={() => onTrackDocument(doc)}
                          title="តាមដានដំណើរការ & QR Code"
                          className="p-1.5 text-slate-600 hover:text-blue-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>

                        {/* Update Workflow Status & Directives */}
                        <button
                          onClick={() => onUpdateStatus(doc)}
                          title="កែប្រែស្ថានភាព / ចំណារថ្នាក់ដឹកនាំ"
                          className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                        >
                          <ArrowRightCircle className="w-4 h-4" />
                        </button>

                        {/* Official Print View */}
                        <button
                          onClick={() => onPrintDocument(doc)}
                          title="បោះពុម្ពប័ណ្ណតាមដានលិខិតផ្លូវការ"
                          className="p-1.5 text-slate-600 hover:text-purple-800 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Send Telegram Alert */}
                        <button
                          onClick={() => onQuickTelegramSend(doc)}
                          title="ផ្ញើជូនដំណឹងតាម Telegram"
                          className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                        >
                          <Send className="w-4 h-4" />
                        </button>

                        {/* Edit Document */}
                        <button
                          onClick={() => onEditDocument(doc)}
                          title="កែប្រែព័ត៌មានលិខិត"
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Document */}
                        <button
                          onClick={() => onDeleteDocument(doc.id)}
                          title="លុបលិខិត"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
