import React from 'react';
import { Download, Lock, LogOut, MapPin, SlidersHorizontal } from 'lucide-react';
import { ProfileData } from '../types/portfolio';
import { AvatarFrame } from './AvatarFrame';

interface SidebarProps {
  profile: ProfileData;
  activeSection: string;
  isAuthenticated: boolean;
  adminUsername?: string;
  onNavigate: (sectionId: string) => void;
  onOpenCms: () => void;
  onOpenCropper?: () => void;
  onLogout: () => void;
  onDownloadCv: () => void;
}

const NAV_ITEMS = [
  { id: 'about', index: '01', label: 'About & Value' },
  { id: 'connect', index: '02', label: 'Direct Connect' },
  { id: 'experience', index: '03', label: 'Career Track' },
  { id: 'education', index: '04', label: 'Education' },
  { id: 'skills', index: '05', label: 'Skills & Stack' },
  { id: 'works', index: '06', label: 'Selected Works' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  profile,
  activeSection,
  isAuthenticated,
  adminUsername,
  onNavigate,
  onOpenCms,
  onOpenCropper,
  onLogout,
  onDownloadCv,
}) => {
  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-80 lg:shrink-0 lg:sticky lg:top-[65px] lg:h-[calc(100vh-65px)] bg-[#111418] border-r border-[rgba(212,175,55,0.22)] p-6 justify-between overflow-y-auto">
      <div className="space-y-6">
        {/* Executive 1:1 Profile Panel */}
        <div className="flex flex-col items-center text-center pb-6 border-b border-[rgba(212,175,55,0.2)]">
          <AvatarFrame
            avatarUrl={profile.avatar_url}
            name={profile.name}
            sizeClass="w-36 h-36"
            onEditClick={onOpenCropper}
          />

          <h2 className="mt-4 font-display text-xl font-bold text-white tracking-wide">
            {profile.name}
          </h2>
          <p className="mt-1 text-xs font-medium text-[#F3E5AB] leading-relaxed">
            {profile.title}
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-neutral-400">
            <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>{profile.location}</span>
          </div>

          <button
            type="button"
            onClick={onDownloadCv}
            className="mt-5 w-full py-2.5 px-4 rounded-lg border border-[rgba(212,175,55,0.4)] bg-[#181C22] hover:border-[#D4AF37] text-xs font-semibold text-[#F3E5AB] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Unduh CV Resmi</span>
          </button>
        </div>

        {/* Vertical Editorial Section Navigation */}
        <nav aria-label="Navigasi Modul Portofolio" className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#181C22] text-[#F3E5AB] border border-[rgba(212,175,55,0.35)] font-semibold'
                    : 'text-neutral-400 hover:text-neutral-100 hover:bg-[#181C22]/50 border border-transparent'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="font-mono text-[11px] tabular-nums text-[#D4AF37]">
                    {item.index}
                  </span>
                  <span>{item.label}</span>
                </span>
                {isActive && <span className="text-[#D4AF37] text-xs">→</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Studio CMS & Bulk Importer Trigger */}
      <div className="pt-5 border-t border-[rgba(212,175,55,0.18)] space-y-2">
        <button
          type="button"
          onClick={onOpenCms}
          className="w-full py-2.5 px-4 rounded-lg bg-[#181C22] hover:bg-[#1F252E] border border-[rgba(212,175,55,0.3)] text-xs font-semibold text-neutral-200 hover:text-[#F3E5AB] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
        >
          {isAuthenticated ? (
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#D4AF37]" />
          ) : (
            <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
          )}
          <span>{isAuthenticated ? `Kelola CMS (${adminUsername || 'Admin'})` : 'Login & Kelola CMS'}</span>
        </button>

        {isAuthenticated && (
          <button
            type="button"
            onClick={onLogout}
            className="w-full py-2 px-3 rounded-lg border border-white/10 text-[11px] font-medium text-neutral-400 hover:text-white hover:border-white/25 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Kunci Sesi Admin</span>
          </button>
        )}
      </div>
    </aside>
  );
};
