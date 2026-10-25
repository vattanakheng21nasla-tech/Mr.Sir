import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  AlertCircle,
  Download,
  FileSpreadsheet,
  ChevronDown
} from 'lucide-react';
import { ExportModal } from './ExportModal';
import { ExportService } from '../services/exportService';
import { StorageService } from '../services/storageService';

interface DocumentListProps {
  documents: DocumentItem[];
  directionFilter?: DocumentDirection | 'all';
  onTrackDocument: (doc: DocumentItem) => void;
  onUpdateStatus: (doc: DocumentItem) => void;
  onPrintDocument: (doc: DocumentItem) => void;
  onEditDocument: (doc: DocumentItem) => void;
  onDeleteDocument: (docId: string) => void;
  onQuickTelegramSend: (doc: DocumentItem) => void;
  onExportSuccess?: (fileName: string, format: 'excel' | 'csv', count: number) => void;
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
  onExportSuccess,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleQuickExport = (format: 'excel' | 'csv') => {
    setIsExportDropdownOpen(false);
    try {
      let fileName = '';
      if (format === 'excel') {
        fileName = ExportService.exportToExcel(filteredDocs);
      } else {
        fileName = ExportService.exportToCSV(filteredDocs);
      }
      const user = StorageService.getCurrentUser();
      StorageService.addAuditLog(
        'ទាញយករបាយការណ៍ (Quick Export)',
        `បានទាញយកបញ្ជីលិខិតចំនួន ${filteredDocs.length} ជាឯកសារ ${format === 'excel' ? 'Excel (.xlsx)' : 'CSV (.csv)'} (${fileName})`,
        user
      );
      setExportNotice(`បានទាញយក ${fileName} (${filteredDocs.length} លិខិត) ដោយជោគជ័យ!`);
      setTimeout(() => setExportNotice(null), 3500);
      if (onExportSuccess) {
        onExportSuccess(fileName, format, filteredDocs.length);
      }
    } catch (err) {
      console.error('Quick export failed:', err);
    }
  };

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

          <div className="flex items-center gap-3 shrink-0">
            {/* Quick Stats count */}
            <div className="text-xs text-slate-500 whitespace-nowrap shrink-0 flex items-center gap-2">
              <span>ចំនួនលិខិត:</span>
              <span className="font-mono font-bold text-slate-900 tabular-nums text-sm">
                {filteredDocs.length}
              </span>
              <span className="text-slate-400">/</span>
              <span className="font-mono text-slate-600 tabular-nums">
                {documents.length}
              </span>
            </div>

            {/* Export Actions Split Button */}
            <div className="relative" ref={dropdownRef}>
              <div className="inline-flex rounded-lg shadow-2xs border border-emerald-700/30">
                <button
                  type="button"
                  onClick={() => handleQuickExport('excel')}
                  title="ទាញយកបញ្ជីដែលបានចម្រាញ់ជា Microsoft Excel (.xlsx) ភ្លាមៗ"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-l-lg text-xs font-semibold transition-colors cursor-pointer border-r border-emerald-500"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>ទាញយក Excel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                  title="ជម្រើសទាញយកបន្ថែម (CSV / កម្រិតខ្ពស់)"
                  className="px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-r-lg text-xs transition-colors cursor-pointer flex items-center justify-center"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Dropdown Menu */}
              {isExportDropdownOpen && (
                <div className="absolute right-0 mt-1 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 text-xs animate-in fade-in duration-150">
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] text-slate-500 font-medium flex items-center justify-between">
                    <span>ជម្រើសទាញយកឯកសារ</span>
                    <span className="font-mono font-bold text-slate-700">{filteredDocs.length} លិខិត</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickExport('excel')}
                    className="w-full text-left px-3 py-2 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-semibold block text-slate-900">Microsoft Excel (.xlsx)</span>
                      <span className="text-[10px] text-slate-500 block">ឯកសារស្តង់ដារ មានរៀបចំជួរឈរស្អាត</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickExport('csv')}
                    className="w-full text-left px-3 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-900 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <FileText className="w-4 h-4 text-blue-900 shrink-0" />
                    <div>
                      <span className="font-semibold block text-slate-900">CSV File (.csv)</span>
                      <span className="text-[10px] text-slate-500 block">UTF-8 BOM គាំទ្រអក្សរខ្មែរ ១០០%</span>
                    </div>
                  </button>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportDropdownOpen(false);
                      setIsExportModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Download className="w-4 h-4 text-slate-500 shrink-0" />
                    <div>
                      <span className="font-semibold block text-slate-900">ជម្រើសកម្រិតខ្ពស់ (Scope / Filter)...</span>
                      <span className="text-[10px] text-slate-500 block">ជ្រើសរើសចម្រាញ់ ឬទិន្នន័យសរុប</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Export Success Notice */}
        {exportNotice && (
          <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{exportNotice}</span>
          </div>
        )}

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

      {/* Mobile Card View (visible on < md) */}
      <div className="block md:hidden divide-y divide-slate-200">
        {filteredDocs.length === 0 ? (
          <div className="py-12 text-center text-slate-500 p-4">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-medium text-slate-700">មិនមានទិន្នន័យលិខិតត្រូវនឹងការស្វែងរកឡើយ</p>
            <p className="text-[11px] text-slate-400 mt-1">សូមសាកល្បងផ្លាស់ប្តូរពាក្យគន្លឹះ ឬសម្អាតតម្រងស្វែងរក</p>
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const statusMeta = STATUS_LABELS[doc.status];
            const priorityMeta = PRIORITY_LABELS[doc.priority];
            const isIncoming = doc.direction === 'in';

            return (
              <div key={doc.id} className="p-4 space-y-3 hover:bg-slate-50 transition-colors">
                {/* Header row: Tracking code & direction */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-blue-900">
                    <span>{doc.trackingCode}</span>
                    {doc.securityPin && <Lock className="w-3 h-3 text-amber-600" />}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isIncoming
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isIncoming ? 'លិខិតចូល' : 'លិខិតចេញ'}
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                      {doc.docType}
                    </span>
                  </div>
                </div>

                {/* Letter Number & Subject */}
                <div>
                  <div className="text-xs font-bold text-slate-700 mb-0.5">
                    លេខ៖ {doc.letterNumber}
                  </div>
                  <div className="text-xs font-semibold text-slate-900 leading-snug">
                    {doc.subject}
                  </div>
                  {doc.summary && (
                    <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {doc.summary}
                    </div>
                  )}
                </div>

                {/* Sender/Receiver & Date */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">
                      {isIncoming ? 'មកពី៖' : 'ផ្ញើទៅ៖'}
                    </span>
                    <span className="font-medium text-slate-800 line-clamp-1">
                      {isIncoming ? doc.sender : doc.receiver}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">កាលបរិច្ឆេទ៖</span>
                    <span className="font-mono text-slate-800">
                      {doc.dateReceivedOrIssued}
                    </span>
                  </div>
                </div>

                {/* Status & Priority */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <div className={`flex items-center gap-1 text-[11px] font-medium ${statusMeta.color}`}>
                    {statusMeta.icon}
                    <span>{statusMeta.label}</span>
                  </div>
                  <span className={`text-[11px] ${priorityMeta.color}`}>
                    {priorityMeta.label}
                  </span>
                </div>

                {/* Mobile Action Bar */}
                <div className="flex items-center justify-between gap-1 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => onTrackDocument(doc)}
                    className="flex-1 py-1.5 px-2 bg-blue-50 text-blue-900 rounded-lg text-[11px] font-semibold hover:bg-blue-100 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>តាមដាន QR</span>
                  </button>
                  <button
                    onClick={() => onUpdateStatus(doc)}
                    className="flex-1 py-1.5 px-2 bg-emerald-50 text-emerald-800 rounded-lg text-[11px] font-semibold hover:bg-emerald-100 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ArrowRightCircle className="w-3.5 h-3.5" />
                    <span>ចំណារ</span>
                  </button>
                  <button
                    onClick={() => onQuickTelegramSend(doc)}
                    className="p-1.5 text-sky-600 bg-sky-50 rounded-lg hover:bg-sky-100 cursor-pointer"
                    title="Telegram"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onPrintDocument(doc)}
                    className="p-1.5 text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 cursor-pointer"
                    title="បោះពុម្ព"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEditDocument(doc)}
                    className="p-1.5 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
                    title="កែប្រែ"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteDocument(doc.id)}
                    className="p-1.5 text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 cursor-pointer"
                    title="លុប"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table Data Grid (visible on >= md) */}
      <div className="hidden md:block overflow-x-auto">
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

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        documents={documents}
        filteredDocuments={filteredDocs}
        filterDescription={
          [
            directionFilter !== 'all' ? (directionFilter === 'in' ? 'លិខិតចូល' : 'លិខិតចេញ') : '',
            typeFilter !== 'all' ? `ប្រភេទ: ${typeFilter}` : '',
            priorityFilter !== 'all' ? `កម្រិត: ${priorityFilter}` : '',
            statusFilter !== 'all' ? `ស្ថានភាព: ${statusFilter}` : '',
            searchTerm.trim() ? `ពាក្យ: "${searchTerm.trim()}"` : '',
          ].filter(Boolean).join(', ')
        }
        onExportSuccess={(fileName, format, count) => {
          setExportNotice(`បានទាញយក ${fileName} (${count} លិខិត) ដោយជោគជ័យ!`);
          setTimeout(() => setExportNotice(null), 3500);
          if (onExportSuccess) {
            onExportSuccess(fileName, format, count);
          }
        }}
      />
    </div>
  );
};
