import React, { useEffect, useState } from 'react';
import { DocumentItem } from '../types/document';
import QRCode from 'qrcode';
import { Printer, ArrowLeft } from 'lucide-react';

interface OfficialPrintViewProps {
  document: DocumentItem;
  onBack: () => void;
}

export const OfficialPrintView: React.FC<OfficialPrintViewProps> = ({
  document,
  onBack,
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  useEffect(() => {
    QRCode.toDataURL(
      JSON.stringify({
        code: document.trackingCode,
        num: document.letterNumber,
        subject: document.subject.slice(0, 50),
        url: `${window.location.origin}/?track=${document.trackingCode}`
      }),
      { width: 140, margin: 1 }
    ).then((url) => setQrCodeDataUrl(url));
  }, [document]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Action header bar (hidden when printed) */}
      <div className="no-print bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-blue-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ត្រឡប់ទៅបញ្ជីលិខិត</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">ទម្រង់ប័ណ្ណផ្លូវការរដ្ឋបាល (ស្តង់ដារ A4)</span>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>បោះពុម្ពឥឡូវនេះ (Print)</span>
          </button>
        </div>
      </div>

      {/* Official Printable Area */}
      <div
        id="print-area"
        className="bg-white p-8 sm:p-12 rounded-xl border border-slate-200 shadow-sm max-w-4xl mx-auto text-slate-900 font-sans"
      >
        {/* Kingdom Header */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6 mb-6">
          {/* Left: Ministry / Organization */}
          <div className="space-y-1 text-xs">
            <div className="font-bold text-sm tracking-wide">អគ្គនាយកដ្ឋានរដ្ឋបាល និងហិរញ្ញវត្ថុ</div>
            <div className="text-slate-700">នាយកដ្ឋាន៖ {document.assignedDepartment}</div>
            <div className="text-slate-700 font-mono text-[11px]">
              លេខសៀវភៅបញ្ជី៖ {document.inOutBookNumber || '......../២០២៦'}
            </div>
          </div>

          {/* Center: Kingdom Motto */}
          <div className="text-center space-y-1">
            <div className="font-bold text-base">ព្រះរាជាណាចក្រកម្ពុជា</div>
            <div className="font-semibold text-sm">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
            <div className="text-sm font-serif">ಌ ￮ ಌ</div>
          </div>

          {/* Right: QR Code for Digital Tracking */}
          <div className="text-center">
            {qrCodeDataUrl && (
              <img
                src={qrCodeDataUrl}
                alt="Verification QR"
                className="w-24 h-24 mx-auto border border-slate-300 p-1 rounded"
              />
            )}
            <div className="font-mono text-[10px] text-slate-700 mt-1 font-bold">
              {document.trackingCode}
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-lg font-bold uppercase tracking-wider text-slate-900">
            ប័ណ្ណតាមដាន និងបញ្ជូនលិខិតរដ្ឋបាល
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            {document.direction === 'in' ? 'លិខិតចូលរដ្ឋបាល (Inward Dispatch)' : 'លិខិតចេញរដ្ឋបាល (Outward Dispatch)'}
          </p>
        </div>

        {/* Document Metadata Table */}
        <div className="border border-slate-300 rounded-lg overflow-hidden text-xs mb-6">
          <div className="grid grid-cols-2 divide-x divide-slate-300 border-b border-slate-300">
            <div className="p-2.5 bg-slate-50 font-semibold text-slate-700">
              លេខលិខិតផ្លូវការ៖ <span className="font-bold text-slate-900 font-mono">{document.letterNumber}</span>
            </div>
            <div className="p-2.5 bg-slate-50 font-semibold text-slate-700">
              កាលបរិច្ឆេទចុះបញ្ជី៖ <span className="font-mono tabular-nums text-slate-900">{document.dateReceivedOrIssued}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 divide-x divide-slate-300 border-b border-slate-300">
            <div className="p-2.5">
              <span className="text-slate-500">ស្ថាប័ន/អង្គភាពផ្ញើ៖</span>{' '}
              <span className="font-semibold text-slate-900">{document.sender}</span>
            </div>
            <div className="p-2.5">
              <span className="text-slate-500">ស្ថាប័ន/អង្គភាពទទួល៖</span>{' '}
              <span className="font-semibold text-slate-900">{document.receiver}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 divide-x divide-slate-300 border-b border-slate-300">
            <div className="p-2.5">
              <span className="text-slate-500">ប្រភេទឯកសារ៖</span>{' '}
              <span className="font-medium text-slate-800">{document.docType}</span>
            </div>
            <div className="p-2.5">
              <span className="text-slate-500">កម្រិតបន្ទាន់៖</span>{' '}
              <span className="font-bold text-slate-900">
                {document.priority === 'normal' ? 'ធម្មតា' : document.priority === 'urgent' ? 'បន្ទាន់' : 'បន្ទាន់បំផុត'}
              </span>
            </div>
            <div className="p-2.5">
              <span className="text-slate-500">កម្រិតសម្ងាត់៖</span>{' '}
              <span className="font-medium text-slate-800">{document.confidentiality}</span>
            </div>
          </div>

          <div className="p-3 border-b border-slate-300 bg-slate-50/50">
            <div className="font-bold text-slate-900 mb-1">កម្មវត្ថុ៖</div>
            <div className="text-slate-800 font-medium leading-relaxed">{document.subject}</div>
          </div>

          {document.summary && (
            <div className="p-3">
              <div className="font-semibold text-slate-700 mb-0.5">ខ្លឹមសារសង្ខេប៖</div>
              <div className="text-slate-600 leading-relaxed">{document.summary}</div>
            </div>
          )}
        </div>

        {/* Workflow & Leadership Directives Table */}
        <div className="mb-6">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2">
            កំណត់ត្រាចំណារ និងការណែនាំរបស់ថ្នាក់ដឹកនាំ
          </h2>
          <table className="w-full border border-slate-300 text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-300">
                <th className="py-2 px-3 border-r border-slate-300 w-12 text-center">ល.រ</th>
                <th className="py-2 px-3 border-r border-slate-300 w-36">កាលបរិច្ឆេទ & ម៉ោង</th>
                <th className="py-2 px-3 border-r border-slate-300 w-44">មន្ត្រី/ថ្នាក់ដឹកនាំ</th>
                <th className="py-2 px-3">ខ្លឹមសារចំណារ ឬការណែនាំ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {document.workflowLogs.map((log, index) => (
                <tr key={log.id} className="align-top">
                  <td className="py-2.5 px-3 border-r border-slate-300 text-center font-mono">
                    {index + 1}
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-300 font-mono tabular-nums text-slate-700">
                    {log.timestamp}
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-300 font-medium text-slate-900">
                    <div>{log.actorName}</div>
                    <div className="text-[10px] text-slate-500">{log.actorRole}</div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-800">
                    <div className="font-semibold text-slate-900">{log.actionTitle}</div>
                    {log.notes && (
                      <div className="mt-1 text-slate-700 italic">"{log.notes}"</div>
                    )}
                  </td>
                </tr>
              ))}
              {document.workflowLogs.length < 3 && (
                <tr className="h-16">
                  <td className="border-r border-slate-300 text-center font-mono text-slate-400">
                    {document.workflowLogs.length + 1}
                  </td>
                  <td className="border-r border-slate-300"></td>
                  <td className="border-r border-slate-300"></td>
                  <td className="text-slate-400 italic p-3">................................................</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Official Signatures Grid */}
        <div className="grid grid-cols-2 gap-8 pt-8 mt-6 border-t border-slate-300 text-xs">
          <div className="text-center space-y-16">
            <div>
              <div className="font-semibold text-slate-800">មន្ត្រីទទួលបន្ទុក / រដ្ឋបាល</div>
              <div className="text-slate-500 text-[11px] mt-0.5">បានត្រួតពិនិត្យ និងចុះបញ្ជី</div>
            </div>
            <div className="font-bold text-slate-900">{document.assignedOfficer}</div>
          </div>

          <div className="text-center space-y-16">
            <div>
              <div className="text-slate-600">រាជធានីភ្នំពេញ, ថ្ងៃទី....... ខែ....... ឆ្នាំ២០២៦</div>
              <div className="font-bold text-slate-900 mt-1">ប្រធានអង្គភាព / ថ្នាក់ដឹកនាំ</div>
            </div>
            <div className="font-bold text-slate-900">ឯកឧត្តម ហេង វឌ្ឍនៈ</div>
          </div>
        </div>

        {/* Footer verification note */}
        <div className="mt-10 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-500 flex items-center justify-between">
          <span>បោះពុម្ពចេញពីប្រព័ន្ធ DocuTrack ស្វ័យប្រវត្តិ</span>
          <span className="font-mono">Verification Hash: {document.trackingCode}-SEC-KH</span>
          <span>កាលបរិច្ឆេទបោះពុម្ព: {new Date().toLocaleDateString('km-KH')}</span>
        </div>
      </div>
    </div>
  );
};
