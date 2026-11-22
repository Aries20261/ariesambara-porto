import {
  ExperienceItem,
  PortfolioData,
  PortfolioItem,
  ProjectStatus,
  ValidationIssue,
  ValidationResult,
} from '../types/portfolio';
import { DEFAULT_PORTFOLIO_DATA } from '../data/defaultPortfolio';

const ALLOWED_STATUSES: ProjectStatus[] = ['Ongoing', 'In Development', 'Completed'];

export function isValidUrl(url: string): boolean {
  if (!url || url.startsWith('#')) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isValidPeriodFormat(period: string): boolean {
  if (!period || period.trim().length < 4) return false;
  // Accepts patterns like "Jan 2026 - Present", "2023 - 2025", "Mar 2023 - Dec 2025"
  return /\d{4}/.test(period);
}

export function validatePortfolioPayload(raw: unknown): {
  result: ValidationResult;
  normalized: Partial<PortfolioData> | null;
} {
  const issues: ValidationIssue[] = [];

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      result: {
        valid: false,
        issues: [{ level: 'error', field: 'root', message: 'Struktur JSON harus berupa objek root yang valid.' }],
        summary: { hasProfile: false, experiencesCount: 0, portfolioCount: 0, educationCount: 0, skillsCount: 0 },
      },
      normalized: null,
    };
  }

  const data = raw as Record<string, unknown>;
  const normalized: Partial<PortfolioData> = {};

  // Profile validation
  let hasProfile = false;
  if (data.profile && typeof data.profile === 'object' && !Array.isArray(data.profile)) {
    const p = data.profile as Record<string, unknown>;
    hasProfile = true;

    if (!p.name || typeof p.name !== 'string') {
      issues.push({ level: 'error', field: 'profile.name', message: 'Nama profil (profile.name) wajib diisi.' });
    }
    if (!p.title || typeof p.title !== 'string') {
      issues.push({ level: 'warning', field: 'profile.title', message: 'Gelar/posisi utama (profile.title) disarankan diisi.' });
    }
    if (p.avatar_url && typeof p.avatar_url === 'string' && !p.avatar_url.startsWith('data:image/') && !isValidUrl(p.avatar_url)) {
      issues.push({ level: 'error', field: 'profile.avatar_url', message: 'Format profile.avatar_url bukan URL atau Data URI yang valid.' });
    }
    if (p.avatar_aspect_ratio && p.avatar_aspect_ratio !== '1:1') {
      issues.push({ level: 'warning', field: 'profile.avatar_aspect_ratio', message: 'Rasio foto profil dinormalisasi ke "1:1" sesuai standar PRD.' });
    }

    normalized.profile = {
      ...DEFAULT_PORTFOLIO_DATA.profile,
      ...(typeof p.name === 'string' ? { name: p.name } : {}),
      ...(typeof p.title === 'string' ? { title: p.title } : {}),
      ...(typeof p.location === 'string' ? { location: p.location } : {}),
      ...(typeof p.avatar_url === 'string' ? { avatar_url: p.avatar_url } : {}),
      avatar_aspect_ratio: '1:1',
      theme: 'luxury_gold',
      ...(typeof p.philosophy === 'string' ? { philosophy: p.philosophy } : {}),
      ...(typeof p.bio === 'string' ? { bio: p.bio } : {}),
      ...(typeof p.cv_url === 'string' ? { cv_url: p.cv_url } : {}),
      ...(typeof p.whatsapp_number === 'string' ? { whatsapp_number: p.whatsapp_number } : {}),
      ...(typeof p.email === 'string' ? { email: p.email } : {}),
      ...(Array.isArray(p.brand_partners) ? { brand_partners: p.brand_partners } : {}),
      ...(Array.isArray(p.strategic_contributions) ? { strategic_contributions: p.strategic_contributions } : {}),
    };
  }

  // Experiences validation
  let experiencesCount = 0;
  if (Array.isArray(data.experiences)) {
    const validExps: ExperienceItem[] = [];
    data.experiences.forEach((item, idx) => {
      if (!item || typeof item !== 'object') {
        issues.push({ level: 'error', field: `experiences[${idx}]`, message: 'Item pengalaman harus berupa objek.' });
        return;
      }
      const exp = item as Record<string, unknown>;
      const role = typeof exp.role === 'string' ? exp.role.trim() : '';
      const company = typeof exp.company === 'string' ? exp.company.trim() : '';
      const period = typeof exp.period === 'string' ? exp.period.trim() : '';
      const status = typeof exp.status === 'string' ? exp.status.trim() : 'Completed';

      if (!role || !company) {
        issues.push({ level: 'error', field: `experiences[${idx}]`, message: 'Field role dan company wajib ada.' });
        return;
      }
      if (!isValidPeriodFormat(period)) {
        issues.push({ level: 'warning', field: `experiences[${idx}].period`, message: `Format periode "${period}" disarankan memuat tahun 4 digit (mis. "Jan 2026 - Present").` });
      }
      if (typeof exp.portfolio_link === 'string' && exp.portfolio_link && !isValidUrl(exp.portfolio_link)) {
        issues.push({ level: 'error', field: `experiences[${idx}].portfolio_link`, message: `Tautan eksternal "${exp.portfolio_link}" tidak valid.` });
      }

      const highlights = Array.isArray(exp.highlights)
        ? exp.highlights.filter((h): h is string => typeof h === 'string' && h.trim().length > 0)
        : [];

      validExps.push({
        id: typeof exp.id === 'string' && exp.id ? exp.id : `exp-import-${Date.now()}-${idx}`,
        role,
        company,
        period: period || '2026 - Present',
        status,
        highlights,
        portfolio_link: typeof exp.portfolio_link === 'string' ? exp.portfolio_link : undefined,
        portfolio_label: typeof exp.portfolio_label === 'string' ? exp.portfolio_label : undefined,
      });
    });
    experiencesCount = validExps.length;
    normalized.experiences = validExps;
  }

  // Portfolio items validation
  let portfolioCount = 0;
  if (Array.isArray(data.portfolio_items)) {
    const validWorks: PortfolioItem[] = [];
    data.portfolio_items.forEach((item, idx) => {
      if (!item || typeof item !== 'object') {
        issues.push({ level: 'error', field: `portfolio_items[${idx}]`, message: 'Item portofolio harus berupa objek.' });
        return;
      }
      const work = item as Record<string, unknown>;
      const title = typeof work.title === 'string' ? work.title.trim() : '';
      const category = typeof work.category === 'string' ? work.category.trim() : 'Digital Platform';
      const rawStatus = typeof work.status === 'string' ? work.status.trim() : 'Ongoing';

      if (!title) {
        issues.push({ level: 'error', field: `portfolio_items[${idx}].title`, message: 'Judul proyek wajib diisi.' });
        return;
      }

      let status: ProjectStatus = 'Ongoing';
      if (ALLOWED_STATUSES.includes(rawStatus as ProjectStatus)) {
        status = rawStatus as ProjectStatus;
      } else {
        issues.push({
          level: 'warning',
          field: `portfolio_items[${idx}].status`,
          message: `Status "${rawStatus}" tidak dikenal; dinormalisasi ke "Ongoing" (valid: Ongoing, In Development, Completed).`,
        });
      }

      if (typeof work.external_url === 'string' && work.external_url && !isValidUrl(work.external_url)) {
        issues.push({ level: 'error', field: `portfolio_items[${idx}].external_url`, message: `Tautan eksternal "${work.external_url}" harus diawali http:// atau https://.` });
      }

      const techStack = Array.isArray(work.tech_stack)
        ? work.tech_stack.filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
        : [];

      validWorks.push({
        id: typeof work.id === 'string' && work.id ? work.id : `work-import-${Date.now()}-${idx}`,
        title,
        category,
        status,
        summary: typeof work.summary === 'string' && work.summary.trim() ? work.summary : `${category} initiative engineered with ${techStack.join(', ') || 'modern stack'}.`,
        impact_metric: typeof work.impact_metric === 'string' && work.impact_metric.trim() ? work.impact_metric : (status === 'In Development' ? 'Built in the open · Active Sprint' : 'Production Deployed'),
        tech_stack: techStack,
        external_url: typeof work.external_url === 'string' ? work.external_url : undefined,
        built_in_open: typeof work.built_in_open === 'boolean' ? work.built_in_open : status === 'In Development',
      });
    });
    portfolioCount = validWorks.length;
    normalized.portfolio_items = validWorks;
  }

  let educationCount = 0;
  if (Array.isArray(data.education)) {
    normalized.education = data.education;
    educationCount = data.education.length;
  }

  if (Array.isArray(data.certifications)) {
    normalized.certifications = data.certifications;
  }

  let skillsCount = 0;
  if (Array.isArray(data.skills)) {
    normalized.skills = data.skills;
    skillsCount = data.skills.length;
  }

  const hasErrors = issues.some((i) => i.level === 'error');
  if (!hasProfile && experiencesCount === 0 && portfolioCount === 0 && educationCount === 0 && skillsCount === 0) {
    issues.push({
      level: 'error',
      field: 'schema',
      message: 'Tidak ditemukan bagian valid (profile, experiences, atau portfolio_items) di dalam berkas.',
    });
  }

  return {
    result: {
      valid: !hasErrors && (hasProfile || experiencesCount > 0 || portfolioCount > 0 || educationCount > 0 || skillsCount > 0),
      issues,
      summary: {
        hasProfile,
        experiencesCount,
        portfolioCount,
        educationCount,
        skillsCount,
      },
    },
    normalized: hasErrors ? null : normalized,
  };
}

// RFC-4180 CSV Parser
export function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  const clean = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    const next = clean[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(cell.trim());
        cell = '';
      } else if (ch === '\n') {
        row.push(cell.trim());
        if (row.some((c) => c.length > 0)) rows.push(row);
        row = [];
        cell = '';
      } else {
        cell += ch;
      }
    }
  }
  row.push(cell.trim());
  if (row.some((c) => c.length > 0)) rows.push(row);

  return rows;
}

export function parseCsvToPortfolioPatch(
  csvText: string,
  targetType: 'experiences' | 'portfolio_items'
): { result: ValidationResult; normalized: Partial<PortfolioData> | null } {
  const rows = parseCsvRows(csvText);
  if (rows.length < 2) {
    return {
      result: {
        valid: false,
        issues: [{ level: 'error', field: 'csv', message: 'Berkas CSV minimal harus memiliki 1 baris header dan 1 baris data.' }],
        summary: { hasProfile: false, experiencesCount: 0, portfolioCount: 0, educationCount: 0, skillsCount: 0 },
      },
      normalized: null,
    };
  }

  const headers = rows[0].map((h) => h.toLowerCase().replace(/\s+/g, '_'));
  const records = rows.slice(1).map((cols) => {
    const obj: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      const val = cols[i] ?? '';
      if (h === 'highlights' || h === 'tech_stack') {
        obj[h] = val ? val.split(/[;|]/).map((s) => s.trim()).filter(Boolean) : [];
      } else if (h === 'built_in_open') {
        obj[h] = val.toLowerCase() === 'true' || val === '1';
      } else {
        obj[h] = val;
      }
    });
    return obj;
  });

  const payload = targetType === 'experiences' ? { experiences: records } : { portfolio_items: records };
  return validatePortfolioPayload(payload);
}

function escapeCsvCell(val: string): string {
  if (/[",\n]/.test(val)) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export function exportExperiencesToCsv(experiences: ExperienceItem[]): string {
  const header = ['role', 'company', 'period', 'status', 'highlights', 'portfolio_link', 'portfolio_label'];
  const lines = [
    header.join(','),
    ...experiences.map((e) =>
      [
        e.role,
        e.company,
        e.period,
        e.status,
        e.highlights.join(' | '),
        e.portfolio_link || '',
        e.portfolio_label || '',
      ]
        .map(escapeCsvCell)
        .join(',')
    ),
  ];
  return lines.join('\n');
}

export function exportPortfolioToCsv(items: PortfolioItem[]): string {
  const header = ['title', 'category', 'status', 'summary', 'impact_metric', 'tech_stack', 'external_url', 'built_in_open'];
  const lines = [
    header.join(','),
    ...items.map((p) =>
      [
        p.title,
        p.category,
        p.status,
        p.summary,
        p.impact_metric,
        p.tech_stack.join(' | '),
        p.external_url || '',
        String(Boolean(p.built_in_open)),
      ]
        .map(escapeCsvCell)
        .join(',')
    ),
  ];
  return lines.join('\n');
}

export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
