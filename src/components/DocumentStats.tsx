import React from 'react';
import { DocumentItem, BackupRecord } from '../types/document';
import { FileDown, FileUp, Clock, AlertTriangle, CloudCheck } from 'lucide-react';

interface DocumentStatsProps {
  documents: DocumentItem[];
  latestBackup?: BackupRecord;
  onFilterStatus?: (status: string) => void;
}

export const DocumentStats: React.FC<DocumentStatsProps> = ({
  documents,
  latestBackup,
}) => {
  const inDocs = documents.filter((d) => d.direction === 'in');
  const outDocs = documents.filter((d) => d.direction === 'out');
  const pendingDocs = documents.filter((d) => d.status === 'reviewing' || d.status === 'forwarded_leader');
  const urgentDocs = documents.filter((d) => d.priority === 'urgent' || d.priority === 'top_urgent');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {/* Total Inward */}
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium">លិខិតចូលសរុប</span>
          <FileDown className="w-4 h-4 text-blue-700" />
        </div>
        <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
          {inDocs.length.toString().padStart(2, '0')}
        </div>
        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
          <span>បានចុះបញ្ជីក្នុងប្រព័ន្ធ</span>
        </div>
      </div>

      {/* Total Outward */}
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium">លិខិតចេញសរុប</span>
          <FileUp className="w-4 h-4 text-emerald-700" />
        </div>
        <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
          {outDocs.length.toString().padStart(2, '0')}
        </div>
        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
          <span>បានអនុម័ត និងចែកផ្សាយ</span>
        </div>
      </div>

      {/* Pending Review / Leadership */}
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium">កំពុងត្រួតពិនិត្យ / ឆ្លង</span>
          <Clock className="w-4 h-4 text-amber-600" />
        </div>
        <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
          {pendingDocs.length.toString().padStart(2, '0')}
        </div>
        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
          <span>រង់ចាំការឯកភាព និងចំណារ</span>
        </div>
      </div>

      {/* Urgent Letters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium">លិខិតបន្ទាន់ / បន្ទាន់បំផុត</span>
          <AlertTriangle className="w-4 h-4 text-rose-600" />
        </div>
        <div className="text-2xl font-bold text-rose-700 font-mono tabular-nums">
          {urgentDocs.length.toString().padStart(2, '0')}
        </div>
        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
          <span>តម្រូវឱ្យចាត់ចែងជាអាទិភាព</span>
        </div>
      </div>

      {/* Cloud Backup Snapshot status */}
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium">ការបម្រុងទុកទិន្នន័យលើពពក</span>
          <CloudCheck className="w-4 h-4 text-sky-600" />
        </div>
        <div className="text-base font-bold text-slate-900 truncate">
          {latestBackup ? latestBackup.checksum : 'បានបម្រុងទុក'}
        </div>
        <div className="text-[11px] text-slate-500 mt-1 truncate">
          {latestBackup ? `${latestBackup.timestamp}` : 'ប្រព័ន្ធស្វ័យប្រវត្តិដំណើរការ'}
        </div>
      </div>
    </div>
  );
};
