import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Download,
  Eye,
  FileJson,
  FileSpreadsheet,
  Inbox,
  Monitor,
  Plus,
  RotateCcw,
  Smartphone,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  EducationItem,
  ExperienceItem,
  InquiryItem,
  PortfolioData,
  PortfolioItem,
  ProjectStatus,
  SkillCategory,
  ValidationResult,
} from '../types/portfolio';
import {
  downloadTextFile,
  exportExperiencesToCsv,
  exportPortfolioToCsv,
  parseCsvToPortfolioPatch,
  validatePortfolioPayload,
} from '../utils/dataValidation';
import { AvatarFrame } from './AvatarFrame';
import { PortfolioContent } from './PortfolioContent';

interface CmsStudioModalProps {
  isOpen: boolean;
  data: PortfolioData;
  inquiries: InquiryItem[];
  onClose: () => void;
  onPublish: (nextData: PortfolioData) => void;
  onResetDefault: () => void;
  onOpenCropper: () => void;
}

type StudioTab = 'profile' | 'experiences' | 'works' | 'education_skills' | 'bulk' | 'inbox';

const PRD_SAMPLE_JSON = `{
  "profile": {
    "name": "Aries Ambara",
    "title": "Digital Marketer & AI Solutions Developer",
    "location": "Tulungagung, Indonesia",
    "avatar_url": "",
    "avatar_aspect_ratio": "1:1",
    "theme": "luxury_gold"
  },
  "experiences": [
    {
      "role": "Assistant Digital Marketing Manager",
      "company": "Kanaan Hospitality, Bali",
      "period": "Jan 2026 - Present",
      "status": "Current role",
      "highlights": ["Meta, Google & TikTok Strategy", "Funnel measurement"]
    }
  ],
  "portfolio_items": [
    {
      "title": "Bali Property List - Property Listing Platform",
      "category": "Property Platform",
      "status": "In Development",
      "tech_stack": ["Laravel", "MariaDB", "Membership"]
    }
  ]
}`;

export const CmsStudioModal: React.FC<CmsStudioModalProps> = ({
  isOpen,
  data,
  inquiries,
  onClose,
  onPublish,
  onResetDefault,
  onOpenCropper,
}) => {
  const [draft, setDraft] = useState<PortfolioData>(data);
  const [activeTab, setActiveTab] = useState<StudioTab>('profile');
  const [previewMode, setPreviewMode] = useState<'none' | 'desktop' | 'mobile'>('none');

  // Sync draft when data updates from outside (e.g. ImageCropper applies avatar_url)
  React.useEffect(() => {
    setDraft(data);
  }, [data, isOpen]);

  // Bulk import states
  const [bulkFormat, setBulkFormat] = useState<'json' | 'csv'>('json');
  const [csvTarget, setCsvTarget] = useState<'experiences' | 'portfolio_items'>('experiences');
  const [bulkInput, setBulkInput] = useState<string>('');
  const [validationState, setValidationState] = useState<{
    result: ValidationResult;
    normalized: Partial<PortfolioData> | null;
  } | null>(null);
  const [bulkFeedback, setBulkFeedback] = useState<string | null>(null);

  const jsonFileRef = useRef<HTMLInputElement | null>(null);
  const csvFileRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const updateProfileField = <K extends keyof PortfolioData['profile']>(
    field: K,
    value: PortfolioData['profile'][K]
  ) => {
    setDraft((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        [field]: value,
      },
    }));
  };

  // Experience handlers
  const handleAddExperience = () => {
    const newExp: ExperienceItem = {
      id: `exp-${Date.now()}`,
      role: 'Peran Baru',
      company: 'Nama Perusahaan',
      period: '2026 - Present',
      status: 'Current role',
      highlights: ['Pencapaian utama atau KPI terukur'],
    };
    setDraft((prev) => ({ ...prev, experiences: [newExp, ...prev.experiences] }));
  };

  const handleUpdateExperience = (id: string, patch: Partial<ExperienceItem>) => {
    setDraft((prev) => ({
      ...prev,
      experiences: prev.experiences.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  };

  const handleDeleteExperience = (id: string) => {
    setDraft((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((e) => e.id !== id),
    }));
  };

  // Portfolio Works handlers
  const handleAddWork = () => {
    const newWork: PortfolioItem = {
      id: `work-${Date.now()}`,
      title: 'Proyek Strategis Baru',
      category: 'AI & Growth Platform',
      status: 'In Development',
      summary: 'Ringkasan arsitektur proyek, target bisnis, dan pendekatan teknis.',
      impact_metric: 'Built in the open · Tahap Pengembangan',
      tech_stack: ['TypeScript', 'React', 'Analytics'],
      built_in_open: true,
    };
    setDraft((prev) => ({ ...prev, portfolio_items: [newWork, ...prev.portfolio_items] }));
  };

  const handleUpdateWork = (id: string, patch: Partial<PortfolioItem>) => {
    setDraft((prev) => ({
      ...prev,
      portfolio_items: prev.portfolio_items.map((w) => (w.id === id ? { ...w, ...patch } : w)),
    }));
  };

  const handleDeleteWork = (id: string) => {
    setDraft((prev) => ({
      ...prev,
      portfolio_items: prev.portfolio_items.filter((w) => w.id !== id),
    }));
  };

  // Education & Skills handlers
  const handleAddEducation = () => {
    const newEdu: EducationItem = {
      id: `edu-${Date.now()}`,
      degree: 'Program Pendidikan / Pelatihan',
      institution: 'Nama Institusi',
      period: '2025 - 2026',
      focus: 'Fokus kompetensi terapan',
    };
    setDraft((prev) => ({ ...prev, education: [newEdu, ...prev.education] }));
  };

  const handleAddSkillGroup = () => {
    const newSkill: SkillCategory = {
      id: `skill-${Date.now()}`,
      category: 'Kategori Keahlian Baru',
      description: 'Deskripsi penerapan keahlian di industri.',
      tools: ['Tool 1', 'Tool 2'],
    };
    setDraft((prev) => ({ ...prev, skills: [...prev.skills, newSkill] }));
  };

  // Validation & Bulk Import handlers
  const runBulkValidation = (text: string, format: 'json' | 'csv', target: 'experiences' | 'portfolio_items') => {
    setBulkFeedback(null);
    if (!text.trim()) {
      setValidationState(null);
      return;
    }

    if (format === 'json') {
      try {
        const parsed = JSON.parse(text);
        const validated = validatePortfolioPayload(parsed);
        setValidationState(validated);
      } catch (err) {
        setValidationState({
          result: {
            valid: false,
            issues: [
              {
                level: 'error',
                field: 'json',
                message: `Sintaks JSON tidak valid: ${err instanceof Error ? err.message : 'Periksa tanda kurung dan kutip.'}`,
              },
            ],
            summary: { hasProfile: false, experiencesCount: 0, portfolioCount: 0, educationCount: 0, skillsCount: 0 },
          },
          normalized: null,
        });
      }
    } else {
      const validated = parseCsvToPortfolioPatch(text, target);
      setValidationState(validated);
    }
  };

  const applyBulkImport = (mode: 'merge' | 'replace') => {
    if (!validationState?.normalized) return;
    const patch = validationState.normalized;

    setDraft((prev) => {
      const next: PortfolioData = { ...prev };

      if (patch.profile) {
        next.profile = mode === 'replace' ? patch.profile : { ...prev.profile, ...patch.profile };
      }
      if (patch.experiences) {
        next.experiences =
          mode === 'replace' ? patch.experiences : [...patch.experiences, ...prev.experiences];
      }
      if (patch.portfolio_items) {
        next.portfolio_items =
          mode === 'replace' ? patch.portfolio_items : [...patch.portfolio_items, ...prev.portfolio_items];
      }
      if (patch.education) {
        next.education = mode === 'replace' ? patch.education : [...patch.education, ...prev.education];
      }
      if (patch.certifications) {
        next.certifications =
          mode === 'replace' ? patch.certifications : [...patch.certifications, ...prev.certifications];
      }
      if (patch.skills) {
        next.skills = mode === 'replace' ? patch.skills : [...patch.skills, ...prev.skills];
      }

      return next;
    });

    setBulkFeedback(
      mode === 'replace'
        ? 'Data hasil validasi berhasil menggantikan bagian terkait di draf. Klik "Simpan & Terbitkan" untuk menerapkan ke halaman utama.'
        : 'Data hasil validasi berhasil digabungkan ke draf. Klik "Simpan & Terbitkan" untuk menerapkan ke halaman utama.'
    );
  };

  const handleUploadTextFile = (file: File | undefined, format: 'json' | 'csv') => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      setBulkInput(content);
      runBulkValidation(content, format, csvTarget);
    };
    reader.readAsText(file);
  };

  return (
    <div
      className="fixed inset-0 z-[65] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cms-studio-title"
    >
      <div className="w-full max-w-7xl h-[92vh] rounded-2xl bg-[#111418] border border-[rgba(212,175,55,0.35)] shadow-2xl flex flex-col overflow-hidden">
        {/* Studio Header */}
        <div className="px-5 py-3.5 border-b border-[rgba(212,175,55,0.22)] bg-[#0A0C0E] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="cms-studio-title" className="font-display text-base sm:text-lg font-bold text-[#F3E5AB]">
              Portfolio Studio — Manual CMS & Bulk Importer
            </h2>
            <p className="text-[11px] text-neutral-400">
              Kelola profil 1:1, pengalaman karier, proyek, dan impor massal JSON/CSV dengan pratinjau langsung.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Live Preview Toggle (Desktop / Mobile) */}
            <div className="inline-flex items-center p-1 rounded-lg bg-[#181C22] border border-[rgba(212,175,55,0.25)]">
              <button
                type="button"
                onClick={() => setPreviewMode('none')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  previewMode === 'none' ? 'bg-[#D4AF37] text-[#0A0C0E] font-bold' : 'text-neutral-300 hover:text-white'
                }`}
              >
                Editor
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('desktop')}
                className={`px-2.5 py-1 rounded text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                  previewMode === 'desktop' ? 'bg-[#D4AF37] text-[#0A0C0E] font-bold' : 'text-neutral-300 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('mobile')}
                className={`px-2.5 py-1 rounded text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                  previewMode === 'mobile' ? 'bg-[#D4AF37] text-[#0A0C0E] font-bold' : 'text-neutral-300 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                onPublish(draft);
                onClose();
              }}
              className="py-2 px-4 rounded-lg gold-action-btn text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Simpan & Terbitkan</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup Portfolio Studio"
              className="w-8 h-8 rounded-lg border border-white/15 flex items-center justify-center text-neutral-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Studio Main Body */}
        {previewMode !== 'none' ? (
          <div className="flex-1 overflow-y-auto bg-[#0A0C0E] p-4 sm:p-6">
            <div className="max-w-6xl mx-auto space-y-4">
              <div className="flex items-center justify-between text-xs text-neutral-400 border-b border-[rgba(212,175,55,0.2)] pb-3">
                <span className="inline-flex items-center gap-2 text-[#F3E5AB] font-medium">
                  <Eye className="w-4 h-4 text-[#D4AF37]" />
                  <span>
                    Pratinjau Langsung ({previewMode === 'mobile' ? 'Mobile 390px' : 'Desktop Fluid'})
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewMode('none')}
                  className="text-xs text-[#D4AF37] hover:underline cursor-pointer"
                >
                  Kembali ke Editor
                </button>
              </div>

              <div
                className={`mx-auto rounded-2xl border border-[rgba(212,175,55,0.3)] bg-[#0A0C0E] overflow-hidden ${
                  previewMode === 'mobile' ? 'max-w-[390px]' : 'w-full p-6'
                }`}
              >
                <PortfolioContent
                  data={draft}
                  isMobilePreview={previewMode === 'mobile'}
                  onSubmitInquiry={() => {}}
                  onDownloadCv={() => {}}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left Tab Rail */}
            <nav
              aria-label="Menu Pengelolaan Data CMS"
              className="w-full md:w-60 shrink-0 border-b md:border-b-0 md:border-r border-[rgba(212,175,55,0.2)] bg-[#0A0C0E]/50 p-3 flex md:flex-col gap-1.5 overflow-x-auto"
            >
              {(
                [
                  { id: 'profile', label: 'Profil & Foto 1:1' },
                  { id: 'experiences', label: `Karier (${draft.experiences.length})` },
                  { id: 'works', label: `Proyek (${draft.portfolio_items.length})` },
                  { id: 'education_skills', label: 'Edukasi & Keahlian' },
                  { id: 'bulk', label: 'Impor / Ekspor Massal' },
                  { id: 'inbox', label: `Inbox (${inquiries.length})` },
                ] as { id: StudioTab; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2.5 rounded-lg text-xs font-medium text-left whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-[#181C22] text-[#F3E5AB] border border-[rgba(212,175,55,0.4)] font-semibold'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#181C22]/40 border border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              ))}

              <div className="hidden md:block mt-auto pt-4 border-t border-[rgba(212,175,55,0.15)]">
                <button
                  type="button"
                  onClick={() => {
                    onResetDefault();
                    setBulkFeedback('Data dikembalikan ke bawaan PRD.');
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 text-[11px] text-neutral-400 hover:text-white hover:border-white/25 inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Data Default</span>
                </button>
              </div>
            </nav>

            {/* Right Tab Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
              {/* TAB 1: PROFILE & 1:1 AVATAR */}
              {activeTab === 'profile' && (
                <div className="space-y-6 max-w-3xl">
                  <div className="p-5 rounded-xl bg-[#181C22] border border-[rgba(212,175,55,0.25)] flex flex-col sm:flex-row items-center gap-6">
                    <AvatarFrame
                      avatarUrl={draft.profile.avatar_url}
                      name={draft.profile.name}
                      sizeClass="w-32 h-32"
                      showRatioCaption
                    />
                    <div className="flex-1 space-y-3 text-center sm:text-left">
                      <div>
                        <h3 className="text-sm font-bold text-white">Foto Profil Menu About (Rasio 1:1)</h3>
                        <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                          Gunakan modul Auto-Crop 1:1 untuk memotong & mengoptimalkan gambar ke format WebP 800×800 px (maks 5 MB). Tersimpan pada <code className="text-[#D4AF37]">profile.avatar_url</code>.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                        <button
                          type="button"
                          onClick={onOpenCropper}
                          className="py-2 px-4 rounded-lg gold-action-btn text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Unggah & Crop 1:1</span>
                        </button>
                        {draft.profile.avatar_url && (
                          <button
                            type="button"
                            onClick={() => updateProfileField('avatar_url', '')}
                            className="py-2 px-3 rounded-lg border border-white/15 text-xs text-neutral-300 hover:text-white cursor-pointer"
                          >
                            Hapus Foto
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">Nama Lengkap</label>
                      <input
                        type="text"
                        value={draft.profile.name}
                        onChange={(e) => updateProfileField('name', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0C0E] border border-[rgba(212,175,55,0.22)] focus:border-[#D4AF37] focus:outline-none text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">Gelar / Posisi Utama</label>
                      <input
                        type="text"
                        value={draft.profile.title}
                        onChange={(e) => updateProfileField('title', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0C0E] border border-[rgba(212,175,55,0.22)] focus:border-[#D4AF37] focus:outline-none text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">Domisili</label>
                      <input
                        type="text"
                        value={draft.profile.location}
                        onChange={(e) => updateProfileField('location', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0C0E] border border-[rgba(212,175,55,0.22)] focus:border-[#D4AF37] focus:outline-none text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">Filosofi Kerja</label>
                      <input
                        type="text"
                        value={draft.profile.philosophy}
                        onChange={(e) => updateProfileField('philosophy', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0C0E] border border-[rgba(212,175,55,0.22)] focus:border-[#D4AF37] focus:outline-none text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">Nomor WhatsApp</label>
                      <input
                        type="text"
                        value={draft.profile.whatsapp_number}
                        onChange={(e) => updateProfileField('whatsapp_number', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0C0E] border border-[rgba(212,175,55,0.22)] focus:border-[#D4AF37] focus:outline-none text-sm text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">Email Konsultasi</label>
                      <input
                        type="email"
                        value={draft.profile.email}
                        onChange={(e) => updateProfileField('email', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0C0E] border border-[rgba(212,175,55,0.22)] focus:border-[#D4AF37] focus:outline-none text-sm text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Ringkasan Profil Eksekutif (3 Kalimat)
                    </label>
                    <textarea
                      rows={4}
                      value={draft.profile.bio}
                      onChange={(e) => updateProfileField('bio', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0C0E] border border-[rgba(212,175,55,0.22)] focus:border-[#D4AF37] focus:outline-none text-sm text-white leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      URL Foto Avatar Manual (Opsional, Rasio 1:1)
                    </label>
                    <input
                      type="text"
                      value={draft.profile.avatar_url}
                      onChange={(e) => updateProfileField('avatar_url', e.target.value)}
                      placeholder="https://... atau hasil unggah WebP"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0C0E] border border-[rgba(212,175,55,0.22)] focus:border-[#D4AF37] focus:outline-none text-xs font-mono text-white"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: EXPERIENCES */}
              {activeTab === 'experiences' && (
                <div className="space-y-5 max-w-3xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white">Kelola Pengalaman Karier</h3>
                    <button
                      type="button"
                      onClick={handleAddExperience}
                      className="py-2 px-3.5 rounded-lg gold-action-btn text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Posisi</span>
                    </button>
                  </div>

                  {draft.experiences.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-5 rounded-xl bg-[#181C22] border border-[rgba(212,175,55,0.25)] space-y-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono text-[#D4AF37]">{exp.period}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteExperience(exp.id)}
                          aria-label={`Hapus ${exp.role}`}
                          className="p-1.5 rounded text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={exp.role}
                          onChange={(e) => handleUpdateExperience(exp.id, { role: e.target.value })}
                          placeholder="Jabatan / Role"
                          className="px-3 py-2 rounded-lg bg-[#0A0C0E] border border-white/10 focus:border-[#D4AF37] focus:outline-none text-sm text-white"
                        />
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => handleUpdateExperience(exp.id, { company: e.target.value })}
                          placeholder="Perusahaan & Lokasi"
                          className="px-3 py-2 rounded-lg bg-[#0A0C0E] border border-white/10 focus:border-[#D4AF37] focus:outline-none text-sm text-white"
                        />
                        <input
                          type="text"
                          value={exp.period}
                          onChange={(e) => handleUpdateExperience(exp.id, { period: e.target.value })}
                          placeholder="Periode (mis. Jan 2026 - Present)"
                          className="px-3 py-2 rounded-lg bg-[#0A0C0E] border border-white/10 focus:border-[#D4AF37] focus:outline-none text-xs font-mono text-white"
                        />
                        <input
                          type="text"
                          value={exp.status}
                          onChange={(e) => handleUpdateExperience(exp.id, { status: e.target.value })}
                          placeholder="Status (Current role / Completed)"
                          className="px-3 py-2 rounded-lg bg-[#0A0C0E] border border-white/10 focus:border-[#D4AF37] focus:outline-none text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-neutral-400 mb-1">
                          Pencapaian & KPI (1 poin per baris)
                        </label>
                        <textarea
                          rows={3}
                          value={exp.highlights.join('\n')}
                          onChange={(e) =>
                            handleUpdateExperience(exp.id, {
                              highlights: e.target.value.split('\n').filter((line) => line.trim().length > 0),
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg bg-[#0A0C0E] border border-white/10 focus:border-[#D4AF37] focus:outline-none text-xs text-neutral-200 leading-relaxed"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={exp.portfolio_label || ''}
                          onChange={(e) => handleUpdateExperience(exp.id, { portfolio_label: e.target.value })}
                          placeholder="Label Tautan Portofolio (opsional)"
                          className="px-3 py-2 rounded-lg bg-[#0A0C0E] border border-white/10 focus:border-[#D4AF37] focus:outline-none text-xs text-white"
                        />
                        <input
                          type="url"
                          value={exp.portfolio_link || ''}
                          onChange={(e) => handleUpdateExperience(exp.id, { portfolio_link: e.target.value })}
                          placeholder="https://... (opsional)"
                          className="px-3 py-2 rounded-lg bg-[#0A0C0E] border border-white/10 focus:border-[#D4AF37] focus:outline-none text-xs font-mono text-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: SELECTED WORKS */}
              {activeTab === 'works' && (
                <div className="space-y-5 max-w-3xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white">Kelola Studi Kasus & Proyek</h3>
                    <button
                      type="button"
                      onClick={handleAddWork}
                      className="py-2 px-3.5 rounded-lg gold-action-btn text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Proyek</span>
                    </button>
                  </div>

                  {draft.portfolio_items.map((work) => (
                    <div
                      key={work.id}
                      className="p-5 rounded-xl bg-[#181C22] border border-[rgba(212,175,55,0.25)] space-y-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono text-[#D4AF37]">{work.status}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteWork(work.id)}
                          aria-label={`Hapus ${work.title}`}
                          className="p-1.5 rounded text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={work.title}
                          onChange={(e) => handleUpdateWork(work.id, { title: e.target.value })}
                          placeholder="Judul Proyek"
                          className="sm:col-span-2 px-3 py-2 rounded-lg bg-[#0A0C0E] border border-white/10 focus:border-[#D4AF37] focus:outline-none text-sm text-white"
                        />
                        <input
                          type="text"
                          value={work.category}
                          onChange={(e) => handleUpdateWork(work.id, { category: e.target.value })}
                          placeholder="Kategori (mis. Property Platform)"
                          className="px-3 py-2 rounded-lg bg-[#0A0C0E] border border-white/10 focus:border-[#D4AF37] focus:outline-none text-xs text-white"
                        />
                        <select
                          value={work.status}
                          onChange={(e) =>
                            handleUpdateWork(work.id, { status: e.target.value as ProjectStatus })
                          }
                          className="px-3 py-2 rounded-lg bg-[#0A0C0E] border border-white/10 focus:border-[#D4AF37] focus:outline-none text-xs text-white"
                        >
                          <option value="In Development">In Development</option>
                          <option value="Ongoing">Ongoing</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>

                      <textarea
                        rows={2}
                        value={work.summary}
                        onChange={(e) => handleUpdateWork(work.id, { summary: e.target.value })}
                        placeholder="Ringkasan proyek"
                        className="w-full px-3 py-2 rounded-lg bg-[#0A0C0E] border border-white/10 focus:border-[#D4AF37] focus:outline-none text-xs text-neutral-200"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={work.impact_metric}
                          onChange={(e) => handleUpdateWork(work.id, { impact_metric: e.target.value })}
                          placeholder="Metrik Dampak"
                          className="px-3 py-2 rounded-lg bg-[#0A0C0E] border border-white/10 focus:border-[#D4AF37] focus:outline-none text-xs text-white"
                        />
                        <input
                          type="text"
                          value={work.tech_stack.join(', ')}
                          onChange={(e) =>
                            handleUpdateWork(work.id, {
                              tech_stack: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                            })
                          }
                          placeholder="Tech stack (pisahkan koma)"
                          className="px-3 py-2 rounded-lg bg-[#0A0C0E] border border-white/10 focus:border-[#D4AF37] focus:outline-none text-xs text-white"
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <input
                          type="url"
                          value={work.external_url || ''}
                          onChange={(e) => handleUpdateWork(work.id, { external_url: e.target.value })}
                          placeholder="URL Eksternal (https://...)"
                          className="flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-[#0A0C0E] border border-white/10 focus:border-[#D4AF37] focus:outline-none text-xs font-mono text-white"
                        />
                        <label className="inline-flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(work.built_in_open)}
                            onChange={(e) => handleUpdateWork(work.id, { built_in_open: e.target.checked })}
                            className="accent-[#D4AF37]"
                          />
                          <span>Built in the open</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 4: EDUCATION & SKILLS */}
              {activeTab === 'education_skills' && (
                <div className="space-y-8 max-w-3xl">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-white">Pendidikan Formal</h3>
                      <button
                        type="button"
                        onClick={handleAddEducation}
                        className="py-1.5 px-3 rounded-lg border border-[rgba(212,175,55,0.35)] text-xs font-semibold text-[#F3E5AB] hover:border-[#D4AF37] inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Edukasi</span>
                      </button>
                    </div>
                    {draft.education.map((edu) => (
                      <div
                        key={edu.id}
                        className="p-4 rounded-xl bg-[#181C22] border border-[rgba(212,175,55,0.22)] space-y-3"
                      >
                        <div className="flex justify-between gap-2">
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) =>
                              setDraft((prev) => ({
                                ...prev,
                                education: prev.education.map((item) =>
                                  item.id === edu.id ? { ...item, degree: e.target.value } : item
                                ),
                              }))
                            }
                            className="flex-1 px-3 py-1.5 rounded bg-[#0A0C0E] border border-white/10 text-sm text-white"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setDraft((prev) => ({
                                ...prev,
                                education: prev.education.filter((i) => i.id !== edu.id),
                              }))
                            }
                            className="p-1.5 text-neutral-400 hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={edu.institution}
                            onChange={(e) =>
                              setDraft((prev) => ({
                                ...prev,
                                education: prev.education.map((item) =>
                                  item.id === edu.id ? { ...item, institution: e.target.value } : item
                                ),
                              }))
                            }
                            className="px-3 py-1.5 rounded bg-[#0A0C0E] border border-white/10 text-xs text-white"
                          />
                          <input
                            type="text"
                            value={edu.period}
                            onChange={(e) =>
                              setDraft((prev) => ({
                                ...prev,
                                education: prev.education.map((item) =>
                                  item.id === edu.id ? { ...item, period: e.target.value } : item
                                ),
                              }))
                            }
                            className="px-3 py-1.5 rounded bg-[#0A0C0E] border border-white/10 text-xs font-mono text-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-white">Matriks Keahlian Modular</h3>
                      <button
                        type="button"
                        onClick={handleAddSkillGroup}
                        className="py-1.5 px-3 rounded-lg border border-[rgba(212,175,55,0.35)] text-xs font-semibold text-[#F3E5AB] hover:border-[#D4AF37] inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Kategori</span>
                      </button>
                    </div>
                    {draft.skills.map((skill) => (
                      <div
                        key={skill.id}
                        className="p-4 rounded-xl bg-[#181C22] border border-[rgba(212,175,55,0.22)] space-y-3"
                      >
                        <div className="flex justify-between gap-2">
                          <input
                            type="text"
                            value={skill.category}
                            onChange={(e) =>
                              setDraft((prev) => ({
                                ...prev,
                                skills: prev.skills.map((s) =>
                                  s.id === skill.id ? { ...s, category: e.target.value } : s
                                ),
                              }))
                            }
                            className="flex-1 px-3 py-1.5 rounded bg-[#0A0C0E] border border-white/10 text-sm text-white"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setDraft((prev) => ({
                                ...prev,
                                skills: prev.skills.filter((s) => s.id !== skill.id),
                              }))
                            }
                            className="p-1.5 text-neutral-400 hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={skill.tools.join(', ')}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              skills: prev.skills.map((s) =>
                                s.id === skill.id
                                  ? {
                                      ...s,
                                      tools: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                                    }
                                  : s
                              ),
                            }))
                          }
                          placeholder="Daftar tools (pisahkan koma)"
                          className="w-full px-3 py-1.5 rounded bg-[#0A0C0E] border border-white/10 text-xs text-[#F3E5AB]"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: BULK JSON / CSV IMPORTER & EXPORTER */}
              {activeTab === 'bulk' && (
                <div className="space-y-6 max-w-4xl">
                  {/* Backup Export Strip */}
                  <div className="p-5 rounded-xl bg-[#181C22] border border-[rgba(212,175,55,0.25)] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-white">Ekspor & Cadangan Skema Data</h3>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Menyertakan <code className="text-[#D4AF37]">profile.avatar_url</code> dan <code className="text-[#D4AF37]">avatar_aspect_ratio: "1:1"</code>.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            downloadTextFile(
                              'portfolio_data_schema.json',
                              JSON.stringify(draft, null, 2),
                              'application/json'
                            )
                          }
                          className="py-2 px-3 rounded-lg border border-[rgba(212,175,55,0.35)] bg-[#0A0C0E] text-xs font-semibold text-[#F3E5AB] hover:border-[#D4AF37] inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>Ekspor JSON Lengkap</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            downloadTextFile(
                              'experiences.csv',
                              exportExperiencesToCsv(draft.experiences),
                              'text/csv'
                            )
                          }
                          className="py-2 px-3 rounded-lg border border-white/15 bg-[#0A0C0E] text-xs text-neutral-200 hover:border-[#D4AF37] inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>CSV Karier</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            downloadTextFile(
                              'portfolio_items.csv',
                              exportPortfolioToCsv(draft.portfolio_items),
                              'text/csv'
                            )
                          }
                          className="py-2 px-3 rounded-lg border border-white/15 bg-[#0A0C0E] text-xs text-neutral-200 hover:border-[#D4AF37] inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>CSV Proyek</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Importer Controls */}
                  <div className="p-5 rounded-xl bg-[#181C22] border border-[rgba(212,175,55,0.25)] space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="inline-flex p-1 rounded-lg bg-[#0A0C0E] border border-[rgba(212,175,55,0.22)]">
                        <button
                          type="button"
                          onClick={() => {
                            setBulkFormat('json');
                            setValidationState(null);
                          }}
                          className={`px-3 py-1.5 rounded text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer ${
                            bulkFormat === 'json'
                              ? 'bg-[#D4AF37] text-[#0A0C0E] font-bold'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          <FileJson className="w-3.5 h-3.5" />
                          <span>JSON Schema</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setBulkFormat('csv');
                            setValidationState(null);
                          }}
                          className={`px-3 py-1.5 rounded text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer ${
                            bulkFormat === 'csv'
                              ? 'bg-[#D4AF37] text-[#0A0C0E] font-bold'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>CSV / Spreadsheet</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {bulkFormat === 'csv' && (
                          <select
                            value={csvTarget}
                            onChange={(e) =>
                              setCsvTarget(e.target.value as 'experiences' | 'portfolio_items')
                            }
                            className="px-3 py-1.5 rounded-lg bg-[#0A0C0E] border border-[rgba(212,175,55,0.3)] text-xs text-white"
                          >
                            <option value="experiences">Target: Riwayat Karier</option>
                            <option value="portfolio_items">Target: Proyek Portofolio</option>
                          </select>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            if (bulkFormat === 'json') {
                              setBulkInput(PRD_SAMPLE_JSON);
                              runBulkValidation(PRD_SAMPLE_JSON, 'json', csvTarget);
                            } else {
                              const sample =
                                csvTarget === 'experiences'
                                  ? exportExperiencesToCsv(draft.experiences)
                                  : exportPortfolioToCsv(draft.portfolio_items);
                              setBulkInput(sample);
                              runBulkValidation(sample, 'csv', csvTarget);
                            }
                          }}
                          className="py-1.5 px-3 rounded-lg border border-white/15 text-xs text-[#F3E5AB] hover:border-[#D4AF37] cursor-pointer"
                        >
                          Muat Contoh Skema
                        </button>

                        <input
                          ref={jsonFileRef}
                          type="file"
                          accept=".json,application/json"
                          className="hidden"
                          onChange={(e) => handleUploadTextFile(e.target.files?.[0], 'json')}
                        />
                        <input
                          ref={csvFileRef}
                          type="file"
                          accept=".csv,text/csv"
                          className="hidden"
                          onChange={(e) => handleUploadTextFile(e.target.files?.[0], 'csv')}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            bulkFormat === 'json'
                              ? jsonFileRef.current?.click()
                              : csvFileRef.current?.click()
                          }
                          className="py-1.5 px-3 rounded-lg border border-[rgba(212,175,55,0.35)] bg-[#0A0C0E] text-xs font-semibold text-[#F3E5AB] hover:border-[#D4AF37] inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>Unggah Berkas {bulkFormat.toUpperCase()}</span>
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={9}
                      value={bulkInput}
                      onChange={(e) => setBulkInput(e.target.value)}
                      placeholder={
                        bulkFormat === 'json'
                          ? 'Tempel JSON sesuai skema portfolio_data_schema.json atau unggah berkas .json...'
                          : 'Tempel data CSV (baris pertama header kolom) atau unggah berkas .csv dari Excel / Google Sheets...'
                      }
                      className="w-full p-3.5 rounded-lg bg-[#0A0C0E] border border-[rgba(212,175,55,0.22)] focus:border-[#D4AF37] focus:outline-none text-xs font-mono text-neutral-200 leading-relaxed"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => runBulkValidation(bulkInput, bulkFormat, csvTarget)}
                        className="py-2 px-4 rounded-lg border border-[#D4AF37]/50 text-xs font-semibold text-[#F3E5AB] hover:bg-[#D4AF37]/10 cursor-pointer"
                      >
                        Jalankan Mesin Validasi Data
                      </button>

                      {validationState?.result.valid && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => applyBulkImport('merge')}
                            className="py-2 px-4 rounded-lg border border-[#D4AF37]/50 bg-[#0A0C0E] text-xs font-semibold text-[#F3E5AB] hover:border-[#D4AF37] cursor-pointer"
                          >
                            Gabungkan ke Draf
                          </button>
                          <button
                            type="button"
                            onClick={() => applyBulkImport('replace')}
                            className="py-2 px-4 rounded-lg gold-action-btn text-xs font-bold cursor-pointer"
                          >
                            Ganti Bagian Terkait
                          </button>
                        </div>
                      )}
                    </div>

                    {bulkFeedback && (
                      <div className="p-3 rounded-lg bg-[#0A0C0E] border border-[#D4AF37]/40 text-xs text-[#F3E5AB]">
                        {bulkFeedback}
                      </div>
                    )}

                    {/* Validation Engine Report */}
                    {validationState && (
                      <div className="p-4 rounded-lg bg-[#0A0C0E] border border-white/10 space-y-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold flex items-center gap-2">
                            {validationState.result.valid ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                                <span className="text-[#F3E5AB]">Validasi Lolos — Siap Diimpor</span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-4 h-4 text-red-400" />
                                <span className="text-red-300">Validasi Menemukan Kesalahan</span>
                              </>
                            )}
                          </span>
                          <span className="font-mono text-neutral-400 tabular-nums">
                            Karier: {validationState.result.summary.experiencesCount} · Proyek:{' '}
                            {validationState.result.summary.portfolioCount}
                          </span>
                        </div>

                        {validationState.result.issues.length > 0 && (
                          <ul className="space-y-1.5 pt-2 border-t border-white/10">
                            {validationState.result.issues.map((issue, idx) => (
                              <li
                                key={idx}
                                className={
                                  issue.level === 'error' ? 'text-red-300' : 'text-amber-300'
                                }
                              >
                                <span className="font-mono">[{issue.field}]</span> {issue.message}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6: INBOX */}
              {activeTab === 'inbox' && (
                <div className="space-y-4 max-w-3xl">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Inbox className="w-4 h-4 text-[#D4AF37]" />
                    <span>Log Pengajuan Kerja Sama</span>
                  </h3>

                  {inquiries.length === 0 ? (
                    <div className="p-8 rounded-xl bg-[#181C22] border border-[rgba(212,175,55,0.2)] text-center text-xs text-neutral-400">
                      Belum ada pengajuan yang masuk dari formulir Section 02.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {inquiries.map((inq) => (
                        <div
                          key={inq.id}
                          className="p-5 rounded-xl bg-[#181C22] border border-[rgba(212,175,55,0.22)] space-y-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span className="font-bold text-white">{inq.name}</span>
                            <span className="font-mono text-neutral-400 tabular-nums">
                              {inq.submitted_at}
                            </span>
                          </div>
                          <div className="text-xs text-[#F3E5AB]">
                            {inq.scope} · <span className="text-neutral-300">{inq.contact}</span>
                          </div>
                          <p className="text-xs text-neutral-300 leading-relaxed pt-1">
                            {inq.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
