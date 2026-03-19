export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface SkillGapItem {
  name: string;
  icon?: string;
  category?: string;
  categoryColor?: string;
  userLevel: SkillLevel | null; // null = missing
  targetLevel: SkillLevel;
  status: 'matched' | 'upgrade' | 'missing';
  recommendation?: string;
}

export interface BonusSkill {
  name: string;
  level: string;
  category?: string;
}

export interface CategoryBreakdown {
  name: string;
  color: string;
  matchScore: number;
  matched: number;
  total: number;
}

export interface GapAnalysisResult {
  graphId: string;
  templateId: string;
  templateName: string;
  matchScore: number; // 0-100
  totalSkills: number; // Total skills in template
  matchedCount: number;
  upgradeCount: number;
  missingCount: number;
  bonusCount: number;
  skills: SkillGapItem[]; // Template skills with gap status
  bonusSkills: BonusSkill[]; // User skills not in template
  categoryBreakdown: CategoryBreakdown[];
}
