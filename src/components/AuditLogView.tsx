import React from 'react';
import { AuditLog } from '../types/document';
import { ShieldCheck, History } from 'lucide-react';

interface AuditLogViewProps {
  logs: AuditLog[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-blue-900" />
          <h3 className="font-bold text-slate-900 text-xs">
            កំណត់ត្រាសវនកម្ម និងសុវត្ថិភាពរដ្ឋបាល (Security Audit Trail)
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>ទិន្នន័យត្រូវបានកត់ត្រា និងការពារមិនអាចកែប្រែបាន</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 text-[11px] font-semibold">
              <th className="py-2.5 px-4 whitespace-nowrap">កាលបរិច្ឆេទ & ម៉ោង</th>
              <th className="py-2.5 px-4 whitespace-nowrap">អ្នកអនុវត្ត</th>
              <th className="py-2.5 px-4 whitespace-nowrap">តួនាទី</th>
              <th className="py-2.5 px-4 whitespace-nowrap">សកម្មភាព</th>
              <th className="py-2.5 px-4">ព័ត៌មានលម្អិត</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-400">
                  មិនទាន់មានកំណត់ត្រាសវនកម្មនៅឡើយទេ
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                    {log.userName}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                    {log.userRole === 'admin'
                      ? 'អភិបាលប្រព័ន្ធ'
                      : log.userRole === 'director'
                      ? 'ថ្នាក់ដឹកនាំ'
                      : 'មន្ត្រីរដ្ឋបាល'}
                  </td>
                  <td className="py-3 px-4 font-medium text-blue-900 whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    {log.details}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
