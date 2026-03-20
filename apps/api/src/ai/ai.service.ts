import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AiAnalyzeInput, AiMatchAnalysis, AiHrAnalyzeInput, AiHrAnalysis } from './ai.types';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: OpenAI | null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.client = new OpenAI({ apiKey, timeout: 30_000 });
      this.logger.log('OpenAI client initialized');
    } else {
      this.client = null;
      this.logger.warn('OPENAI_API_KEY not set — AI features disabled');
    }
  }

  get isAvailable(): boolean {
    return this.client !== null;
  }

  private ensureAvailable(): void {
    if (!this.client) {
      throw new ServiceUnavailableException('AI features are not configured');
    }
  }

  async analyzeVacancyMatch(input: AiAnalyzeInput): Promise<AiMatchAnalysis | null> {
    this.ensureAvailable();

    const prompt = `You are an expert HR technology analyst specializing in developer skill assessment.

Analyze how well a candidate's skill profile matches a job vacancy. Go beyond exact name matching — consider related technologies, transferable skills, and industry context.

VACANCY:
- Title: ${input.vacancy.title}
- Company: ${input.vacancy.company ?? 'N/A'}
- Field: ${input.vacancy.field ?? 'N/A'}
- Description: ${input.vacancy.description ?? 'N/A'}
- Required skills (with minimum level): ${JSON.stringify(input.vacancy.skills)}

CANDIDATE'S SKILLS (from their skill graph):
${JSON.stringify(input.candidateSkills)}

ALGORITHMIC MATCH (exact name matching): ${input.algorithmicMatchScore}% (${input.matchedCount}/${input.totalRequired} skills matched directly)

Your task:
1. Provide an AI-enhanced match score (0-100) that accounts for related/similar technologies the algorithm missed
2. Give a verdict: strong_match (80-100), good_match (60-79), partial_match (35-59), weak_match (0-34)
3. List the candidate's key strengths relevant to this role
4. Suggest specific improvements with actionable learning tips
5. Write a brief HR recommendation
6. Identify candidate skills that are related to requirements but weren't caught by exact matching

Respond ONLY with valid JSON (no markdown, no code fences):
{
  "aiMatchScore": number,
  "verdict": "strong_match" | "good_match" | "partial_match" | "weak_match",
  "summary": "string",
  "strengths": ["string"],
  "improvements": [{"skill": "string", "tip": "string"}],
  "hrRecommendation": "string",
  "relatedSkills": ["string"]
}`;

    try {
      const response = await this.client!.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) return null;

      const parsed: AiMatchAnalysis = JSON.parse(content);
      return parsed;
    } catch (error) {
      this.logger.error('Failed to analyze vacancy match', error);
      return null;
    }
  }

  async analyzeApplicationsForHR(input: AiHrAnalyzeInput): Promise<AiHrAnalysis | null> {
    this.ensureAvailable();

    const candidatesData = input.applications
      .map(
        (a, i) =>
          `${i + 1}. @${a.applicantUsername}${a.applicantDisplayName ? ` (${a.applicantDisplayName})` : ''} — Algorithmic match: ${a.matchScore}% (${a.matchedSkills}/${a.totalRequired} skills)\n   Skills: ${JSON.stringify(a.candidateSkills)}`,
      )
      .join('\n');

    const prompt = `You are a senior HR advisor helping a hiring manager evaluate candidates for a tech position.

VACANCY:
- Title: ${input.vacancy.title}
- Company: ${input.vacancy.company ?? 'N/A'}
- Field: ${input.vacancy.field ?? 'N/A'}
- Description: ${input.vacancy.description ?? 'N/A'}
- Required skills: ${JSON.stringify(input.vacancy.skills)}

CANDIDATES (with their skill match data):
${candidatesData}

Analyze all candidates and provide:
1. Overall assessment of the candidate pool quality
2. AI-powered ranking of candidates with reasoning (consider related skills, not just exact matches)
3. Hiring advice — should they proceed, expand search, or adjust requirements?
4. Skill gap insight — which required skills are hardest to find?
5. 3-5 suggested interview questions based on the role and common skill gaps

Respond ONLY with valid JSON:
{
  "overallAssessment": "string",
  "ranking": [{"username": "string", "aiScore": number, "reason": "string"}],
  "hiringAdvice": "string",
  "skillGapInsight": "string",
  "suggestedInterviewQuestions": ["string"]
}`;

    try {
      const response = await this.client!.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) return null;

      const parsed: AiHrAnalysis = JSON.parse(content);
      return parsed;
    } catch (error) {
      this.logger.error('Failed to analyze applications for HR', error);
      return null;
    }
  }
}
