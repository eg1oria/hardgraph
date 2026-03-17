import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Globe, Twitter, Linkedin, Github, Eye, CalendarDays } from 'lucide-react';
import { fetchPublic } from '@/lib/api';
import { BackButton } from '@/components/ui/BackButton';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { GitHubReposSection } from '@/components/profile/GitHubReposSection';
import { SkillStatsSection } from '@/components/profile/SkillStatsSection';

interface PublicProfile {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  githubUsername: string | null;
  websiteUrl: string | null;
  twitterHandle: string | null;
  linkedinUrl: string | null;
  createdAt: string;
  graphs: Array<{
    id: string;
    title: string;
    slug: string;
    description: string | null;
    theme: string;
    viewCount: number;
    isPrimary: boolean;
    createdAt: string;
  }>;
  skillStats: Array<{
    name: string;
    color: string;
    score: number;
    skills: Array<{
      name: string;
      level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
      weight: number;
    }>;
  }>;
}

interface Props {
  params: { username: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (params.username.includes('.')) {
    return { title: 'Not Found — HardGraph' };
  }
  try {
    const profile = await fetchPublic<PublicProfile>(`/users/${params.username}`);
    const name = profile.displayName || profile.username;
    return {
      title: `${name} — HardGraph`,
      description: profile.bio || `${name}'s skill tree on HardGraph`,
      openGraph: {
        title: `${name} — HardGraph`,
        description: profile.bio || `View ${name}'s skill trees`,
      },
    };
  } catch {
    return { title: 'Profile — HardGraph' };
  }
}

export default async function PublicProfilePage({ params }: Props) {
  // Reject non-username paths (e.g. favicon.ico, robots.txt) that leak into dynamic route
  if (params.username.includes('.')) {
    notFound();
  }

  let profile: PublicProfile;
  try {
    profile = await fetchPublic<PublicProfile>(`/users/${params.username}`);
  } catch {
    notFound();
  }

  const name = profile.displayName || profile.username;
  const memberSince = new Date(profile.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton />
            <Link href="/" className="text-lg font-bold text-gradient">
              HardGraph
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Profile header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-10 text-center sm:text-left">
          <Avatar
            src={profile.avatarUrl ?? undefined}
            fallback={name}
            size="lg"
            className="!w-20 !h-20 !text-xl"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold">{name}</h1>
            <p className="text-muted-foreground text-sm">@{profile.username}</p>
            {profile.bio && (
              <p className="text-sm text-muted-foreground mt-2 max-w-xl">{profile.bio}</p>
            )}

            {/* Links */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 mt-3">
              {profile.websiteUrl && (
                <a
                  href={profile.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                  Website
                </a>
              )}
              {profile.twitterHandle && (
                <a
                  href={`https://twitter.com/${profile.twitterHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Twitter className="w-3.5 h-3.5" />@{profile.twitterHandle}
                </a>
              )}
              {profile.linkedinUrl && (
                <a
                  href={profile.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Linkedin className="w-3.5 h-3.5" />
                  LinkedIn
                </a>
              )}
              {profile.githubUsername && (
                <a
                  href={`https://github.com/${profile.githubUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Github className="w-3.5 h-3.5" />
                  GitHub
                </a>
              )}
              <span className="flex items-center gap-1 text-xs text-muted">
                <CalendarDays className="w-3.5 h-3.5" />
                Joined {memberSince}
              </span>
            </div>
          </div>
        </div>

        {/* Graphs grid */}
        <h2 className="text-lg font-semibold mb-4">Skill Trees ({profile.graphs.length})</h2>

        {profile.graphs.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No public skill trees yet.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {profile.graphs.map((graph) => (
              <Link
                key={graph.id}
                href={`/${profile.username}/${graph.slug}`}
                className="card-hover group"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold group-hover:text-primary-400 transition-colors">
                    {graph.title}
                  </h3>
                  {graph.isPrimary && <Badge variant="primary">Primary</Badge>}
                </div>
                {graph.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {graph.description}
                  </p>
                )}
                <div className="flex items-center gap-3 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {graph.viewCount} views
                  </span>
                  <span>
                    {new Date(graph.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Skill Stats (aggregated from all graphs) */}
        <SkillStatsSection skillStats={profile.skillStats} />

        {/* GitHub Repositories */}
        {profile.githubUsername && <GitHubReposSection username={profile.githubUsername} />}
      </div>
    </div>
  );
}
