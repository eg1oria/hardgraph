import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { fetchPublic } from '@/lib/api';
import type { ResumeData } from '@/types/resume';
import { ResumeView } from '@/components/resume/ResumeView';

interface Props {
  params: { username: string; slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const resume = await fetchPublic<ResumeData>(
      `/resume/${encodeURIComponent(params.username)}/${encodeURIComponent(params.slug)}`,
      0,
    );
    return {
      title: `${resume.name} — ${resume.title} | HardGraph Resume`,
      description: resume.summary,
      openGraph: {
        title: `${resume.name} — ${resume.title}`,
        description: resume.summary,
      },
    };
  } catch {
    return { title: 'Resume — HardGraph' };
  }
}

export default async function ResumePage({ params }: Props) {
  let resume: ResumeData;
  try {
    resume = await fetchPublic<ResumeData>(
      `/resume/${encodeURIComponent(params.username)}/${encodeURIComponent(params.slug)}`,
      0,
    );
  } catch {
    notFound();
  }

  return <ResumeView resume={resume} />;
}
