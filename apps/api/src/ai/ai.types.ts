export interface AiAnalyzeInput {
  vacancy: {
    title: string;
    company?: string;
    description?: string;
    field?: string;
    location?: string;
    skills: { name: string; level: string; category?: string }[];
  };
  candidateSkills: { name: string; level: string; category?: string }[];
  algorithmicMatchScore: number;
  matchedCount: number;
  totalRequired: number;
}

export interface AiMatchAnalysis {
  aiMatchScore: number;
  verdict: 'strong_match' | 'good_match' | 'partial_match' | 'weak_match';
  summary: string;
  strengths: string[];
  improvements: { skill: string; tip: string }[];
  hrRecommendation: string;
  relatedSkills: string[];
}

export interface AiHrAnalyzeInput {
  vacancy: {
    title: string;
    company?: string;
    description?: string;
    field?: string;
    skills: { name: string; level: string }[];
  };
  applications: {
    applicantUsername: string;
    applicantDisplayName?: string;
    matchScore: number;
    matchedSkills: number;
    totalRequired: number;
    candidateSkills: { name: string; level: string }[];
  }[];
}

export interface AiHrAnalysis {
  overallAssessment: string;
  ranking: {
    username: string;
    aiScore: number;
    reason: string;
  }[];
  hiringAdvice: string;
  skillGapInsight: string;
  suggestedInterviewQuestions: string[];
}
