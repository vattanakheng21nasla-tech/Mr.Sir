import React from 'react';
import { CurrentUser } from '../types/document';
import { Plus, ShieldCheck, UserCheck, LogOut } from 'lucide-react';

interface TopNavigationProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenNewDocModal: () => void;
  currentUser: CurrentUser;
  onChangeUserRole: (role: CurrentUser['role']) => void;
  onLogout: () => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewDocModal,
  currentUser,
  onChangeUserRole,
  onLogout,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      {/* Strict 3-Zone Top Bar Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-blue-900 text-amber-400 flex items-center justify-center font-bold text-lg shadow-sm border border-blue-800">
              រដ្ឋ
            </div>
            <button
              onClick={() => onSelectTab('dashboard')}
              className="text-left cursor-pointer group"
            >
              <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap group-hover:text-blue-900 transition-colors">
                DocuTrack រដ្ឋបាល
              </span>
              <span className="block text-[11px] text-slate-500 font-normal leading-tight">
                ប្រព័ន្ធគ្រប់គ្រងលិខិតចេញ-ចូល
              </span>
            </button>
          </div>

          {/* Zone 2: 4-5 clean single-line navigation links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 pb-1 cursor-pointer ${
                currentTab === 'dashboard'
                  ? 'text-blue-900 font-semibold border-b-2 border-blue-900'
                  : ''
              }`}
            >
              ផ្ទាំងគ្រប់គ្រង
            </button>
            <button
              onClick={() => onSelectTab('incoming')}
              className={`hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 pb-1 cursor-pointer ${
                currentTab === 'incoming'
                  ? 'text-blue-900 font-semibold border-b-2 border-blue-900'
                  : ''
              }`}
            >
              លិខិតចូល
            </button>
            <button
              onClick={() => onSelectTab('outgoing')}
              className={`hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 pb-1 cursor-pointer ${
                currentTab === 'outgoing'
                  ? 'text-blue-900 font-semibold border-b-2 border-blue-900'
                  : ''
              }`}
            >
              លិខិតចេញ
            </button>
            <button
              onClick={() => onSelectTab('tracking')}
              className={`hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 pb-1 cursor-pointer ${
                currentTab === 'tracking'
                  ? 'text-blue-900 font-semibold border-b-2 border-blue-900'
                  : ''
              }`}
            >
              តាមដាន & QR
            </button>
            <button
              onClick={() => onSelectTab('telegram')}
              className={`hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 pb-1 cursor-pointer ${
                currentTab === 'telegram'
                  ? 'text-blue-900 font-semibold border-b-2 border-blue-900'
                  : ''
              }`}
            >
              ប្រព័ន្ធ Telegram
            </button>
            <button
              onClick={() => onSelectTab('backup')}
              className={`hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 pb-1 cursor-pointer ${
                currentTab === 'backup'
                  ? 'text-blue-900 font-semibold border-b-2 border-blue-900'
                  : ''
              }`}
            >
              បម្រុងទុកពពក & សុវត្ថិភាព
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenNewDocModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ចុះបញ្ជីលិខិតថ្មី</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-header Workspace Bar with Role switcher and breadcrumb */}
      <div className="bg-slate-50 border-t border-slate-100 px-4 sm:px-6 lg:px-8 py-2 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">ព្រះរាជាណាចក្រកម្ពុជា</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>ជាតិ សាសនា ព្រះមហាក្សត្រ</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span className="text-slate-500">អគ្គនាយកដ្ឋានរដ្ឋបាល និងហិរញ្ញវត្ថុ</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-700 bg-white px-2.5 py-1 rounded border border-slate-200">
            <UserCheck className="w-3.5 h-3.5 text-blue-800" />
            <span className="font-medium">{currentUser.name}</span>
            <span className="text-slate-400">|</span>
            <select
              value={currentUser.role}
              onChange={(e) => onChangeUserRole(e.target.value as CurrentUser['role'])}
              className="bg-transparent border-0 text-xs font-semibold text-blue-900 focus:ring-0 cursor-pointer outline-none"
              title="ប្តូរតួនាទីអ្នកប្រើប្រាស់"
            >
              <option value="admin">អភិបាលប្រព័ន្ធ (Admin)</option>
              <option value="director">ថ្នាក់ដឹកនាំ (Director)</option>
              <option value="officer">មន្ត្រីរដ្ឋបាល (Clerk)</option>
            </select>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ប្រព័ន្ធការពារសុវត្ថិភាពខ្ពស់</span>
          </div>

          <button
            onClick={onLogout}
            title="ចាកចេញពីប្រព័ន្ធ"
            className="flex items-center gap-1 px-2.5 py-1 text-rose-700 hover:text-white hover:bg-rose-600 bg-rose-50 border border-rose-200 rounded transition-colors cursor-pointer text-xs font-semibold"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>ចាកចេញ</span>
          </button>
        </div>
      </div>
    </header>
  );
};
