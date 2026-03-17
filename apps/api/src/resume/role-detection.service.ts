import { Injectable } from '@nestjs/common';

/**
 * Classifies skills into frontend / backend / devops categories
 * and determines the predominant role.
 */

const FRONTEND_KEYWORDS = new Set([
  'react',
  'next.js',
  'nextjs',
  'vue',
  'angular',
  'svelte',
  'html',
  'css',
  'sass',
  'scss',
  'tailwind',
  'tailwindcss',
  'bootstrap',
  'material-ui',
  'mui',
  'chakra',
  'styled-components',
  'emotion',
  'framer-motion',
  'redux',
  'zustand',
  'mobx',
  'webpack',
  'vite',
  'rollup',
  'parcel',
  'storybook',
  'figma',
  'ui/ux',
  'ux',
  'responsive',
  'accessibility',
  'a11y',
  'pwa',
  'web components',
  'gatsby',
  'remix',
  'astro',
  'nuxt',
  'jquery',
]);

const BACKEND_KEYWORDS = new Set([
  'node',
  'node.js',
  'nodejs',
  'express',
  'nestjs',
  'nest.js',
  'fastify',
  'koa',
  'django',
  'flask',
  'fastapi',
  'spring',
  'spring boot',
  'rails',
  'ruby on rails',
  'laravel',
  'php',
  'go',
  'golang',
  'rust',
  'java',
  'c#',
  '.net',
  'asp.net',
  'graphql',
  'rest',
  'api',
  'microservices',
  'grpc',
  'rabbitmq',
  'kafka',
  'redis',
  'postgresql',
  'postgres',
  'mysql',
  'mongodb',
  'sqlite',
  'prisma',
  'typeorm',
  'sequelize',
  'sql',
  'nosql',
  'elasticsearch',
  'database',
  'docker',
  'kubernetes',
  'k8s',
  'aws',
  'gcp',
  'azure',
  'ci/cd',
  'jenkins',
  'terraform',
  'nginx',
  'linux',
  'devops',
]);

const LEVEL_WEIGHTS: Record<string, number> = {
  expert: 4,
  advanced: 3,
  intermediate: 2,
  beginner: 1,
};

interface SkillInput {
  name: string;
  level: string;
  nodeType: string;
}

export interface RoleDetectionResult {
  title: string;
  frontendScore: number;
  backendScore: number;
}

@Injectable()
export class RoleDetectionService {
  detect(skills: SkillInput[]): RoleDetectionResult {
    let frontendScore = 0;
    let backendScore = 0;

    for (const skill of skills) {
      if (skill.nodeType !== 'skill') continue;
      const normalized = skill.name.toLowerCase().trim();
      const weight = LEVEL_WEIGHTS[skill.level] ?? 1;

      if (FRONTEND_KEYWORDS.has(normalized)) {
        frontendScore += weight;
      }
      if (BACKEND_KEYWORDS.has(normalized)) {
        backendScore += weight;
      }
    }

    let title: string;
    if (frontendScore === 0 && backendScore === 0) {
      title = 'Software Developer';
    } else if (frontendScore > backendScore * 1.5) {
      title = 'Frontend Developer';
    } else if (backendScore > frontendScore * 1.5) {
      title = 'Backend Developer';
    } else {
      title = 'Fullstack Developer';
    }

    return { title, frontendScore, backendScore };
  }
}
