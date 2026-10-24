import React, { useState } from 'react';
import { BackupRecord, CurrentUser } from '../types/document';
import { AutoBackupSettings } from '../services/storageService';
import { BackupService, BackupPayload } from '../services/backupService';
import {
  CloudCheck,
  Download,
  Upload,
  RefreshCw,
  ShieldCheck,
  HardDrive,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

interface BackupSettingsViewProps {
  settings: AutoBackupSettings;
  records: BackupRecord[];
  currentUser: CurrentUser;
  onSaveSettings: (settings: AutoBackupSettings) => void;
  onTriggerBackupNow: () => void;
  onRefreshRecords: () => void;
  onRestoreSuccess: () => void;
}

export const BackupSettingsView: React.FC<BackupSettingsViewProps> = ({
  settings,
  records,
  currentUser,
  onSaveSettings,
  onTriggerBackupNow,
  onRefreshRecords,
  onRestoreSuccess,
}) => {
  const [formData, setFormData] = useState<AutoBackupSettings>(settings);
  const [restoreMode, setRestoreMode] = useState<'overwrite' | 'merge'>('overwrite');
  const [restoreStatus, setRestoreStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const handleToggle = (key: keyof AutoBackupSettings) => {
    const updated = {
      ...formData,
      [key]: !formData[key]
    };
    setFormData(updated);
    onSaveSettings(updated);
  };

  const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const updated: AutoBackupSettings = {
      ...formData,
      frequency: e.target.value as AutoBackupSettings['frequency']
    };
    setFormData(updated);
    onSaveSettings(updated);
  };

  const handleDownloadLatestSnapshot = async () => {
    const res = await BackupService.createBackupSnapshot('cloud_download', currentUser, 'ទាញយកឯកសារដោយដៃ (Manual Export)');
    BackupService.downloadBackupFile(res.payload);
    onRefreshRecords();
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const res = await BackupService.restoreFromJSON(content, currentUser, restoreMode);
      setRestoreStatus(res);
      if (res.success) {
        onRestoreSuccess();
        onRefreshRecords();
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-900 text-white flex items-center justify-center shadow-xs">
              <CloudCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                ប្រព័ន្ធស្វ័យប្រវត្តិសម្រាប់បម្រុងទុកទិន្នន័យលើពពក (Automated Cloud Backup)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ធានាសុវត្ថិភាពទិន្នន័យលិខិតរដ្ឋបាល ១០០% ជាមួយការបម្រុងទុកជាប្រចាំ ត្រួតពិនិត្យ SHA-256 Checksum និងការតភ្ជាប់ Cloud Sync
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onTriggerBackupNow}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors shadow-xs cursor-pointer"
            >
              <HardDrive className="w-4 h-4" />
              <span>បម្រុងទុកទិន្នន័យឥឡូវនេះ</span>
            </button>
            <button
              onClick={handleDownloadLatestSnapshot}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>ទាញយកកញ្ចប់ JSON</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Settings & Automation Controls (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Automated Schedule Settings */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>ការកំណត់ស្វ័យប្រវត្តិកម្ម (Automation)</span>
              </h3>
            </div>

            {/* Enable Auto Backup */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <div className="font-bold text-slate-900">បើកដំណើរការបម្រុងទុកស្វ័យប្រវត្តិ</div>
                <div className="text-[11px] text-slate-500">ប្រព័ន្ធនឹងធ្វើការបម្រុងទុកដោយស្វ័យប្រវត្តិតាមកាលកំណត់</div>
              </div>
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={() => handleToggle('enabled')}
                className="w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-900 cursor-pointer"
              />
            </div>

            {/* Frequency Selector */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                ប្រេកង់នៃការបម្រុងទុកទិន្នន័យ (Backup Frequency)
              </label>
              <select
                value={formData.frequency}
                onChange={handleFrequencyChange}
                disabled={!formData.enabled}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-900 text-slate-800 disabled:opacity-50"
              >
                <option value="change">រាល់ពេលមានការផ្លាស់ប្តូរទិន្នន័យ (Real-time on Change)</option>
                <option value="hourly">រៀងរាល់ ១ ម៉ោងម្តង (Every 1 Hour)</option>
                <option value="daily">ប្រចាំថ្ងៃនៅពាក់កណ្តាលអធ្រាត្រ (Daily at Midnight)</option>
              </select>
            </div>

            {/* Auto sync Telegram */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <div className="font-bold text-slate-900">ធ្វើសមកាលកម្មទៅ Telegram Cloud</div>
                <div className="text-[11px] text-slate-500">ផ្ញើរបាយការណ៍បម្រុងទុកទៅ Telegram Bot ស្វ័យប្រវត្តិ</div>
              </div>
              <input
                type="checkbox"
                checked={formData.autoSyncTelegram}
                onChange={() => handleToggle('autoSyncTelegram')}
                className="w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-900 cursor-pointer"
              />
            </div>

            {/* Encrypt Data */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <div className="font-bold text-slate-900">ការការពារទិន្នន័យ SHA-256 Checksum</div>
                <div className="text-[11px] text-slate-500">បង្កើតកូដ Checksum ធានាភាពសុក្រឹត មិនអាចកែបន្លំបាន</div>
              </div>
              <input
                type="checkbox"
                checked={formData.encryptData}
                onChange={() => handleToggle('encryptData')}
                className="w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-900 cursor-pointer"
              />
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-[11px] text-slate-600 space-y-1">
              <div>
                <strong>ការបម្រុងទុកចុងក្រោយ៖</strong>{' '}
                <span className="font-mono">{formData.lastBackupTime || 'មិនទាន់មាន'}</span>
              </div>
              <div>
                <strong>ទីតាំងពពក៖</strong> DocuTrack Secure Cloud Storage (Asia-Pacific)
              </div>
            </div>
          </div>

          {/* Restore Data Section */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-600" />
              <span>ទាញយកទិន្នន័យមកវិញ (Data Restore & Recovery)</span>
            </h3>
            <p className="text-slate-500 text-[11px]">
              ជ្រើសរើសឯកសារបម្រុងទុក JSON ដើម្បីទាញយកទិន្នន័យលិខិតមកវិញក្នុងករណីមានការបាត់បង់ ឬផ្លាស់ប្តូរឧបករណ៍
            </p>

            {/* Restore Mode selection */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">របៀបទាញយកទិន្នន័យ៖</label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 p-2 rounded border border-slate-200 bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="restoreMode"
                    value="overwrite"
                    checked={restoreMode === 'overwrite'}
                    onChange={() => setRestoreMode('overwrite')}
                    className="text-blue-900 focus:ring-blue-900"
                  />
                  <span>ជំនួសទាំងអស់ (Overwrite)</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded border border-slate-200 bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="restoreMode"
                    value="merge"
                    checked={restoreMode === 'merge'}
                    onChange={() => setRestoreMode('merge')}
                    className="text-blue-900 focus:ring-blue-900"
                  />
                  <span>បញ្ចូលរួមគ្នា (Merge)</span>
                </label>
              </div>
            </div>

            {/* Upload File Input */}
            <div className="pt-1">
              <label className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                <Upload className="w-5 h-5 text-slate-400 mb-1" />
                <span className="font-semibold text-blue-900">ជ្រើសរើសឯកសារ Backup .json</span>
                <span className="text-[10px] text-slate-500 mt-0.5">ចុចដើម្បីស្វែងរកឯកសារពីកុំព្យូទ័ររបស់អ្នក</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleRestoreFile}
                  className="hidden"
                />
              </label>
            </div>

            {/* Status Feedback */}
            {restoreStatus && (
              <div
                className={`p-3 rounded-lg border flex items-start gap-2 ${
                  restoreStatus.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {restoreStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                )}
                <div className="font-medium">{restoreStatus.message}</div>
              </div>
            )}
          </div>
        </div>

        {/* Backup History Table (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-xs">
                ប្រវត្តិនៃការបម្រុងទុកទិន្នន័យ (Cloud Snapshots History)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                កត់ត្រារាល់ពេលបម្រុងទុក និងកូដត្រួតពិនិត្យសុក្រឹតភាព Checksum
              </p>
            </div>
            <button
              onClick={onRefreshRecords}
              title="ផ្ទុកឡើងវិញ"
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1 max-h-[560px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 text-[11px] font-semibold">
                  <th className="py-2.5 px-3">លេខកូដ Snapshot</th>
                  <th className="py-2.5 px-3">កាលបរិច្ឆេទ & ម៉ោង</th>
                  <th className="py-2.5 px-3">ចំនួនឯកសារ</th>
                  <th className="py-2.5 px-3">ទំហំ & Checksum</th>
                  <th className="py-2.5 px-3">ស្ថានភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      មិនទាន់មានកំណត់ត្រាបម្រុងទុកទិន្នន័យនៅឡើយទេ
                    </td>
                  </tr>
                ) : (
                  records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-blue-900 whitespace-nowrap">
                        {rec.id}
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                        {rec.timestamp}
                      </td>
                      <td className="py-3 px-3 tabular-nums font-medium text-slate-800">
                        {rec.documentCount} ឯកសារ
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-mono text-[11px] text-slate-700">
                          {(rec.sizeBytes / 1024).toFixed(1)} KB
                        </div>
                        <div className="font-mono text-[10px] text-slate-400">
                          {rec.checksum}
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>ជោគជ័យ</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
