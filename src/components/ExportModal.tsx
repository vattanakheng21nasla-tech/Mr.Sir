import React, { useState } from 'react';
import { DocumentItem, CurrentUser } from '../types/document';
import { ExportService } from '../services/exportService';
import { StorageService } from '../services/storageService';
import {
  FileSpreadsheet,
  FileText,
  Download,
  X,
  CheckCircle2,
  Filter,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: DocumentItem[];
  filteredDocuments: DocumentItem[];
  filterDescription?: string;
  currentUser?: CurrentUser;
  onExportSuccess?: (fileName: string, format: 'excel' | 'csv', count: number) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  documents,
  filteredDocuments,
  filterDescription,
  currentUser,
  onExportSuccess,
}) => {
  const [exportScope, setExportScope] = useState<'filtered' | 'all'>('filtered');
  const [exportFormat, setExportFormat] = useState<'excel' | 'csv'>('excel');
  const [isExporting, setIsExporting] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ fileName: string; count: number } | null>(null);

  if (!isOpen) return null;

  const targetList = exportScope === 'filtered' ? filteredDocuments : documents;
  const count = targetList.length;

  const handleExport = () => {
    setIsExporting(true);
    setSuccessInfo(null);

    setTimeout(() => {
      try {
        let downloadedFileName = '';
        if (exportFormat === 'excel') {
          downloadedFileName = ExportService.exportToExcel(targetList);
        } else {
          downloadedFileName = ExportService.exportToCSV(targetList);
        }

        // Add audit trail log
        const user = currentUser || StorageService.getCurrentUser();
        StorageService.addAuditLog(
          'ទាញយករបាយការណ៍ (Export)',
          `បានទាញយកបញ្ជីលិខិតចំនួន ${count} ជាឯកសារ ${exportFormat === 'excel' ? 'Microsoft Excel (.xlsx)' : 'CSV (.csv)'} (${downloadedFileName})`,
          user
        );

        setSuccessInfo({
          fileName: downloadedFileName,
          count: count,
        });

        if (onExportSuccess) {
          onExportSuccess(downloadedFileName, exportFormat, count);
        }
      } catch (err) {
        console.error('Export failed:', err);
      } finally {
        setIsExporting(false);
      }
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <span>ទាញយកបញ្ជីលិខិតរដ្ឋបាល (Export Documents)</span>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full font-normal border border-emerald-400/30">
                  Excel & CSV
                </span>
              </h3>
              <p className="text-xs text-blue-200 mt-0.5">
                ទាញយកបញ្ជីលិខិតសម្រាប់កត់ត្រាក្រៅបណ្តាញ (Offline) ឬរៀបចំរបាយការណ៍ផ្លូវការ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Success Banner if exported */}
          {successInfo && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <p className="font-bold text-emerald-900">
                  បានទាញយកដោយជោគជ័យ! (Download Completed)
                </p>
                <p className="text-emerald-700 mt-0.5">
                  ឯកសារ <span className="font-mono font-semibold">{successInfo.fileName}</span> (ចំនួន {successInfo.count} លិខិត) ត្រូវបានទាញយកទៅកាន់កុំព្យូទ័ររបស់លោកអ្នករួចរាល់។
                </p>
              </div>
            </div>
          )}

          {/* 1. Select Data Scope */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              ១. ជ្រើសរើសទំហំទិន្នន័យ (Data Scope)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: Filtered */}
              <div
                onClick={() => setExportScope('filtered')}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  exportScope === 'filtered'
                    ? 'border-blue-900 bg-blue-50/50 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-blue-900" />
                    <span className="text-xs font-bold text-slate-900">
                      បញ្ជីកំពុងចម្រាញ់
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold bg-blue-900 text-white px-2 py-0.5 rounded-full">
                    {filteredDocuments.length} លិខិត
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  ទាញយកតែលិខិតដែលកំពុងបង្ហាញតាមតម្រងបច្ចុប្បន្ន
                  {filterDescription && ` (${filterDescription})`}
                </p>
              </div>

              {/* Option B: All Documents */}
              <div
                onClick={() => setExportScope('all')}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  exportScope === 'all'
                    ? 'border-blue-900 bg-blue-50/50 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-slate-700" />
                    <span className="text-xs font-bold text-slate-900">
                      បញ្ជីលិខិតសរុបទាំងអស់
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold bg-slate-800 text-white px-2 py-0.5 rounded-full">
                    {documents.length} លិខិត
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  ទាញយកទិន្នន័យលិខិតរដ្ឋបាលទាំងអស់ដែលមានក្នុងប្រព័ន្ធ
                </p>
              </div>
            </div>
          </div>

          {/* 2. Select File Format */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              ២. ជ្រើសរើសទម្រង់ឯកសារ (File Format)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Excel Format */}
              <div
                onClick={() => setExportFormat('excel')}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer relative ${
                  exportFormat === 'excel'
                    ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="absolute top-2.5 right-2.5">
                  <span className="text-[10px] bg-emerald-600 text-white font-semibold px-2 py-0.5 rounded-full shadow-2xs">
                    ណែនាំ
                  </span>
                </div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Microsoft Excel (.xlsx)
                    </span>
                    <span className="text-[10px] text-emerald-800 font-medium">
                      Excel Workbook ស្តង់ដារ
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                  រៀបចំជួរឈរ ទទឹង និងក្បាលតារាងរួចជាស្រេច ងាយស្រួលបើកមើល និងបោះពុម្ពភ្លាមៗ។
                </p>
              </div>

              {/* CSV Format */}
              <div
                onClick={() => setExportFormat('csv')}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                  exportFormat === 'csv'
                    ? 'border-blue-800 bg-blue-50/60 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center font-bold">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      CSV File (.csv)
                    </span>
                    <span className="text-[10px] text-blue-900 font-medium">
                      UTF-8 Unicode BOM
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                  ទម្រង់ទូទៅ Comma-Separated គាំទ្រអក្សរខ្មែរ ១០០% លើ Windows/Excel/Google Sheets។
                </p>
              </div>
            </div>
          </div>

          {/* 3. Included Columns Preview */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
              <Info className="w-3.5 h-3.5 text-blue-900" />
              <span>ជួរឈរដែលមានក្នុងរបាយការណ៍ (Included Columns):</span>
            </div>
            <div className="flex flex-wrap gap-1 text-[10px]">
              {[
                'លេខរៀង',
                'លេខកូដតាមដាន',
                'ទិសដៅ (ចូល/ចេញ)',
                'លេខលិខិត',
                'លេខសៀវភៅបញ្ជី',
                'ប្រភេទលិខិត',
                'កម្មវត្ថុ',
                'ខ្លឹមសារសង្ខេប',
                'អង្គភាពផ្ញើ/ទទួល',
                'កាលបរិច្ឆេទ & កាលកំណត់',
                'កម្រិតបន្ទាន់ & សម្ងាត់',
                'ស្ថានភាពបច្ចុប្បន្ន',
                'នាយកដ្ឋាន & មន្ត្រីកាន់ការ',
                'ឯកសារភ្ជាប់',
                'កាលបរិច្ឆេទចុះបញ្ជី'
              ].map((col, idx) => (
                <span
                  key={idx}
                  className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md"
                >
                  {col}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-600">
            <span>នឹងទាញយក: </span>
            <span className="font-mono font-bold text-slate-900">
              {count} លិខិត
            </span>
            <span className="text-slate-400 mx-1">•</span>
            <span className="font-medium text-slate-700 uppercase">
              {exportFormat}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-white transition-colors cursor-pointer"
            >
              បិទ
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || count === 0}
              className={`px-5 py-2 rounded-lg text-xs font-semibold text-white transition-all shadow-xs flex items-center gap-2 cursor-pointer ${
                exportFormat === 'excel'
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
                  : 'bg-blue-900 hover:bg-blue-800 active:scale-95'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isExporting ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>កំពុងបង្កើតឯកសារ...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>
                    ទាញយកជា {exportFormat === 'excel' ? 'Excel (.xlsx)' : 'CSV (.csv)'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
