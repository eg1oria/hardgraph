export interface SkillNode {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  source: string;
  weight: number;
}

export interface SkillCategory {
  name: string;
  color: string;
  skills: SkillNode[];
  score: number;
}

export interface ScanResult {
  username: string;
  avatarUrl: string;
  totalRepos: number;
  totalLanguages: number;
  totalSkills: number;
  categories: SkillCategory[];
  topSkills: string[];
  scannedAt: string;
}
