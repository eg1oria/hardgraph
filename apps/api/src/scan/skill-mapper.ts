import { SkillCategory, SkillNode, ScanResult } from './scan.types';
import { GithubRepo } from '../github/github.service';

const CATEGORY_COLORS: Record<string, string> = {
  Frontend: '#00d4ff',
  Backend: '#a855f7',
  DevOps: '#f97316',
  Database: '#22c55e',
  Mobile: '#ec4899',
  'Data Science': '#eab308',
  Systems: '#ef4444',
  'AI / ML': '#06b6d4',
  'Game Dev': '#f43f5e',
  Blockchain: '#f59e0b',
  QA: '#14b8a6',
};

const LANGUAGE_MAP: Record<string, { category: string; skills: string[]; weight: number }> = {
  TypeScript: { category: 'Frontend', skills: ['TypeScript'], weight: 90 },
  JavaScript: { category: 'Frontend', skills: ['JavaScript'], weight: 85 },
  Python: { category: 'Backend', skills: ['Python'], weight: 85 },
  Go: { category: 'Backend', skills: ['Go'], weight: 80 },
  Rust: { category: 'Systems', skills: ['Rust'], weight: 85 },
  Java: { category: 'Backend', skills: ['Java'], weight: 80 },
  Kotlin: { category: 'Mobile', skills: ['Kotlin'], weight: 80 },
  Swift: { category: 'Mobile', skills: ['Swift'], weight: 85 },
  Dart: { category: 'Mobile', skills: ['Flutter', 'Dart'], weight: 80 },
  'C#': { category: 'Backend', skills: ['.NET', 'C#'], weight: 80 },
  'C++': { category: 'Systems', skills: ['C++'], weight: 80 },
  C: { category: 'Systems', skills: ['C'], weight: 75 },
  Ruby: { category: 'Backend', skills: ['Ruby'], weight: 80 },
  PHP: { category: 'Backend', skills: ['PHP'], weight: 75 },
  Scala: { category: 'Backend', skills: ['Scala'], weight: 75 },
  Elixir: { category: 'Backend', skills: ['Elixir'], weight: 80 },
  Haskell: { category: 'Backend', skills: ['Haskell'], weight: 85 },
  Lua: { category: 'Systems', skills: ['Lua'], weight: 60 },
  Shell: { category: 'DevOps', skills: ['Shell Scripting'], weight: 60 },
  Dockerfile: { category: 'DevOps', skills: ['Docker'], weight: 70 },
  HCL: { category: 'DevOps', skills: ['Terraform'], weight: 75 },
  Nix: { category: 'DevOps', skills: ['Nix'], weight: 70 },
  'Jupyter Notebook': {
    category: 'Data Science',
    skills: ['Jupyter', 'Data Analysis'],
    weight: 70,
  },
  R: { category: 'Data Science', skills: ['R'], weight: 75 },
  HTML: { category: 'Frontend', skills: ['HTML'], weight: 40 },
  CSS: { category: 'Frontend', skills: ['CSS'], weight: 40 },
  SCSS: { category: 'Frontend', skills: ['Sass/SCSS'], weight: 50 },
  Vue: { category: 'Frontend', skills: ['Vue.js'], weight: 80 },
  Svelte: { category: 'Frontend', skills: ['Svelte'], weight: 80 },
  GDScript: { category: 'Game Dev', skills: ['Godot'], weight: 80 },
  GLSL: { category: 'Game Dev', skills: ['Shader Programming'], weight: 75 },
  HLSL: { category: 'Game Dev', skills: ['Shader Programming'], weight: 75 },
  Solidity: { category: 'Blockchain', skills: ['Solidity'], weight: 85 },
};

const TOPIC_MAP: Record<string, { category: string; skill: string; weight: number }> = {
  react: { category: 'Frontend', skill: 'React', weight: 90 },
  nextjs: { category: 'Frontend', skill: 'Next.js', weight: 85 },
  vue: { category: 'Frontend', skill: 'Vue.js', weight: 85 },
  angular: { category: 'Frontend', skill: 'Angular', weight: 85 },
  svelte: { category: 'Frontend', skill: 'Svelte', weight: 80 },
  tailwindcss: { category: 'Frontend', skill: 'Tailwind CSS', weight: 70 },
  graphql: { category: 'Backend', skill: 'GraphQL', weight: 80 },
  nestjs: { category: 'Backend', skill: 'NestJS', weight: 85 },
  express: { category: 'Backend', skill: 'Express.js', weight: 75 },
  fastapi: { category: 'Backend', skill: 'FastAPI', weight: 80 },
  django: { category: 'Backend', skill: 'Django', weight: 80 },
  flask: { category: 'Backend', skill: 'Flask', weight: 70 },
  'spring-boot': { category: 'Backend', skill: 'Spring Boot', weight: 80 },
  docker: { category: 'DevOps', skill: 'Docker', weight: 80 },
  kubernetes: { category: 'DevOps', skill: 'Kubernetes', weight: 85 },
  terraform: { category: 'DevOps', skill: 'Terraform', weight: 80 },
  aws: { category: 'DevOps', skill: 'AWS', weight: 80 },
  gcp: { category: 'DevOps', skill: 'Google Cloud', weight: 80 },
  azure: { category: 'DevOps', skill: 'Azure', weight: 80 },
  'ci-cd': { category: 'DevOps', skill: 'CI/CD', weight: 70 },
  'github-actions': { category: 'DevOps', skill: 'GitHub Actions', weight: 75 },
  postgresql: { category: 'Database', skill: 'PostgreSQL', weight: 80 },
  mongodb: { category: 'Database', skill: 'MongoDB', weight: 75 },
  redis: { category: 'Database', skill: 'Redis', weight: 75 },
  mysql: { category: 'Database', skill: 'MySQL', weight: 70 },
  elasticsearch: { category: 'Database', skill: 'Elasticsearch', weight: 75 },
  prisma: { category: 'Database', skill: 'Prisma', weight: 70 },
  'react-native': { category: 'Mobile', skill: 'React Native', weight: 85 },
  flutter: { category: 'Mobile', skill: 'Flutter', weight: 85 },
  ios: { category: 'Mobile', skill: 'iOS', weight: 80 },
  android: { category: 'Mobile', skill: 'Android', weight: 80 },
  'machine-learning': { category: 'Data Science', skill: 'Machine Learning', weight: 85 },
  'deep-learning': { category: 'Data Science', skill: 'Deep Learning', weight: 85 },
  tensorflow: { category: 'Data Science', skill: 'TensorFlow', weight: 80 },
  pytorch: { category: 'Data Science', skill: 'PyTorch', weight: 80 },
  // AI / ML
  'artificial-intelligence': { category: 'AI / ML', skill: 'AI', weight: 85 },
  llm: { category: 'AI / ML', skill: 'LLMs', weight: 85 },
  'large-language-model': { category: 'AI / ML', skill: 'LLMs', weight: 85 },
  'computer-vision': { category: 'AI / ML', skill: 'Computer Vision', weight: 80 },
  nlp: { category: 'AI / ML', skill: 'NLP', weight: 80 },
  'natural-language-processing': { category: 'AI / ML', skill: 'NLP', weight: 80 },
  transformers: { category: 'AI / ML', skill: 'Transformers', weight: 80 },
  'stable-diffusion': { category: 'AI / ML', skill: 'Generative AI', weight: 75 },
  langchain: { category: 'AI / ML', skill: 'LangChain', weight: 80 },
  openai: { category: 'AI / ML', skill: 'OpenAI API', weight: 75 },
  mlops: { category: 'AI / ML', skill: 'MLOps', weight: 75 },
  // Game Dev
  unity: { category: 'Game Dev', skill: 'Unity', weight: 85 },
  'unreal-engine': { category: 'Game Dev', skill: 'Unreal Engine', weight: 85 },
  godot: { category: 'Game Dev', skill: 'Godot', weight: 80 },
  gamedev: { category: 'Game Dev', skill: 'Game Development', weight: 75 },
  'game-development': { category: 'Game Dev', skill: 'Game Development', weight: 75 },
  'game-engine': { category: 'Game Dev', skill: 'Game Engine', weight: 75 },
  // Blockchain
  blockchain: { category: 'Blockchain', skill: 'Blockchain', weight: 80 },
  ethereum: { category: 'Blockchain', skill: 'Ethereum', weight: 80 },
  solidity: { category: 'Blockchain', skill: 'Solidity', weight: 85 },
  web3: { category: 'Blockchain', skill: 'Web3', weight: 80 },
  defi: { category: 'Blockchain', skill: 'DeFi', weight: 75 },
  'smart-contracts': { category: 'Blockchain', skill: 'Smart Contracts', weight: 80 },
  // QA / Testing
  testing: { category: 'QA', skill: 'Testing', weight: 70 },
  selenium: { category: 'QA', skill: 'Selenium', weight: 75 },
  cypress: { category: 'QA', skill: 'Cypress', weight: 75 },
  playwright: { category: 'QA', skill: 'Playwright', weight: 75 },
  jest: { category: 'QA', skill: 'Jest', weight: 70 },
};

interface LanguageInfo {
  name: string;
  bytes: number;
  percent: number;
}

function determineLevel(percent: number): SkillNode['level'] {
  if (percent >= 35) return 'expert';
  if (percent >= 15) return 'advanced';
  if (percent >= 5) return 'intermediate';
  return 'beginner';
}

export function mapGitHubToSkills(
  repos: GithubRepo[],
  languages: LanguageInfo[],
  allTopics: string[],
  username: string,
  avatarUrl: string,
): ScanResult {
  // skill name → best SkillNode (deduplicated, keep max weight)
  const skillMap = new Map<string, SkillNode & { category: string }>();

  // Build a percent lookup from languages
  const langPercentMap = new Map<string, number>();
  for (const lang of languages) {
    langPercentMap.set(lang.name, lang.percent);
  }

  // 1. Process languages
  for (const lang of languages) {
    const mapping = LANGUAGE_MAP[lang.name];
    if (!mapping) continue;

    const level = determineLevel(lang.percent);

    for (const skillName of mapping.skills) {
      const existing = skillMap.get(skillName);
      const weight = mapping.weight;
      if (!existing || existing.weight < weight) {
        skillMap.set(skillName, {
          name: skillName,
          level,
          source: 'language',
          weight,
          category: mapping.category,
        });
      }
    }
  }

  // 2. Process topics
  for (const topic of allTopics) {
    const mapping = TOPIC_MAP[topic.toLowerCase()];
    if (!mapping) continue;

    const existing = skillMap.get(mapping.skill);
    if (!existing || existing.weight < mapping.weight) {
      skillMap.set(mapping.skill, {
        name: mapping.skill,
        level: existing?.level ?? 'intermediate',
        source: 'topic',
        weight: mapping.weight,
        category: mapping.category,
      });
    }
  }

  // 3. Group by category
  const categoryMap = new Map<string, SkillNode[]>();
  for (const skill of skillMap.values()) {
    const list = categoryMap.get(skill.category) ?? [];
    list.push({
      name: skill.name,
      level: skill.level,
      source: skill.source,
      weight: skill.weight,
    });
    categoryMap.set(skill.category, list);
  }

  // 4. Build categories with scores
  const categories: SkillCategory[] = [];
  for (const [name, skills] of categoryMap) {
    // Sort skills by weight descending
    skills.sort((a, b) => b.weight - a.weight);

    const avgWeight = skills.reduce((sum, s) => sum + s.weight, 0) / skills.length;
    // Multiplier: more skills = higher confidence, capped at 1.5
    const countMultiplier = Math.min(1 + skills.length * 0.1, 1.5);
    const score = Math.min(100, Math.round((avgWeight * countMultiplier) / 1.5));

    categories.push({
      name,
      color: CATEGORY_COLORS[name] ?? '#6366f1',
      skills,
      score,
    });
  }

  // Sort categories by score descending
  categories.sort((a, b) => b.score - a.score);

  const totalSkills = skillMap.size;
  const topSkills = getTopSkills(categories);

  return {
    username,
    avatarUrl,
    totalRepos: repos.length,
    totalLanguages: languages.length,
    totalSkills,
    categories,
    topSkills,
    scannedAt: new Date().toISOString(),
  };
}

export function getTopSkills(categories: SkillCategory[]): string[] {
  const all: { name: string; weight: number }[] = [];
  for (const cat of categories) {
    for (const skill of cat.skills) {
      all.push({ name: skill.name, weight: skill.weight });
    }
  }
  all.sort((a, b) => b.weight - a.weight);
  return all.slice(0, 5).map((s) => s.name);
}
