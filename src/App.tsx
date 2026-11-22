import React, { useEffect, useState } from 'react';
import { Download, Menu, SlidersHorizontal, X } from 'lucide-react';
import { DEFAULT_PORTFOLIO_DATA } from './data/defaultPortfolio';
import { InquiryItem, PortfolioData } from './types/portfolio';
import { Sidebar } from './components/Sidebar';
import { PortfolioContent } from './components/PortfolioContent';
import { ImageCropperModal } from './components/ImageCropperModal';
import { CmsStudioModal } from './components/CmsStudioModal';
import { AvatarFrame } from './components/AvatarFrame';
import { downloadTextFile } from './utils/dataValidation';

const STORAGE_KEY_PORTFOLIO = 'aries_ambara_portfolio_v1';
const STORAGE_KEY_INQUIRIES = 'aries_ambara_inquiries_v1';

const SECTION_IDS = ['about', 'connect', 'experience', 'education', 'skills', 'works'];

export default function App() {
  const [portfolioData, setPortfolioData] = useState<PortfolioData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PORTFOLIO);
      if (saved) {
        const parsed = JSON.parse(saved) as PortfolioData;
        if (parsed && parsed.profile && Array.isArray(parsed.experiences)) {
          if (parsed.profile.location === 'Bali, Indonesia') {
            parsed.profile.location = 'Tulungagung, Indonesia';
          }
          return parsed;
        }
      }
    } catch {
      // Fallback to default data
    }
    return DEFAULT_PORTFOLIO_DATA;
  });

  const [inquiries, setInquiries] = useState<InquiryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INQUIRIES);
      if (saved) return JSON.parse(saved) as InquiryItem[];
    } catch {
      // Ignore parse error
    }
    return [];
  });

  const [activeSection, setActiveSection] = useState<string>('about');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cmsOpen, setCmsOpen] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);

  // Persist portfolio data
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PORTFOLIO, JSON.stringify(portfolioData));
    } catch {
      // Ignore quota errors
    }
  }, [portfolioData]);

  // Persist inquiries
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_INQUIRIES, JSON.stringify(inquiries));
    } catch {
      // Ignore quota errors
    }
  }, [inquiries]);

  // Track active section while scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: '-25% 0px -60% 0px', threshold: 0.05 }
    );

    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleNavigate = (sectionId: string) => {
    setActiveSection(sectionId);
    setMobileMenuOpen(false);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleApplyCroppedAvatar = (webpDataUrl: string) => {
    setPortfolioData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        avatar_url: webpDataUrl,
        avatar_aspect_ratio: '1:1',
      },
    }));
  };

  const handleSubmitInquiry = (
    payload: Omit<InquiryItem, 'id' | 'submitted_at' | 'routed_to'>
  ) => {
    const newItem: InquiryItem = {
      id: `inq-${Date.now()}`,
      ...payload,
      submitted_at: new Date().toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      routed_to: portfolioData.profile.email,
    };
    setInquiries((prev) => [newItem, ...prev]);
  };

  const handleDownloadCv = () => {
    const cvUrl = portfolioData.profile.cv_url;
    if (cvUrl && cvUrl.startsWith('http')) {
      window.open(cvUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    const { profile, experiences, education, certifications, skills } = portfolioData;
    const lines = [
      `CURRICULUM VITAE — ${profile.name.toUpperCase()}`,
      `${profile.title} | ${profile.location}`,
      `Email: ${profile.email} | WhatsApp: +${profile.whatsapp_number}`,
      `Filosofi: ${profile.philosophy}`,
      '',
      'PROFIL EKSEKUTIF',
      profile.bio,
      '',
      'RIWAYAT KARIER',
      ...experiences.flatMap((exp) => [
        `- ${exp.role} | ${exp.company} (${exp.period}) [${exp.status}]`,
        ...exp.highlights.map((h) => `  • ${h}`),
      ]),
      '',
      'PENDIDIKAN',
      ...education.map((ed) => `- ${ed.degree} — ${ed.institution} (${ed.period})`),
      '',
      'SERTIFIKASI',
      ...certifications.map((c) => `- ${c.name} — ${c.issuer} (${c.year})`),
      '',
      'KEAHLIAN & TEKNOLOGI',
      ...skills.map((s) => `- ${s.category}: ${s.tools.join(', ')}`),
    ];

    downloadTextFile(
      `${profile.name.toLowerCase().replace(/\s+/g, '_')}_cv_resmi.txt`,
      lines.join('\n'),
      'text/plain;charset=utf-8'
    );
  };

  return (
    <div className="min-h-screen bg-[#0A0C0E] text-neutral-200 flex flex-col">
      {/* Sticky 3-Zone Top Navigation Bar (Strict Contract) */}
      <header className="sticky top-0 z-50 h-16 border-b border-[rgba(212,175,55,0.22)] bg-[#0A0C0E]/92 backdrop-blur-md px-4 lg:px-8 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <a
          href="#about"
          onClick={(e) => {
            e.preventDefault();
            handleNavigate('about');
          }}
          className="font-display text-base sm:text-lg font-bold tracking-[0.14em] gold-gradient-text whitespace-nowrap shrink-0"
        >
          {portfolioData.profile.name.toUpperCase()}
        </a>

        {/* Zone 2: 5 Concise Single-Line Nav Links */}
        <nav aria-label="Navigasi Utama" className="hidden md:flex items-center gap-7 text-xs font-medium text-neutral-300">
          <a
            href="#about"
            onClick={(e) => {
              e.preventDefault();
              handleNavigate('about');
            }}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#F3E5AB] ${
              activeSection === 'about' ? 'text-[#D4AF37]' : ''
            }`}
          >
            About
          </a>
          <a
            href="#connect"
            onClick={(e) => {
              e.preventDefault();
              handleNavigate('connect');
            }}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#F3E5AB] ${
              activeSection === 'connect' ? 'text-[#D4AF37]' : ''
            }`}
          >
            Connect
          </a>
          <a
            href="#experience"
            onClick={(e) => {
              e.preventDefault();
              handleNavigate('experience');
            }}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#F3E5AB] ${
              activeSection === 'experience' ? 'text-[#D4AF37]' : ''
            }`}
          >
            Experience
          </a>
          <a
            href="#skills"
            onClick={(e) => {
              e.preventDefault();
              handleNavigate('skills');
            }}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#F3E5AB] ${
              activeSection === 'skills' ? 'text-[#D4AF37]' : ''
            }`}
          >
            Skills
          </a>
          <a
            href="#works"
            onClick={(e) => {
              e.preventDefault();
              handleNavigate('works');
            }}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#F3E5AB] ${
              activeSection === 'works' ? 'text-[#D4AF37]' : ''
            }`}
          >
            Works
          </a>
        </nav>

        {/* Zone 3: 1 Primary Action + Mobile Drawer Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setCmsOpen(true)}
            className="hidden sm:inline-flex py-2 px-4 rounded-lg gold-action-btn text-xs font-bold whitespace-nowrap shrink-0 items-center gap-1.5 transition-all cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Kelola CMS</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Buka menu navigasi"
            className="lg:hidden w-10 h-10 rounded-lg border border-[rgba(212,175,55,0.3)] bg-[#111418] flex items-center justify-center text-[#F3E5AB] cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-16 bottom-0 z-40 bg-[#0A0C0E]/95 backdrop-blur-md p-6 overflow-y-auto border-t border-[rgba(212,175,55,0.2)] space-y-6">
          <div className="flex items-center gap-4 pb-5 border-b border-[rgba(212,175,55,0.2)]">
            <AvatarFrame
              avatarUrl={portfolioData.profile.avatar_url}
              name={portfolioData.profile.name}
              sizeClass="w-20 h-20"
              onEditClick={() => {
                setMobileMenuOpen(false);
                setCropperOpen(true);
              }}
            />
            <div>
              <div className="font-display text-lg font-bold text-white">
                {portfolioData.profile.name}
              </div>
              <div className="text-xs text-[#F3E5AB] mt-0.5">{portfolioData.profile.title}</div>
              <div className="text-xs text-neutral-400 mt-1">{portfolioData.profile.location}</div>
            </div>
          </div>

          <nav className="grid grid-cols-1 gap-2">
            {[
              { id: 'about', label: '01. About & Strategic Value' },
              { id: 'connect', label: '02. Direct Connect' },
              { id: 'experience', label: '03. Experience & Career Track' },
              { id: 'education', label: '04. Education & Certifications' },
              { id: 'skills', label: '05. Skills, Tools & Stack' },
              { id: 'works', label: '06–07. Selected Works & Projects' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className="py-3 px-4 rounded-lg bg-[#181C22] border border-[rgba(212,175,55,0.2)] text-left text-sm font-medium text-neutral-200 hover:border-[#D4AF37] cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="pt-4 space-y-3">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setCmsOpen(true);
              }}
              className="w-full py-3 px-4 rounded-lg gold-action-btn text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Buka CMS & Bulk Importer</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadCv}
              className="w-full py-3 px-4 rounded-lg border border-[rgba(212,175,55,0.35)] text-xs font-semibold text-[#F3E5AB] inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#D4AF37]" />
              <span>Unduh CV Resmi</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Fluid Layout: Executive Sidebar + Content Canvas */}
      <div className="flex-1 flex w-full max-w-[1440px] mx-auto">
        <Sidebar
          profile={portfolioData.profile}
          activeSection={activeSection}
          onNavigate={handleNavigate}
          onOpenCms={() => setCmsOpen(true)}
          onOpenCropper={() => setCropperOpen(true)}
          onDownloadCv={handleDownloadCv}
        />

        <main className="flex-1 min-w-0 px-4 sm:px-8 lg:px-12 py-8 lg:py-12">
          <PortfolioContent
            data={portfolioData}
            onSubmitInquiry={handleSubmitInquiry}
            onOpenCropper={() => setCropperOpen(true)}
            onDownloadCv={handleDownloadCv}
          />

          {/* Quiet Executive Footer */}
          <footer className="mt-20 pt-8 border-t border-[rgba(212,175,55,0.2)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
            <div>
              © {new Date().getFullYear()} {portfolioData.profile.name}. Luxury Gold Executive Portfolio.
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setCmsOpen(true)}
                className="text-[#D4AF37] hover:text-[#F3E5AB] transition-colors cursor-pointer"
              >
                Kelola Data (CMS & Bulk Import)
              </button>
              <span aria-hidden="true">·</span>
              <a href="#about" className="hover:text-neutral-300 transition-colors">
                Kembali ke Atas
              </a>
            </div>
          </footer>
        </main>
      </div>

      {/* Interactive 1:1 Image Cropper & WebP Optimizer Modal */}
      <ImageCropperModal
        isOpen={cropperOpen}
        onClose={() => setCropperOpen(false)}
        onApply={handleApplyCroppedAvatar}
      />

      {/* Manual CMS & Bulk JSON/CSV Importer Studio */}
      <CmsStudioModal
        isOpen={cmsOpen}
        data={portfolioData}
        inquiries={inquiries}
        onClose={() => setCmsOpen(false)}
        onPublish={(nextData) => setPortfolioData(nextData)}
        onResetDefault={() => setPortfolioData(DEFAULT_PORTFOLIO_DATA)}
        onOpenCropper={() => setCropperOpen(true)}
      />
    </div>
  );
}
