import React, { useState } from 'react';
import { TelegramConfig, TelegramMessageLog } from '../types/document';
import { TelegramService, DetectedTelegramChat } from '../services/telegramService';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Bell,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Wand2,
  Users,
  User,
  ArrowRight,
  ShieldAlert,
  Info,
  Paperclip,
  Download
} from 'lucide-react';

interface TelegramSettingsViewProps {
  config: TelegramConfig;
  logs: TelegramMessageLog[];
  onSaveConfig: (config: TelegramConfig) => void;
  onRefreshLogs: () => void;
}

export const TelegramSettingsView: React.FC<TelegramSettingsViewProps> = ({
  config,
  logs,
  onSaveConfig,
  onRefreshLogs,
}) => {
  const [formData, setFormData] = useState<TelegramConfig>(config);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; botUsername?: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

  // Auto-detection state
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedChats, setDetectedChats] = useState<DetectedTelegramChat[]>([]);
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const [showDetector, setShowDetector] = useState(false);
  const [botUsername, setBotUsername] = useState<string | null>(null);

  const handleToggle = (key: keyof TelegramConfig) => {
    setFormData((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await TelegramService.testConnection(formData.botToken, formData.chatId);
    setTestResult(res);
    if (res.botUsername) {
      setBotUsername(res.botUsername.replace('@', ''));
    }
    if (res.correctedChatId) {
      setFormData((prev) => ({ ...prev, chatId: res.correctedChatId || prev.chatId }));
    }
    setTesting(false);
    onRefreshLogs();
  };

  const handleSendSampleAlert = async () => {
    setTesting(true);
    const sampleMessage = `🇰🇭 **ប្រព័ន្ធគ្រប់គ្រងលិខិតរដ្ឋបាល - សារជូនដំណឹងសាកល្បង**
━━━━━━━━━━━━━━━━━━━━━━━━
📑 **ទិសដៅ៖** លិខិតចូល (Incoming)
🔖 **លេខកូដតាមដាន៖** \`DOC-2026-IN-DEMO\`
📋 **លេខលិខិត៖** ៨៨៨/២៦ ស.ជ.ណ
🎯 **កម្មវត្ថុ៖** ការធ្វើតេស្តសាកល្បងប្រព័ន្ធជូនដំណឹង Telegram ស្វ័យប្រវត្តិ
🏢 **អង្គភាពផ្ញើ៖** ទីស្ដីការគណៈរដ្ឋមន្ត្រី
⚡ **កម្រិតបន្ទាន់៖** 🚨 បន្ទាន់បំផុត (Top Urgent)
👤 **មន្ត្រីទទួលបន្ទុក៖** ឯកឧត្តម ហេង វឌ្ឍនៈ
📊 **ស្ថានភាព៖** ✅ បានតភ្ជាប់ជោគជ័យ
━━━━━━━━━━━━━━━━━━━━━━━━
⏰ **ពេលវេលា៖** ${new Date().toLocaleString('km-KH')}`;

    const res = await TelegramService.sendToTelegram(
      sampleMessage,
      formData,
      'DOC-2026-IN-DEMO',
      'test'
    );

    if (res.correctedChatId) {
      setFormData((prev) => ({ ...prev, chatId: res.correctedChatId || prev.chatId }));
    }

    setTestResult(res);
    setTesting(false);
    onRefreshLogs();
  };

  const handleSendSampleAttachment = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await TelegramService.sendSampleAttachment(formData);
    setTestResult(res);
    setTesting(false);
    onRefreshLogs();
  };

  // Auto-Detect Chat ID by querying bot updates
  const handleDetectChats = async () => {
    if (!formData.botToken.trim()) {
      alert('សូមបញ្ចូល Bot Token ជាមុនសិន!');
      return;
    }
    setIsDetecting(true);
    setDetectionError(null);
    setShowDetector(true);

    const res = await TelegramService.getRecentChats(formData.botToken);
    setIsDetecting(false);

    if (res.success) {
      setDetectedChats(res.chats);
    } else {
      setDetectionError(res.error || 'មិនអាចទាញយកទិន្នន័យបាន');
    }
  };

  const handleSelectDetectedChat = (chat: DetectedTelegramChat) => {
    const updated = {
      ...formData,
      chatId: chat.id
    };
    setFormData(updated);
    onSaveConfig(updated);
    setShowDetector(false);
    setTestResult({
      success: true,
      message: `បានជ្រើសរើស ${chat.title} (ID: ${chat.id}) ជោគជ័យ! សូមចុច "តេស្តការតភ្ជាប់" ដើម្បីសាកល្បងផ្ញើសារ។`
    });
  };

  // Detect if chatId is missing -100 prefix
  const isMissingPrefix100 =
    formData.chatId.trim().startsWith('-') && !formData.chatId.trim().startsWith('-100');
  const corrected100Id = isMissingPrefix100
    ? `-100${formData.chatId.trim().replace(/^-/, '')}`
    : null;

  const apply100Fix = () => {
    if (corrected100Id) {
      const updated = {
        ...formData,
        chatId: corrected100Id
      };
      setFormData(updated);
      onSaveConfig(updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-xs">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                ប្រព័ន្ធជូនដំណឹងតាម Telegram (Telegram Bot Integration)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                តភ្ជាប់ Telegram Bot ដើម្បីទទួលបានការដាស់តឿនលិខិតចូល-ចេញ បន្ទាន់បំផុត និងចំណារថ្នាក់ដឹកនាំស្វ័យប្រវត្តិ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTroubleshoot(!showTroubleshoot)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
              <span>ដោះស្រាយកំហុស 'chat not found'</span>
            </button>

            <button
              onClick={() => setShowGuide(!showGuide)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-900" />
              <span>{showGuide ? 'លាក់ការណែនាំ' : 'របៀបបង្កើត Bot'}</span>
            </button>
          </div>
        </div>

        {/* Dedicated Troubleshooting Box for 'chat not found' */}
        {showTroubleshoot && (
          <div className="mt-5 p-4 bg-amber-50/90 border border-amber-300 rounded-xl text-xs space-y-3 animate-in fade-in duration-200">
            <div className="font-bold text-amber-950 flex items-center gap-2 text-sm">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              <span>របៀបដោះស្រាយកំហុស "Telegram API Error: Bad Request: chat not found"</span>
            </div>

            <p className="text-amber-900 leading-relaxed">
              កំហុស <strong>"chat not found"</strong> កើតឡើងដោយសារហេតុផល <strong>២ សំខាន់</strong>៖
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-800">
              <div className="bg-white p-3 rounded-lg border border-amber-200 space-y-1.5">
                <div className="font-bold text-blue-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-800" />
                  <span>ករណីទី១៖ ផ្ញើទៅកាន់ Group ឬ Channel</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
                  <li>
                    <strong>ត្រូវ Add Bot ចូល Group/Channel ជាមុន៖</strong> បើក Group/Channel របស់អ្នក $\to$ Add Member $\to$ ស្វែងរក Bot របស់អ្នក $\to$ បន្ថែមវាចូល រួចតម្លើងជា <strong>Admin (សិទ្ធិ Post Messages)</strong>។
                  </li>
                  <li>
                    <strong>លេខកូដ Group ត្រូវមានបុព្វបទ <code>-100</code>៖</strong> ប្រសិនបើអ្នកមាន Chat ID ដូចជា <code>-5470186297</code> លេខសម្គាល់ពិតប្រាកដក្នុង Telegram API គឺ <strong><code>-1005470186297</code></strong>។
                  </li>
                </ul>
              </div>

              <div className="bg-white p-3 rounded-lg border border-amber-200 space-y-1.5">
                <div className="font-bold text-blue-900 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-800" />
                  <span>ករណីទី២៖ ផ្ញើទៅគណនីផ្ទាល់ខ្លួន (Personal Chat)</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
                  <li>
                    <strong>ត្រូវចុច Start លើ Bot ជាមុន៖</strong> Telegram ហាមឃាត់មិនឱ្យ Bot ផ្ញើសារទៅកាន់បុគ្គលណាដែលមិនទាន់ចុច <strong>"Start"</strong> លើ Bot នោះឡើយ។
                  </li>
                  <li>
                    ចូលទៅកាន់ Bot របស់អ្នកលើ Telegram ហើយចុចប៊ូតុង <strong>Start</strong> (ឬផ្ញើសារ <code>/start</code>)។
                  </li>
                  <li>
                    បន្ទាប់មកប្រើប៊ូតុង <strong>"ស្វែងរក Chat ID ស្វ័យប្រវត្តិ"</strong> ខាងក្រោម ដើម្បីទាញយក Chat ID ភ្លាមៗ។
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Step-by-Step Guide in Khmer */}
        {showGuide && (
          <div className="mt-5 p-4 bg-sky-50/70 border border-sky-200 rounded-xl text-xs space-y-3 animate-in fade-in duration-200">
            <div className="font-bold text-sky-950 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>ការណែនាំបង្កើត Telegram Bot ក្នុង ១ នាទី (ឥតគិតថ្លៃ)៖</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-700">
              <li>
                បើកកម្មវិធី Telegram ហើយស្វែងរកគណនី{' '}
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-sky-700 underline"
                >
                  @BotFather
                </a>
              </li>
              <li>ផ្ញើពាក្យបញ្ជា <code className="bg-white px-1.5 py-0.5 rounded border border-sky-200 font-mono text-[11px]">/newbot</code> ហើយដាក់ឈ្មោះ Bot និង Username បញ្ចប់ដោយ <code className="bg-white px-1.5 py-0.5 rounded border border-sky-200 font-mono text-[11px]">_bot</code></li>
              <li>BotFather នឹងផ្តល់ជូន <strong>HTTP API Token</strong> (ឧ. <code className="bg-white px-1 text-[11px] font-mono">123456789:ABCdef...</code>)។ ចម្លង Token នោះមកដាក់ក្នុងប្រអប់ខាងក្រោម។</li>
              <li>
                ដើម្បីដឹង <strong>Chat ID</strong> អ្នកអាច Add Bot ចូល Group ឬ Chat ទៅ Bot រួចចុចប៊ូតុង <strong>"ស្វែងរក Chat ID ស្វ័យប្រវត្តិ"</strong> ខាងក្រោម ឬឆែកតាម{' '}
                <a
                  href="https://t.me/userinfobot"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-sky-700 underline"
                >
                  @userinfobot
                </a>។
              </li>
            </ol>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Configuration Form (Left 7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <form onSubmit={handleSave} className="space-y-5 text-xs">
            {/* Enable switch */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <div className="font-bold text-slate-900">ដំណើរការប្រព័ន្ធជូនដំណឹង Telegram</div>
                <div className="text-[11px] text-slate-500">បើក/បិទការបញ្ជូនសារស្វ័យប្រវត្តិចេញពីប្រព័ន្ធ</div>
              </div>
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={() => handleToggle('enabled')}
                className="w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-900 cursor-pointer"
              />
            </div>

            {/* Bot Token input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-700 font-semibold">
                  Telegram Bot Token <span className="text-rose-500">*</span>
                </label>
                {botUsername && (
                  <a
                    href={`https://t.me/${botUsername}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-900 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>បើក Bot @{botUsername} លើ Telegram</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <input
                type="text"
                value={formData.botToken}
                onChange={(e) => setFormData({ ...formData, botToken: e.target.value })}
                placeholder="ឧ. 7123456789:AAFlkBm..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-900 text-slate-800 font-mono text-xs"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                ទទួលបានពី @BotFather លើ Telegram
              </span>
            </div>

            {/* Chat ID and Channel ID with Auto-Detect Button */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-700 font-semibold">
                      Telegram Chat ID <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleDetectChats}
                      disabled={isDetecting || !formData.botToken}
                      className="text-[11px] text-blue-900 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40"
                    >
                      <Wand2 className={`w-3 h-3 ${isDetecting ? 'animate-spin' : ''}`} />
                      <span>{isDetecting ? 'កំពុងស្វែងរក...' : 'ស្វែងរក Chat ID ស្វ័យប្រវត្តិ'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formData.chatId}
                    onChange={(e) => setFormData({ ...formData, chatId: e.target.value })}
                    placeholder="ឧ. -1005470186297 ឬ 123456789"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-900 text-slate-800 font-mono text-xs"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    លេខសម្គាល់គណនី ឬគ្រុបរដ្ឋបាល
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Channel ID (ជាជម្រើស)
                  </label>
                  <input
                    type="text"
                    value={formData.channelId || ''}
                    onChange={(e) => setFormData({ ...formData, channelId: e.target.value })}
                    placeholder="ឧ. @docutrack_channel"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-900 text-slate-800 font-mono text-xs"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    ឈ្មោះ Channel សម្រាប់ផ្សព្វផ្សាយទូទៅ
                  </span>
                </div>
              </div>

              {/* One-click Fix for missing -100 prefix */}
              {isMissingPrefix100 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-[11px] text-blue-950">
                    <span className="font-bold">💡 សម្គាល់៖ </span>
                    Chat ID <code className="bg-white px-1 font-mono font-bold">{formData.chatId}</code> ហាក់ដូចជាខ្វះបុព្វបទ <strong>-100</strong>។
                  </div>
                  <button
                    type="button"
                    onClick={apply100Fix}
                    className="px-3 py-1 bg-blue-900 hover:bg-blue-800 text-white rounded text-xs font-semibold cursor-pointer shrink-0"
                  >
                    ប្តូរទៅជា {corrected100Id} ភ្លាមៗ
                  </button>
                </div>
              )}
            </div>

            {/* Auto-Detected Chats Picker Box */}
            {showDetector && (
              <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Wand2 className="w-4 h-4 text-blue-900" />
                    <span>លទ្ធផលស្វែងរក Chat ពី Telegram Bot Updates</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDetector(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                  >
                    បិទ
                  </button>
                </div>

                {isDetecting ? (
                  <div className="text-center py-4 text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-blue-900" />
                    <span>កំពុងទាញយកទិន្នន័យពី Telegram API...</span>
                  </div>
                ) : detectedChats.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {detectedChats.map((c) => (
                      <div
                        key={c.id}
                        className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between hover:border-blue-900 transition-colors"
                      >
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            {c.type === 'private' ? (
                              <User className="w-3.5 h-3.5 text-blue-700" />
                            ) : (
                              <Users className="w-3.5 h-3.5 text-emerald-700" />
                            )}
                            <span>{c.title}</span>
                            <span className="text-[10px] text-slate-400 font-normal">({c.type})</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            ID: <strong className="text-blue-900">{c.id}</strong> {c.username && `· ${c.username}`}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSelectDetectedChat(c)}
                          className="px-3 py-1 bg-blue-900 text-white rounded text-xs font-medium hover:bg-blue-800 transition-colors cursor-pointer shrink-0 ml-2"
                        >
                          ជ្រើសរើស
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-600 text-xs space-y-2 py-2">
                    <p className="font-medium text-amber-800">
                      ⚠️ មិនទាន់រកឃើញ Chat ឬ Group ណាដែលបានទាក់ទងជាមួយ Bot នេះនៅឡើយទេ។
                    </p>
                    <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5 text-[11px]">
                      <div>👉 <strong>របៀបឱ្យប្រព័ន្ធស្គាល់ Chat ID របស់អ្នក៖</strong></div>
                      <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1">
                        <li>
                          <strong>បើផ្ញើទៅ Group៖</strong> Add Bot របស់អ្នកចូលក្នុង Group នោះ រួចផ្ញើសារ <code>"test"</code> មួយក្នុង Group។
                        </li>
                        <li>
                          <strong>បើផ្ញើទៅគណនីផ្ទាល់ខ្លួន៖</strong> បើក Bot លើ Telegram រួចចុចប៊ូតុង <strong>Start</strong>។
                        </li>
                        <li>ត្រឡប់មកទីនេះ រួចចុចប៊ូតុង <strong>"ស្វែងរកម្តងទៀត"</strong> ខាងក្រោម។</li>
                      </ol>
                    </div>
                    <button
                      type="button"
                      onClick={handleDetectChats}
                      className="px-3 py-1.5 bg-blue-900 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>ស្វែងរកម្តងទៀត</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Notification Triggers Checkboxes */}
            <div className="space-y-2.5 pt-2">
              <label className="block text-slate-800 font-bold">
                ព្រឹត្តិការណ៍ដែលត្រូវជូនដំណឹងស្វ័យប្រវត្ត (Event Triggers)
              </label>

              <label className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer transition-colors">
                <span className="text-slate-700">លិខិតចូល-ចេញថ្មី (បានចុះបញ្ជី)</span>
                <input
                  type="checkbox"
                  checked={formData.notifyOnNewDoc}
                  onChange={() => handleToggle('notifyOnNewDoc')}
                  className="w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-900"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer transition-colors">
                <span className="text-slate-700">បច្ចុប្បន្នភាពស្ថានភាព ឬមានចំណារថ្នាក់ដឹកនាំ</span>
                <input
                  type="checkbox"
                  checked={formData.notifyOnStatusChange}
                  onChange={() => handleToggle('notifyOnStatusChange')}
                  className="w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-900"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer transition-colors">
                <span className="text-slate-700">ដាស់តឿនលិខិតបន្ទាន់ ឬជិតផុតកំណត់ (Urgent Alerts)</span>
                <input
                  type="checkbox"
                  checked={formData.notifyOnUrgent}
                  onChange={() => handleToggle('notifyOnUrgent')}
                  className="w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-900"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer transition-colors">
                <span className="text-slate-700">ការបម្រុងទុកទិន្នន័យលើពពកជោគជ័យ (Backup Success)</span>
                <input
                  type="checkbox"
                  checked={formData.notifyOnBackup}
                  onChange={() => handleToggle('notifyOnBackup')}
                  className="w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-900"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-sky-50/70 hover:bg-sky-100/70 rounded-lg border border-sky-200 cursor-pointer transition-colors">
                <div className="pr-3">
                  <div className="text-slate-800 font-semibold flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-blue-900" />
                    <span>រុញឯកសារភ្ជាប់ទៅ Telegram ស្វ័យប្រវត្តិ (Auto-push Attachments)</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    បញ្ជូនឯកសារភ្ជាប់ (រូបភាព PNG, PDF, សំឡេង Audio) ជាឯកសារដែលអាចទាញយក និងបើកមើលបានក្នុង Telegram
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.includeAttachmentsInTelegram !== false}
                  onChange={() => handleToggle('includeAttachmentsInTelegram')}
                  className="w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-900"
                />
              </label>
            </div>

            {/* Test result message if available */}
            {testResult && (
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                )}
                <div className="space-y-1.5">
                  <div className="font-semibold whitespace-pre-wrap leading-relaxed">
                    {testResult.message}
                  </div>
                  {!testResult.success && testResult.message.includes('chat not found') && (
                    <div className="pt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleDetectChats}
                        className="px-3 py-1 bg-blue-900 text-white rounded text-xs font-semibold hover:bg-blue-800 cursor-pointer flex items-center gap-1"
                      >
                        <Wand2 className="w-3 h-3" />
                        <span>ស្វែងរក Chat ID ស្វ័យប្រវត្តិឥឡូវនេះ</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowTroubleshoot(true)}
                        className="px-3 py-1 bg-amber-700 text-white rounded text-xs font-semibold hover:bg-amber-800 cursor-pointer"
                      >
                        មើលការណែនាំដោះស្រាយលម្អិត
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={testing}
                  onClick={handleTestConnection}
                  className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                  <span>តេស្តការតភ្ជាប់</span>
                </button>

                <button
                  type="button"
                  disabled={testing}
                  onClick={handleSendSampleAlert}
                  className="px-3.5 py-2 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg font-medium hover:bg-sky-100 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ផ្ញើសារសាកល្បង</span>
                </button>

                <button
                  type="button"
                  disabled={testing}
                  onClick={handleSendSampleAttachment}
                  className="px-3.5 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-medium hover:bg-emerald-100 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  title="សាកល្បងរុញឯកសារភ្ជាប់ PNG/PDF ទៅកាន់ Telegram ដើម្បីទាញយក និងមើល"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>តេស្តរុញឯកសារភ្ជាប់</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {saveSuccess && (
                  <span className="text-emerald-600 font-medium text-xs">បានរក្សាទុក!</span>
                )}
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-900 text-white rounded-lg font-semibold hover:bg-blue-800 transition-colors shadow-xs cursor-pointer"
                >
                  រក្សាទុកការកំណត់
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Live Dispatched Logs & Simulated Channel (Right 5 Cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-900" />
              <h3 className="font-bold text-slate-900 text-xs">
                កំណត់ត្រាជូនដំណឹង Telegram ({logs.length})
              </h3>
            </div>
            <button
              onClick={onRefreshLogs}
              title="ផ្ទុកឡើងវិញ"
              className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 max-h-[520px] pr-1">
            {logs.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs">
                <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p>មិនទាន់មានកំណត់ត្រាជូនដំណឹងនៅឡើយទេ</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  ចុច "ផ្ញើសារសាកល្បង" ដើម្បីពិនិត្យមើលទម្រង់សារ
                </p>
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-slate-500 tabular-nums">
                      {log.timestamp}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        log.status === 'sent'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.status === 'simulated'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {log.status === 'sent'
                        ? 'បញ្ជូនជោគជ័យ'
                        : log.status === 'simulated'
                        ? 'Simulated Feed'
                        : 'បរាជ័យ'}
                    </span>
                  </div>

                  <div className="text-slate-800 whitespace-pre-wrap font-sans text-[11px] leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
                    {log.content}
                  </div>

                  <div className="text-[10px] text-slate-400 flex items-center justify-between">
                    <span>គោលដៅ: {log.chatIdTarget}</span>
                    {log.documentTrackingCode && (
                      <span className="font-mono">{log.documentTrackingCode}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
