export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export const LEVEL_WEIGHT: Record<SkillLevel, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
};

export const LEVEL_ORDER: SkillLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];

export function isValidLevel(level: string): level is SkillLevel {
  return LEVEL_ORDER.includes(level as SkillLevel);
}

export interface VacancySkill {
  name: string;
  level: string;
  category?: string;
  categoryColor?: string;
}

export interface CandidateNode {
  name: string;
  level: string;
}

export interface MatchDetail {
  name: string;
  category?: string;
  categoryColor?: string;
  candidateLevel: string | null;
  requiredLevel: string;
  status: 'matched' | 'upgrade' | 'missing';
}

export interface MatchResult {
  matchScore: number;
  matchedCount: number;
  upgradeCount: number;
  missingCount: number;
  totalRequired: number;
  details: MatchDetail[];
}

/**
 * Compute match score between vacancy requirements and candidate skills.
 * Uses weighted scoring: full weight for matched/exceeded levels,
 * 50% of candidate weight for partial matches, 0 for missing.
 */
export function computeMatchScore(
  vacancySkills: VacancySkill[],
  candidateNodes: CandidateNode[],
): MatchResult {
  const candidateMap = new Map<string, string>();
  for (const node of candidateNodes) {
    candidateMap.set(node.name.toLowerCase(), node.level);
  }

  let totalScore = 0;
  let maxPossibleScore = 0;
  let matchedCount = 0;
  let upgradeCount = 0;
  let missingCount = 0;
  const details: MatchDetail[] = [];

  for (const reqSkill of vacancySkills) {
    const reqLevel: SkillLevel = isValidLevel(reqSkill.level) ? reqSkill.level : 'beginner';
    const weight = LEVEL_WEIGHT[reqLevel];
    maxPossibleScore += weight;

    const candLevel = candidateMap.get(reqSkill.name.toLowerCase());

    if (candLevel && isValidLevel(candLevel)) {
      if (LEVEL_WEIGHT[candLevel] >= LEVEL_WEIGHT[reqLevel]) {
        totalScore += weight;
        matchedCount++;
        details.push({
          name: reqSkill.name,
          category: reqSkill.category,
          categoryColor: reqSkill.categoryColor,
          candidateLevel: candLevel,
          requiredLevel: reqLevel,
          status: 'matched',
        });
      } else {
        totalScore += LEVEL_WEIGHT[candLevel] * 0.5;
        upgradeCount++;
        details.push({
          name: reqSkill.name,
          category: reqSkill.category,
          categoryColor: reqSkill.categoryColor,
          candidateLevel: candLevel,
          requiredLevel: reqLevel,
          status: 'upgrade',
        });
      }
    } else {
      missingCount++;
      details.push({
        name: reqSkill.name,
        category: reqSkill.category,
        categoryColor: reqSkill.categoryColor,
        candidateLevel: null,
        requiredLevel: reqLevel,
        status: 'missing',
      });
    }
  }

  const matchScore = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;

  return {
    matchScore,
    matchedCount,
    upgradeCount,
    missingCount,
    totalRequired: vacancySkills.length,
    details,
  };
}
