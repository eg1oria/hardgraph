export interface GraphData {
  id: string;
  userId: string;
  title: string;
  slug: string;
  description?: string;
  isPublic: boolean;
  isPrimary: boolean;
  theme: string;
  customStyles: Record<string, unknown>;
  viewport: Record<string, unknown>;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SkillNode {
  id: string;
  graphId: string;
  categoryId?: string;
  parentIdeaId?: string | null;
  name: string;
  description?: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  nodeType?: 'skill' | 'repository';
  icon?: string;
  positionX: number;
  positionY: number;
  customData: Record<string, unknown>;
  isUnlocked: boolean;
}

export interface SkillEdge {
  id: string;
  graphId: string;
  sourceNodeId: string;
  targetNodeId: string;
  label?: string;
  edgeType: string;
}

export interface Category {
  id: string;
  graphId: string;
  name: string;
  color?: string;
  sortOrder: number;
}
