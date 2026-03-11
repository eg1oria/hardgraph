import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const templates = [
  {
    name: 'Frontend Developer',
    description:
      'A skill tree covering modern frontend technologies — HTML, CSS, JavaScript, React, and more.',
    field: 'frontend',
    isFeatured: true,
    graphData: {
      categories: [
        { id: 'cat-core', name: 'Core', color: '#22D3EE', sortOrder: 0 },
        { id: 'cat-framework', name: 'Frameworks', color: '#6366F1', sortOrder: 1 },
        { id: 'cat-tooling', name: 'Tooling', color: '#A855F7', sortOrder: 2 },
      ],
      nodes: [
        {
          name: 'HTML',
          level: 'beginner',
          icon: '🌐',
          positionX: 250,
          positionY: 0,
          categoryId: 'cat-core',
        },
        {
          name: 'CSS',
          level: 'beginner',
          icon: '🎨',
          positionX: 450,
          positionY: 0,
          categoryId: 'cat-core',
        },
        {
          name: 'JavaScript',
          level: 'intermediate',
          icon: '⚡',
          positionX: 350,
          positionY: 150,
          categoryId: 'cat-core',
        },
        {
          name: 'TypeScript',
          level: 'intermediate',
          icon: '🔷',
          positionX: 350,
          positionY: 300,
          categoryId: 'cat-core',
        },
        {
          name: 'React',
          level: 'advanced',
          icon: '⚛️',
          positionX: 200,
          positionY: 450,
          categoryId: 'cat-framework',
        },
        {
          name: 'Next.js',
          level: 'advanced',
          icon: '▲',
          positionX: 200,
          positionY: 600,
          categoryId: 'cat-framework',
        },
        {
          name: 'Vue',
          level: 'intermediate',
          icon: '💚',
          positionX: 500,
          positionY: 450,
          categoryId: 'cat-framework',
        },
        {
          name: 'Tailwind CSS',
          level: 'intermediate',
          icon: '💨',
          positionX: 600,
          positionY: 150,
          categoryId: 'cat-tooling',
        },
        {
          name: 'Webpack / Vite',
          level: 'intermediate',
          icon: '📦',
          positionX: 100,
          positionY: 300,
          categoryId: 'cat-tooling',
        },
      ],
      edges: [
        { source: 'HTML', target: 'JavaScript' },
        { source: 'CSS', target: 'JavaScript' },
        { source: 'JavaScript', target: 'TypeScript' },
        { source: 'TypeScript', target: 'React' },
        { source: 'TypeScript', target: 'Vue' },
        { source: 'React', target: 'Next.js' },
        { source: 'CSS', target: 'Tailwind CSS' },
        { source: 'JavaScript', target: 'Webpack / Vite' },
      ],
    },
  },
  {
    name: 'Backend Developer',
    description:
      'Server-side development skills — Node.js, databases, APIs, authentication, and deployment.',
    field: 'backend',
    isFeatured: true,
    graphData: {
      categories: [
        { id: 'cat-lang', name: 'Languages', color: '#F59E0B', sortOrder: 0 },
        { id: 'cat-db', name: 'Databases', color: '#10B981', sortOrder: 1 },
        { id: 'cat-infra', name: 'Infrastructure', color: '#EF4444', sortOrder: 2 },
      ],
      nodes: [
        {
          name: 'Node.js',
          level: 'intermediate',
          icon: '🟢',
          positionX: 300,
          positionY: 0,
          categoryId: 'cat-lang',
        },
        {
          name: 'Express / NestJS',
          level: 'intermediate',
          icon: '🚀',
          positionX: 300,
          positionY: 150,
          categoryId: 'cat-lang',
        },
        {
          name: 'REST APIs',
          level: 'intermediate',
          icon: '🔗',
          positionX: 150,
          positionY: 300,
          categoryId: 'cat-lang',
        },
        {
          name: 'GraphQL',
          level: 'advanced',
          icon: '◆',
          positionX: 450,
          positionY: 300,
          categoryId: 'cat-lang',
        },
        {
          name: 'PostgreSQL',
          level: 'intermediate',
          icon: '🐘',
          positionX: 100,
          positionY: 450,
          categoryId: 'cat-db',
        },
        {
          name: 'Redis',
          level: 'intermediate',
          icon: '🔴',
          positionX: 300,
          positionY: 450,
          categoryId: 'cat-db',
        },
        {
          name: 'MongoDB',
          level: 'beginner',
          icon: '🍃',
          positionX: 500,
          positionY: 450,
          categoryId: 'cat-db',
        },
        {
          name: 'Docker',
          level: 'intermediate',
          icon: '🐳',
          positionX: 200,
          positionY: 600,
          categoryId: 'cat-infra',
        },
        {
          name: 'CI/CD',
          level: 'advanced',
          icon: '🔄',
          positionX: 400,
          positionY: 600,
          categoryId: 'cat-infra',
        },
      ],
      edges: [
        { source: 'Node.js', target: 'Express / NestJS' },
        { source: 'Express / NestJS', target: 'REST APIs' },
        { source: 'Express / NestJS', target: 'GraphQL' },
        { source: 'REST APIs', target: 'PostgreSQL' },
        { source: 'REST APIs', target: 'Redis' },
        { source: 'GraphQL', target: 'MongoDB' },
        { source: 'PostgreSQL', target: 'Docker' },
        { source: 'Docker', target: 'CI/CD' },
      ],
    },
  },
  {
    name: 'DevOps Engineer',
    description:
      'Cloud infrastructure, containerization, CI/CD pipelines, monitoring, and automation.',
    field: 'devops',
    isFeatured: true,
    graphData: {
      categories: [
        { id: 'cat-containers', name: 'Containers', color: '#3B82F6', sortOrder: 0 },
        { id: 'cat-cloud', name: 'Cloud', color: '#F59E0B', sortOrder: 1 },
        { id: 'cat-monitoring', name: 'Monitoring', color: '#EC4899', sortOrder: 2 },
      ],
      nodes: [
        {
          name: 'Linux',
          level: 'intermediate',
          icon: '🐧',
          positionX: 300,
          positionY: 0,
          categoryId: 'cat-containers',
        },
        {
          name: 'Docker',
          level: 'intermediate',
          icon: '🐳',
          positionX: 300,
          positionY: 150,
          categoryId: 'cat-containers',
        },
        {
          name: 'Kubernetes',
          level: 'advanced',
          icon: '☸️',
          positionX: 300,
          positionY: 300,
          categoryId: 'cat-containers',
        },
        {
          name: 'AWS',
          level: 'advanced',
          icon: '☁️',
          positionX: 100,
          positionY: 450,
          categoryId: 'cat-cloud',
        },
        {
          name: 'Terraform',
          level: 'advanced',
          icon: '🏗️',
          positionX: 300,
          positionY: 450,
          categoryId: 'cat-cloud',
        },
        {
          name: 'GitHub Actions',
          level: 'intermediate',
          icon: '🔄',
          positionX: 500,
          positionY: 450,
          categoryId: 'cat-cloud',
        },
        {
          name: 'Prometheus',
          level: 'intermediate',
          icon: '📊',
          positionX: 200,
          positionY: 600,
          categoryId: 'cat-monitoring',
        },
        {
          name: 'Grafana',
          level: 'intermediate',
          icon: '📈',
          positionX: 400,
          positionY: 600,
          categoryId: 'cat-monitoring',
        },
      ],
      edges: [
        { source: 'Linux', target: 'Docker' },
        { source: 'Docker', target: 'Kubernetes' },
        { source: 'Kubernetes', target: 'AWS' },
        { source: 'Kubernetes', target: 'Terraform' },
        { source: 'Docker', target: 'GitHub Actions' },
        { source: 'Kubernetes', target: 'Prometheus' },
        { source: 'Prometheus', target: 'Grafana' },
      ],
    },
  },
  {
    name: 'Data Science',
    description: 'Data analysis, machine learning, visualization, and statistical modeling skills.',
    field: 'data',
    isFeatured: false,
    graphData: {
      categories: [
        { id: 'cat-fundamentals', name: 'Fundamentals', color: '#22D3EE', sortOrder: 0 },
        { id: 'cat-ml', name: 'Machine Learning', color: '#A855F7', sortOrder: 1 },
        { id: 'cat-tools', name: 'Tools', color: '#10B981', sortOrder: 2 },
      ],
      nodes: [
        {
          name: 'Python',
          level: 'intermediate',
          icon: '🐍',
          positionX: 300,
          positionY: 0,
          categoryId: 'cat-fundamentals',
        },
        {
          name: 'Statistics',
          level: 'intermediate',
          icon: '📐',
          positionX: 500,
          positionY: 0,
          categoryId: 'cat-fundamentals',
        },
        {
          name: 'Pandas',
          level: 'intermediate',
          icon: '🐼',
          positionX: 200,
          positionY: 150,
          categoryId: 'cat-tools',
        },
        {
          name: 'NumPy',
          level: 'intermediate',
          icon: '🔢',
          positionX: 400,
          positionY: 150,
          categoryId: 'cat-tools',
        },
        {
          name: 'Scikit-learn',
          level: 'advanced',
          icon: '🤖',
          positionX: 200,
          positionY: 300,
          categoryId: 'cat-ml',
        },
        {
          name: 'TensorFlow',
          level: 'advanced',
          icon: '🧠',
          positionX: 400,
          positionY: 300,
          categoryId: 'cat-ml',
        },
        {
          name: 'Data Visualization',
          level: 'intermediate',
          icon: '📊',
          positionX: 300,
          positionY: 450,
          categoryId: 'cat-tools',
        },
        {
          name: 'SQL',
          level: 'beginner',
          icon: '🗃️',
          positionX: 100,
          positionY: 0,
          categoryId: 'cat-fundamentals',
        },
      ],
      edges: [
        { source: 'Python', target: 'Pandas' },
        { source: 'Python', target: 'NumPy' },
        { source: 'Statistics', target: 'NumPy' },
        { source: 'Pandas', target: 'Scikit-learn' },
        { source: 'NumPy', target: 'TensorFlow' },
        { source: 'Scikit-learn', target: 'Data Visualization' },
        { source: 'SQL', target: 'Pandas' },
      ],
    },
  },
];

async function main() {
  console.log('Seeding templates...');

  for (const t of templates) {
    const existing = await prisma.template.findFirst({ where: { name: t.name } });
    if (existing) {
      console.log(`  ⏭️  "${t.name}" already exists, skipping`);
      continue;
    }
    await prisma.template.create({
      data: {
        name: t.name,
        description: t.description,
        field: t.field,
        graphData: t.graphData,
        isFeatured: t.isFeatured,
      },
    });
    console.log(`  ✅ Created "${t.name}"`);
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
