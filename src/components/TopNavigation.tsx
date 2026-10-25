import React, { useState } from 'react';
import { CurrentUser } from '../types/document';
import {
  Plus,
  ShieldCheck,
  UserCheck,
  LogOut,
  Menu,
  X,
  FileDown,
  FileUp,
  LayoutDashboard,
  QrCode,
  Send,
  Database,
  Crown,
  Users
} from 'lucide-react';

interface TopNavigationProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenNewDocModal: () => void;
  currentUser: CurrentUser;
  onChangeUserRole?: (role: CurrentUser['role']) => void;
  onLogout: () => void;
  onOpenUserManagement?: () => void;
  pendingUsersCount?: number;
  activeUsersCount?: number;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewDocModal,
  currentUser,
  onChangeUserRole,
  onLogout,
  onOpenUserManagement,
  pendingUsersCount = 0,
  activeUsersCount = 1,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTabClick = (tab: string) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  const isOwner = currentUser.role === 'owner';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-2xs">
      {/* Main Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Zone 1: Brand & Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-blue-900 text-amber-400 flex items-center justify-center font-bold text-lg shadow-sm border border-blue-800">
              រដ្ឋ
            </div>
            <button
              onClick={() => handleTabClick('dashboard')}
              className="text-left cursor-pointer group"
            >
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap group-hover:text-blue-900 transition-colors">
                DocuTrack រដ្ឋបាល
              </span>
              <span className="block text-[10px] sm:text-[11px] text-slate-500 font-normal leading-tight">
                ប្រព័ន្ធគ្រប់គ្រងលិខិតចេញ-ចូល
              </span>
            </button>
          </div>

          {/* Zone 2: Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-slate-600">
            <button
              onClick={() => handleTabClick('dashboard')}
              className={`hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer ${
                currentTab === 'dashboard'
                  ? 'text-blue-900 font-semibold border-b-2 border-blue-900'
                  : ''
              }`}
            >
              ផ្ទាំងគ្រប់គ្រង
            </button>
            <button
              onClick={() => handleTabClick('incoming')}
              className={`hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer ${
                currentTab === 'incoming'
                  ? 'text-blue-900 font-semibold border-b-2 border-blue-900'
                  : ''
              }`}
            >
              លិខិតចូល
            </button>
            <button
              onClick={() => handleTabClick('outgoing')}
              className={`hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer ${
                currentTab === 'outgoing'
                  ? 'text-blue-900 font-semibold border-b-2 border-blue-900'
                  : ''
              }`}
            >
              លិខិតចេញ
            </button>
            <button
              onClick={() => handleTabClick('tracking')}
              className={`hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer ${
                currentTab === 'tracking'
                  ? 'text-blue-900 font-semibold border-b-2 border-blue-900'
                  : ''
              }`}
            >
              តាមដាន & QR
            </button>
            <button
              onClick={() => handleTabClick('telegram')}
              className={`hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer ${
                currentTab === 'telegram'
                  ? 'text-blue-900 font-semibold border-b-2 border-blue-900'
                  : ''
              }`}
            >
              ប្រព័ន្ធ Telegram
            </button>
            <button
              onClick={() => handleTabClick('backup')}
              className={`hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer ${
                currentTab === 'backup'
                  ? 'text-blue-900 font-semibold border-b-2 border-blue-900'
                  : ''
              }`}
            >
              បម្រុងទុក & សុវត្ថិភាព
            </button>
          </nav>

          {/* Zone 3: Primary Action + Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Owner User Management Action */}
            {isOwner && onOpenUserManagement && (
              <button
                type="button"
                onClick={onOpenUserManagement}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-2xs border border-amber-500 cursor-pointer"
                title="គ្រប់គ្រង និងអនុម័តអ្នកប្រើប្រាស់ (Owner)"
              >
                <Users className="w-4 h-4 text-amber-950" />
                <span className="hidden sm:inline">គ្រប់គ្រងអ្នកប្រើ</span>
                <span className="bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-mono text-[10px]">
                  {activeUsersCount}/10
                </span>
                {pendingUsersCount > 0 && (
                  <span className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-pulse shadow-xs">
                    {pendingUsersCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={onOpenNewDocModal}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ ចុះបញ្ជីលិខិតថ្មី</span>
            </button>

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
              aria-label="បើកម៉ឺនុយទូរស័ព្ទ"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Sub-header Workspace Bar with User Role & Status */}
      <div className="bg-slate-50 border-t border-slate-100 px-4 sm:px-6 lg:px-8 py-1.5 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
        <div className="hidden sm:flex items-center gap-2">
          <span className="font-semibold text-slate-700">ព្រះរាជាណាចក្រកម្ពុជា</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>ជាតិ សាសនា ព្រះមហាក្សត្រ</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span className="text-slate-500">ការិយាល័យរដ្ឋបាល និងផែនការ</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          {/* User Profile Badge */}
          <div className="flex items-center gap-1.5 text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
            {isOwner ? (
              <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            ) : (
              <UserCheck className="w-3.5 h-3.5 text-blue-800 shrink-0" />
            )}
            <span className="font-semibold text-slate-900">{currentUser.name}</span>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-semibold text-blue-900">
              {isOwner
                ? 'ប្រធានការិយាល័យស្តីទី (Owner)'
                : currentUser.role === 'director'
                ? 'ថ្នាក់ដឹកនាំ (Director)'
                : 'មន្ត្រីរដ្ឋបាល (Officer)'}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>សុវត្ថិភាពខ្ពស់</span>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            title="ចាកចេញពីប្រព័ន្ធ (Sign Out)"
            className="flex items-center gap-1 px-2.5 py-1 text-rose-700 hover:text-white hover:bg-rose-600 bg-rose-50 border border-rose-200 rounded-md transition-colors cursor-pointer text-xs font-semibold"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>ចាកចេញ</span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation (Requirements 1 & 3: Mobile UI & Logout) */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-2 animate-in slide-in-from-top duration-150 shadow-md">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            ម៉ឺនុយប្រព័ន្ធ
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleTabClick('dashboard')}
              className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium cursor-pointer ${
                currentTab === 'dashboard' ? 'bg-blue-900 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>ផ្ទាំងគ្រប់គ្រង</span>
            </button>
            <button
              onClick={() => handleTabClick('incoming')}
              className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium cursor-pointer ${
                currentTab === 'incoming' ? 'bg-blue-900 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <FileDown className="w-4 h-4" />
              <span>លិខិតចូល</span>
            </button>
            <button
              onClick={() => handleTabClick('outgoing')}
              className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium cursor-pointer ${
                currentTab === 'outgoing' ? 'bg-blue-900 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <FileUp className="w-4 h-4" />
              <span>លិខិតចេញ</span>
            </button>
            <button
              onClick={() => handleTabClick('tracking')}
              className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium cursor-pointer ${
                currentTab === 'tracking' ? 'bg-blue-900 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>តាមដាន & QR</span>
            </button>
            <button
              onClick={() => handleTabClick('telegram')}
              className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium cursor-pointer ${
                currentTab === 'telegram' ? 'bg-blue-900 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Telegram</span>
            </button>
            <button
              onClick={() => handleTabClick('backup')}
              className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium cursor-pointer ${
                currentTab === 'backup' ? 'bg-blue-900 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>បម្រុងទុក</span>
            </button>
          </div>

          {/* Owner user management shortcut in mobile */}
          {isOwner && onOpenUserManagement && (
            <div className="pt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenUserManagement();
                }}
                className="w-full flex items-center justify-between p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-xs font-bold text-amber-950 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-600" />
                  <span>គ្រប់គ្រង និងអនុម័តអ្នកប្រើប្រាស់ (Owner)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-amber-200">
                    {activeUsersCount}/10
                  </span>
                  {pendingUsersCount > 0 && (
                    <span className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      {pendingUsersCount}
                    </span>
                  )}
                </div>
              </button>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              ចូលប្រើជា៖ <strong className="text-slate-800">{currentUser.name}</strong>
            </span>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-rose-700 bg-rose-50 border border-rose-200 rounded-md text-xs font-semibold hover:bg-rose-100 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ចាកចេញ</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
