import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Award,
  Briefcase,
  CheckCircle2,
  Download,
  GraduationCap,
  Layers,
  Mail,
  MapPin,
  MessageCircle,
  Send,
  X,
} from 'lucide-react';
import { InquiryItem, PortfolioData, PortfolioItem, ProjectStatus } from '../types/portfolio';
import { AvatarFrame } from './AvatarFrame';

interface PortfolioContentProps {
  data: PortfolioData;
  isMobilePreview?: boolean;
  onSubmitInquiry: (inquiry: Omit<InquiryItem, 'id' | 'submitted_at' | 'routed_to'>) => void;
  onOpenCropper?: () => void;
  onDownloadCv: () => void;
}

const SCOPE_OPTIONS = [
  'Performance Marketing & Paid Media',
  'Conversion Tracking & Analytics',
  'AI Solutions & Automation',
  'Web Platform Development',
  'Full-Stack Growth Advisory',
];

export const PortfolioContent: React.FC<PortfolioContentProps> = ({
  data,
  isMobilePreview = false,
  onSubmitInquiry,
  onOpenCropper,
  onDownloadCv,
}) => {
  const { profile, experiences, education, certifications, skills, portfolio_items } = data;

  const [workFilter, setWorkFilter] = useState<'All' | ProjectStatus>('All');
  const [selectedWork, setSelectedWork] = useState<PortfolioItem | null>(null);

  // Direct Connect inquiry form state
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryContact, setInquiryContact] = useState('');
  const [inquiryScope, setInquiryScope] = useState(SCOPE_OPTIONS[0]);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquirySubmitted, setInquirySubmitted] = useState<{ mailtoHref: string; timestamp: string } | null>(null);
  const [inquiryError, setInquiryError] = useState<string | null>(null);

  const filteredWorks = useMemo(() => {
    if (workFilter === 'All') return portfolio_items;
    return portfolio_items.filter((item) => item.status === workFilter);
  }, [portfolio_items, workFilter]);

  const cleanWaNumber = profile.whatsapp_number.replace(/[^\d]/g, '');
  const whatsappUrl = `https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(
    `Halo ${profile.name}, saya ingin berdiskusi mengenai kolaborasi & konsultasi strategi digital.`
  )}`;

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInquiryError(null);

    if (!inquiryName.trim() || !inquiryContact.trim() || !inquiryMessage.trim()) {
      setInquiryError('Mohon lengkapi nama, informasi kontak, dan ringkasan ruang lingkup proyek.');
      return;
    }

    onSubmitInquiry({
      name: inquiryName.trim(),
      contact: inquiryContact.trim(),
      scope: inquiryScope,
      message: inquiryMessage.trim(),
    });

    const subject = encodeURIComponent(`[Portfolio Inquiry] ${inquiryScope} — ${inquiryName.trim()}`);
    const body = encodeURIComponent(
      `Nama: ${inquiryName.trim()}\nKontak: ${inquiryContact.trim()}\nRuang Lingkup: ${inquiryScope}\n\nPesan:\n${inquiryMessage.trim()}`
    );
    const mailtoHref = `mailto:${profile.email}?subject=${subject}&body=${body}`;

    setInquirySubmitted({
      mailtoHref,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    });
    setInquiryName('');
    setInquiryContact('');
    setInquiryMessage('');
  };

  return (
    <div className={isMobilePreview ? 'space-y-12 px-4 py-6' : 'space-y-16 lg:space-y-20'}>
      {/* SECTION 01: ABOUT ME & STRATEGIC VALUE */}
      <section id="about" className="scroll-mt-24 space-y-8">
        <div
          className={`rounded-2xl bg-[#181C22] border border-[rgba(212,175,55,0.25)] ${
            isMobilePreview ? 'p-5' : 'p-6 sm:p-8 lg:p-10'
          }`}
        >
          <div
            className={`grid gap-8 items-center ${
              isMobilePreview ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-[1fr_auto]'
            }`}
          >
            {/* Left Typographic Executive Anchor */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#D4AF37]">
                <span>01</span>
                <span aria-hidden="true">·</span>
                <span>About Me & Strategic Value</span>
              </div>

              <h1
                className={`font-display font-bold gold-gradient-text leading-[1.15] tracking-wide [text-wrap:balance] ${
                  isMobilePreview ? 'text-2xl' : 'text-3xl sm:text-4xl lg:text-[42px]'
                }`}
              >
                {profile.philosophy}
              </h1>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-300">
                <span className="font-semibold text-white">{profile.name}</span>
                <span aria-hidden="true" className="text-[#D4AF37]">·</span>
                <span>{profile.title}</span>
                <span aria-hidden="true" className="text-[#D4AF37]">·</span>
                <span className="inline-flex items-center gap-1 text-neutral-400">
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                  {profile.location}
                </span>
              </div>

              <p className="text-sm sm:text-[15px] text-neutral-300 leading-relaxed max-w-2xl">
                {profile.bio}
              </p>

              {/* Primary CTA & Official CV Download */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <a
                  href="#connect"
                  className="py-2.5 px-5 rounded-lg gold-action-btn text-xs font-bold transition-all whitespace-nowrap shrink-0 inline-flex items-center gap-2"
                >
                  <span>Mulai Konsultasi</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={onDownloadCv}
                  className="py-2.5 px-4 rounded-lg border border-[rgba(212,175,55,0.35)] bg-[#111418] hover:border-[#D4AF37] text-xs font-semibold text-[#F3E5AB] transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Unduh CV Resmi</span>
                </button>
              </div>
            </div>

            {/* Right 1:1 Square Executive Portrait */}
            <div className="flex flex-col items-center md:items-end justify-center">
              <AvatarFrame
                avatarUrl={profile.avatar_url}
                name={profile.name}
                sizeClass={isMobilePreview ? 'w-36 h-36' : 'w-44 h-44 sm:w-52 sm:h-52'}
                showRatioCaption
                onEditClick={onOpenCropper}
              />
            </div>
          </div>

          {/* Supported Brand Partners (Gold-Accented Links) */}
          {profile.brand_partners.length > 0 && (
            <div className="mt-8 pt-6 border-t border-[rgba(212,175,55,0.2)]">
              <div className="text-xs font-medium text-neutral-400 mb-3">
                Mitra Brand & Portofolio Didukung
              </div>
              <div
                className={`grid gap-3 ${
                  isMobilePreview ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                }`}
              >
                {profile.brand_partners.map((partner) => (
                  <a
                    key={partner.id}
                    href={partner.url || '#'}
                    target={partner.url && partner.url.startsWith('http') ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    className="group p-3.5 rounded-lg bg-[#111418] border border-[rgba(212,175,55,0.2)] hover:border-[#D4AF37] transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#F3E5AB] group-hover:text-[#D4AF37] transition-colors truncate">
                        {partner.name}
                      </div>
                      <div className="text-[11px] text-neutral-400 truncate mt-0.5">
                        {partner.sector}
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-[#D4AF37]/70 group-hover:text-[#D4AF37] shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Strategic Contribution Summary Grid */}
        {profile.strategic_contributions.length > 0 && (
          <div
            className={`grid gap-4 ${
              isMobilePreview ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'
            }`}
          >
            {profile.strategic_contributions.map((item) => (
              <div
                key={item.id}
                className="p-6 rounded-xl bg-[#181C22] border border-[rgba(212,175,55,0.22)] flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white">{item.title}</h3>
                  <p className="text-xs sm:text-[13px] text-neutral-400 leading-relaxed">
                    {item.summary}
                  </p>
                </div>
                <div className="pt-3 border-t border-[rgba(212,175,55,0.16)] font-mono text-xs font-semibold text-[#D4AF37] tabular-nums">
                  {item.metric}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 02: DIRECT CONNECT & CONSULTATION */}
      <section id="connect" className="scroll-mt-24 space-y-6">
        <div className="flex items-baseline justify-between border-b border-[rgba(212,175,55,0.2)] pb-3">
          <div>
            <span className="text-xs font-mono text-[#D4AF37]">02 · Direct Connect & Consultation</span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
              Konsultasi & Pengajuan Kerja Sama
            </h2>
          </div>
        </div>

        <div
          className={`grid gap-6 items-stretch ${
            isMobilePreview ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-5'
          }`}
        >
          {/* Left: Instant WhatsApp Consultation & Direct Routing */}
          <div
            className={`${
              isMobilePreview ? '' : 'lg:col-span-2'
            } p-6 rounded-xl bg-[#181C22] border border-[rgba(212,175,55,0.25)] flex flex-col justify-between space-y-6`}
          >
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-[#F3E5AB]">
                Akses Konsultasi Eksekutif Instan
              </h3>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                Terhubung langsung untuk audit akuisisi iklan berbayar, perancangan sistem pelacakan konversi, atau pengembangan solusi AI & platform web.
              </p>

              <div className="pt-2 space-y-2 text-xs text-neutral-400">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span className="text-neutral-200 truncate">{profile.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span className="font-mono text-neutral-200 tabular-nums">+{cleanWaNumber}</span>
                </div>
              </div>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-lg gold-action-btn text-xs font-bold transition-all inline-flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Konsultasi Instan via WhatsApp</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>

          {/* Right: Collaboration Inquiry Form with Automated Email Routing */}
          <form
            onSubmit={handleInquirySubmit}
            className={`${
              isMobilePreview ? '' : 'lg:col-span-3'
            } p-6 rounded-xl bg-[#181C22] border border-[rgba(212,175,55,0.25)] space-y-4`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Formulir Pengajuan Proyek</h3>
              <span className="text-[11px] font-mono text-neutral-400">
                Perutean ke {profile.email}
              </span>
            </div>

            {inquiryError && (
              <div className="p-3 rounded-lg bg-red-950/50 border border-red-500/40 text-xs text-red-200">
                {inquiryError}
              </div>
            )}

            {inquirySubmitted && (
              <div className="p-3.5 rounded-lg bg-[#111418] border border-[#D4AF37]/50 text-xs text-[#F3E5AB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">
                      Pengajuan tercatat ({inquirySubmitted.timestamp}) dan siap dirutekan.
                    </span>
                    <span className="text-neutral-400">
                      Tersimpan di Inbox CMS & siap dikirim melalui klien email Anda.
                    </span>
                  </div>
                </div>
                <a
                  href={inquirySubmitted.mailtoHref}
                  className="py-1.5 px-3 rounded border border-[#D4AF37]/50 text-[#F3E5AB] hover:bg-[#D4AF37]/10 font-semibold whitespace-nowrap shrink-0 text-center"
                >
                  Kirim Email Sekarang
                </a>
              </div>
            )}

            <div className={`grid gap-4 ${isMobilePreview ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
              <div>
                <label htmlFor="inq-name" className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  id="inq-name"
                  type="text"
                  value={inquiryName}
                  onChange={(e) => setInquiryName(e.target.value)}
                  placeholder="Mis. Hendra Wijaya"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0C0E] border border-[rgba(212,175,55,0.22)] focus:border-[#D4AF37] focus:outline-none text-sm text-white placeholder:text-neutral-500"
                />
              </div>

              <div>
                <label htmlFor="inq-contact" className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Email / Nomor WhatsApp
                </label>
                <input
                  id="inq-contact"
                  type="text"
                  value={inquiryContact}
                  onChange={(e) => setInquiryContact(e.target.value)}
                  placeholder="nama@perusahaan.com"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0C0E] border border-[rgba(212,175,55,0.22)] focus:border-[#D4AF37] focus:outline-none text-sm text-white placeholder:text-neutral-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="inq-scope" className="block text-xs font-medium text-neutral-300 mb-1.5">
                Ruang Lingkup Proyek
              </label>
              <select
                id="inq-scope"
                value={inquiryScope}
                onChange={(e) => setInquiryScope(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0C0E] border border-[rgba(212,175,55,0.22)] focus:border-[#D4AF37] focus:outline-none text-sm text-white"
              >
                {SCOPE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="inq-message" className="block text-xs font-medium text-neutral-300 mb-1.5">
                Ringkasan Target & Kebutuhan Bisnis
              </label>
              <textarea
                id="inq-message"
                rows={3}
                value={inquiryMessage}
                onChange={(e) => setInquiryMessage(e.target.value)}
                placeholder="Jelaskan target bisnis, linimasa, atau tantangan yang ingin diselesaikan..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0C0E] border border-[rgba(212,175,55,0.22)] focus:border-[#D4AF37] focus:outline-none text-sm text-white placeholder:text-neutral-500 resize-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="py-2.5 px-5 rounded-lg gold-action-btn text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim Pengajuan Kerja Sama</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* SECTION 03: EXPERIENCE & CAREER TRACK */}
      <section id="experience" className="scroll-mt-24 space-y-6">
        <div className="flex items-baseline justify-between border-b border-[rgba(212,175,55,0.2)] pb-3">
          <div>
            <span className="text-xs font-mono text-[#D4AF37]">03 · Experience & Career Track</span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
              Riwayat Kepemimpinan & Karier
            </h2>
          </div>
          <span className="text-xs font-mono text-neutral-400 tabular-nums">
            {experiences.length} Posisi
          </span>
        </div>

        <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-[rgba(212,175,55,0.3)]">
          {experiences.map((exp) => {
            const isCurrent = exp.status.toLowerCase().includes('current');
            return (
              <article key={exp.id} className="relative">
                {/* Timeline node */}
                <span
                  aria-hidden="true"
                  className={`absolute -left-6 sm:-left-8 top-6 w-3.5 h-3.5 rounded-full border-2 ${
                    isCurrent
                      ? 'bg-[#D4AF37] border-[#F3E5AB]'
                      : 'bg-[#0A0C0E] border-[#D4AF37]/60'
                  }`}
                />

                <div className="p-6 rounded-xl bg-[#181C22] border border-[rgba(212,175,55,0.22)] hover:border-[rgba(212,175,55,0.45)] transition-colors space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-white">{exp.role}</h3>
                      <div className="text-sm font-medium text-[#F3E5AB] mt-0.5 flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                        <span>{exp.company}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono tabular-nums text-neutral-400 sm:text-right">
                      <span className="text-neutral-300">{exp.period}</span>
                      <span aria-hidden="true" className="text-[#D4AF37]">·</span>
                      <span className={isCurrent ? 'text-[#D4AF37] font-semibold' : 'text-neutral-400'}>
                        {exp.status}
                      </span>
                    </div>
                  </div>

                  {exp.highlights.length > 0 && (
                    <ul className="space-y-2 text-xs sm:text-sm text-neutral-300 leading-relaxed">
                      {exp.highlights.map((pt, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <span className="text-[#D4AF37] mt-1 text-[10px]">◆</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {exp.portfolio_link && (
                    <div className="pt-2 border-t border-[rgba(212,175,55,0.14)]">
                      <a
                        href={exp.portfolio_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D4AF37] hover:text-[#F3E5AB] transition-colors"
                      >
                        <span>{exp.portfolio_label || 'Lihat Portofolio Penugasan'}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* SECTION 04: EDUCATION & CONTINUOUS LEARNING */}
      <section id="education" className="scroll-mt-24 space-y-6">
        <div className="flex items-baseline justify-between border-b border-[rgba(212,175,55,0.2)] pb-3">
          <div>
            <span className="text-xs font-mono text-[#D4AF37]">04 · Education & Continuous Learning</span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
              Pendidikan Formal & Sertifikasi
            </h2>
          </div>
        </div>

        <div className={`grid gap-6 ${isMobilePreview ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
          {/* Degrees */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[#F3E5AB] flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#D4AF37]" />
              <span>Pendidikan Tinggi & Spesialisasi Terapan</span>
            </h3>
            {education.map((edu) => (
              <div
                key={edu.id}
                className="p-5 rounded-xl bg-[#181C22] border border-[rgba(212,175,55,0.22)] space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-neutral-400 tabular-nums">
                  <span>{edu.institution}</span>
                  <span className="text-[#D4AF37]">{edu.period}</span>
                </div>
                <h4 className="text-base font-bold text-white">{edu.degree}</h4>
                <p className="text-xs text-neutral-300 leading-relaxed">{edu.focus}</p>
              </div>
            ))}
          </div>

          {/* Certifications */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[#F3E5AB] flex items-center gap-2">
              <Award className="w-4 h-4 text-[#D4AF37]" />
              <span>Sertifikasi Terakreditasi</span>
            </h3>
            <div className="rounded-xl bg-[#181C22] border border-[rgba(212,175,55,0.22)] divide-y divide-[rgba(212,175,55,0.14)]">
              {certifications.map((cert) => (
                <div key={cert.id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-white">{cert.name}</h4>
                    <div className="text-xs text-neutral-400 mt-1 flex items-center gap-2">
                      <span>{cert.issuer}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums text-[#D4AF37]">{cert.year}</span>
                    </div>
                  </div>
                  {cert.credential_url && (
                    <a
                      href={cert.credential_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Kredensial ${cert.name}`}
                      className="p-2 rounded-lg border border-[rgba(212,175,55,0.25)] text-[#D4AF37] hover:border-[#D4AF37] hover:text-[#F3E5AB] transition-colors shrink-0"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 05: SKILLS, TOOLS & TECHNOLOGIES */}
      <section id="skills" className="scroll-mt-24 space-y-6">
        <div className="flex items-baseline justify-between border-b border-[rgba(212,175,55,0.2)] pb-3">
          <div>
            <span className="text-xs font-mono text-[#D4AF37]">05 · Skills, Tools & Technologies</span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
              Matriks Keahlian & Teknologi
            </h2>
          </div>
        </div>

        <div className={`grid gap-5 ${isMobilePreview ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
          {skills.map((group) => (
            <div
              key={group.id}
              className="p-6 rounded-xl bg-[#181C22] border border-[rgba(212,175,55,0.22)] space-y-3"
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <h3 className="text-base font-bold text-white">{group.category}</h3>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">{group.description}</p>
              <div className="pt-2 border-t border-[rgba(212,175,55,0.14)] text-xs text-[#F3E5AB] leading-relaxed">
                {group.tools.map((tool, i) => (
                  <React.Fragment key={tool}>
                    <span className="font-medium">{tool}</span>
                    {i < group.tools.length - 1 && (
                      <span aria-hidden="true" className="mx-2 text-[#D4AF37]/60">/</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 06-07: SELECTED WORKS & LIVE PROJECTS */}
      <section id="works" className="scroll-mt-24 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[rgba(212,175,55,0.2)] pb-4">
          <div>
            <span className="text-xs font-mono text-[#D4AF37]">06–07 · Selected Works & Live Projects</span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
              Studi Kasus & Proyek Aktif
            </h2>
          </div>

          {/* Interactive Filter Controls (Functional Buttons) */}
          <div
            role="tablist"
            aria-label="Filter status proyek"
            className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#111418] border border-[rgba(212,175,55,0.22)] self-start"
          >
            {(['All', 'In Development', 'Ongoing', 'Completed'] as const).map((tab) => {
              const active = workFilter === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setWorkFilter(tab)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#D4AF37] text-[#0A0C0E] font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {tab === 'All' ? 'Semua' : tab}
                </button>
              );
            })}
          </div>
        </div>

        {filteredWorks.length === 0 ? (
          <div className="p-8 rounded-xl bg-[#181C22] border border-[rgba(212,175,55,0.2)] text-center text-sm text-neutral-400">
            Belum ada proyek untuk status "{workFilter}".
          </div>
        ) : (
          <div className={`grid gap-5 ${isMobilePreview ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
            {filteredWorks.map((work) => (
              <article
                key={work.id}
                className="p-6 rounded-xl bg-[#181C22] border border-[rgba(212,175,55,0.25)] hover:border-[#D4AF37] transition-colors flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  {/* Quiet 1-line unboxed metadata kicker */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                    <span className="text-[#F3E5AB] font-medium">{work.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className={work.status === 'In Development' ? 'text-[#D4AF37] font-semibold' : 'text-neutral-300'}>
                      {work.status}
                    </span>
                    {work.built_in_open && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-[11px] text-neutral-400">Built in the open</span>
                      </>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white leading-snug">{work.title}</h3>

                  <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                    {work.summary}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-[rgba(212,175,55,0.16)]">
                  <div className="text-xs font-mono text-[#D4AF37] tabular-nums">
                    {work.impact_metric}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-neutral-400">
                      {work.tech_stack.join(' · ')}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedWork(work)}
                        className="text-xs font-semibold text-[#F3E5AB] hover:text-[#D4AF37] transition-colors cursor-pointer"
                      >
                        Detail Studi Kasus
                      </button>
                      {work.external_url && (
                        <a
                          href={work.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Buka tautan ${work.title}`}
                          className="p-1.5 rounded border border-[rgba(212,175,55,0.3)] text-[#D4AF37] hover:border-[#D4AF37] transition-colors"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Project Detail Lightbox / Modal */}
      {selectedWork && (
        <div
          className="fixed inset-0 z-[75] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="work-modal-title"
          onClick={() => setSelectedWork(null)}
        >
          <div
            className="w-full max-w-xl rounded-2xl bg-[#111418] border border-[rgba(212,175,55,0.35)] p-6 sm:p-8 space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-mono text-[#D4AF37]">
                  {selectedWork.category} · {selectedWork.status}
                </div>
                <h3 id="work-modal-title" className="font-display text-xl sm:text-2xl font-bold text-white mt-1">
                  {selectedWork.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWork(null)}
                aria-label="Tutup detail proyek"
                className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white hover:border-[#D4AF37] transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-neutral-300 leading-relaxed">{selectedWork.summary}</p>

            <div className="p-4 rounded-xl bg-[#181C22] border border-[rgba(212,175,55,0.2)] space-y-2">
              <div className="text-xs text-neutral-400">Metrik Dampak</div>
              <div className="text-sm font-mono font-semibold text-[#F3E5AB] tabular-nums">
                {selectedWork.impact_metric}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs text-neutral-400">Teknologi & Arsitektur</div>
              <div className="text-sm text-neutral-200">{selectedWork.tech_stack.join(' · ')}</div>
            </div>

            <div className="pt-4 border-t border-[rgba(212,175,55,0.2)] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedWork(null)}
                className="py-2 px-4 rounded-lg border border-white/15 text-xs font-semibold text-neutral-300 hover:text-white cursor-pointer"
              >
                Tutup
              </button>
              {selectedWork.external_url && (
                <a
                  href={selectedWork.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-4 rounded-lg gold-action-btn text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <span>Kunjungi Proyek</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
