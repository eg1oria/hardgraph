import { Injectable } from '@nestjs/common';

/**
 * Classifies skills into professional categories
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

const MOBILE_KEYWORDS = new Set([
  'react native',
  'flutter',
  'dart',
  'swift',
  'swiftui',
  'kotlin',
  'android',
  'ios',
  'xcode',
  'cocoapods',
  'expo',
]);

const GAMEDEV_KEYWORDS = new Set([
  'unity',
  'unreal engine',
  'unreal',
  'godot',
  'gamedev',
  'game development',
  'game engine',
  'c++',
  'shader',
  'opengl',
  'vulkan',
  'directx',
  'level design',
  'gdscript',
  'blender',
]);

const AI_ML_KEYWORDS = new Set([
  'machine learning',
  'deep learning',
  'tensorflow',
  'pytorch',
  'keras',
  'nlp',
  'computer vision',
  'llm',
  'transformers',
  'langchain',
  'openai',
  'stable diffusion',
  'generative ai',
  'mlops',
  'mlflow',
  'hugging face',
  'neural network',
  'reinforcement learning',
]);

const DATA_KEYWORDS = new Set([
  'pandas',
  'numpy',
  'data analysis',
  'data science',
  'jupyter',
  'r',
  'data engineering',
  'spark',
  'hadoop',
  'etl',
  'power bi',
  'tableau',
  'matplotlib',
  'statistics',
  'big data',
]);

const DEVOPS_KEYWORDS = new Set([
  'docker',
  'kubernetes',
  'k8s',
  'terraform',
  'ansible',
  'aws',
  'gcp',
  'azure',
  'ci/cd',
  'github actions',
  'jenkins',
  'linux',
  'nginx',
  'prometheus',
  'grafana',
  'helm',
  'argocd',
]);

const QA_KEYWORDS = new Set([
  'testing',
  'selenium',
  'cypress',
  'playwright',
  'jest',
  'vitest',
  'test automation',
  'qa',
  'quality assurance',
  'performance testing',
  'api testing',
  'postman',
  'jmeter',
]);

const BLOCKCHAIN_KEYWORDS = new Set([
  'blockchain',
  'solidity',
  'ethereum',
  'web3',
  'defi',
  'smart contracts',
  'hardhat',
  'foundry',
  'ethers.js',
  'viem',
  'nft',
  'dapp',
]);

const DESIGN_KEYWORDS = new Set([
  'figma',
  'sketch',
  'adobe xd',
  'photoshop',
  'illustrator',
  'ui design',
  'ux design',
  'ui/ux',
  'graphic design',
  'typography',
  'wireframing',
  'prototyping',
  'user research',
  'design systems',
  'after effects',
  'blender',
  '3d modeling',
  'motion graphics',
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

interface RoleCandidate {
  title: string;
  score: number;
}

@Injectable()
export class RoleDetectionService {
  detect(skills: SkillInput[]): RoleDetectionResult {
    let frontendScore = 0;
    let backendScore = 0;
    let mobileScore = 0;
    let gamedevScore = 0;
    let aimlScore = 0;
    let dataScore = 0;
    let devopsScore = 0;
    let qaScore = 0;
    let blockchainScore = 0;
    let designScore = 0;

    for (const skill of skills) {
      if (skill.nodeType !== 'skill') continue;
      const normalized = skill.name.toLowerCase().trim();
      const weight = LEVEL_WEIGHTS[skill.level] ?? 1;

      if (FRONTEND_KEYWORDS.has(normalized)) frontendScore += weight;
      if (BACKEND_KEYWORDS.has(normalized)) backendScore += weight;
      if (MOBILE_KEYWORDS.has(normalized)) mobileScore += weight;
      if (GAMEDEV_KEYWORDS.has(normalized)) gamedevScore += weight;
      if (AI_ML_KEYWORDS.has(normalized)) aimlScore += weight;
      if (DATA_KEYWORDS.has(normalized)) dataScore += weight;
      if (DEVOPS_KEYWORDS.has(normalized)) devopsScore += weight;
      if (QA_KEYWORDS.has(normalized)) qaScore += weight;
      if (BLOCKCHAIN_KEYWORDS.has(normalized)) blockchainScore += weight;
      if (DESIGN_KEYWORDS.has(normalized)) designScore += weight;
    }

    // Collect all scored roles
    const candidates: RoleCandidate[] = [
      { title: 'Frontend Developer', score: frontendScore },
      { title: 'Backend Developer', score: backendScore },
      { title: 'Mobile Developer', score: mobileScore },
      { title: 'Game Developer', score: gamedevScore },
      { title: 'AI / ML Engineer', score: aimlScore },
      { title: 'Data Scientist', score: dataScore },
      { title: 'DevOps Engineer', score: devopsScore },
      { title: 'QA Engineer', score: qaScore },
      { title: 'Blockchain Developer', score: blockchainScore },
      { title: 'UI/UX Designer', score: designScore },
    ];

    candidates.sort((a, b) => b.score - a.score);

    const top = candidates[0]!;
    const second = candidates[1];

    let title: string;
    if (top.score === 0) {
      title = 'Software Developer';
    } else if (
      top.title === 'Frontend Developer' &&
      second?.title === 'Backend Developer' &&
      second.score > top.score * 0.6
    ) {
      title = 'Fullstack Developer';
    } else if (
      top.title === 'Backend Developer' &&
      second?.title === 'Frontend Developer' &&
      second.score > top.score * 0.6
    ) {
      title = 'Fullstack Developer';
    } else {
      title = top.title;
    }

    return { title, frontendScore, backendScore };
  }
}
