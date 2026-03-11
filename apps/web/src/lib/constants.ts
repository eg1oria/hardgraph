export const APP_NAME = 'Skillgraph';

export const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
export type SkillLevel = (typeof SKILL_LEVELS)[number];

export const GRAPH_THEMES = ['cyberpunk', 'minimal', 'neon', 'ocean', 'forest', 'sunset'] as const;

export const NODE_COLORS: Record<SkillLevel, string> = {
  beginner: '#22D3EE',
  intermediate: '#6366F1',
  advanced: '#A855F7',
  expert: '#F59E0B',
};
