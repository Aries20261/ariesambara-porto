export type ProjectStatus = 'Ongoing' | 'In Development' | 'Completed';

export interface BrandPartner {
  id: string;
  name: string;
  sector: string;
  url: string;
}

export interface StrategicContribution {
  id: string;
  title: string;
  summary: string;
  metric: string;
}

export interface ProfileData {
  name: string;
  title: string;
  location: string;
  avatar_url: string;
  avatar_aspect_ratio: '1:1';
  theme: 'luxury_gold';
  philosophy: string;
  bio: string;
  cv_url: string;
  whatsapp_number: string;
  email: string;
  linkedin_url?: string;
  github_url?: string;
  brand_partners: BrandPartner[];
  strategic_contributions: StrategicContribution[];
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  period: string;
  status: string; // e.g., "Current role" | "Completed"
  highlights: string[];
  portfolio_link?: string;
  portfolio_label?: string;
}

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  period: string;
  focus: string;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  year: string;
  credential_url?: string;
}

export interface SkillCategory {
  id: string;
  category: string;
  description: string;
  tools: string[];
}

export interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  status: ProjectStatus;
  summary: string;
  impact_metric: string;
  tech_stack: string[];
  external_url?: string;
  built_in_open?: boolean;
}

export interface InquiryItem {
  id: string;
  name: string;
  contact: string;
  scope: string;
  message: string;
  submitted_at: string;
  routed_to: string;
}

export interface PortfolioData {
  profile: ProfileData;
  experiences: ExperienceItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
  skills: SkillCategory[];
  portfolio_items: PortfolioItem[];
}

export interface ValidationIssue {
  level: 'error' | 'warning';
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  summary: {
    hasProfile: boolean;
    experiencesCount: number;
    portfolioCount: number;
    educationCount: number;
    skillsCount: number;
  };
}
