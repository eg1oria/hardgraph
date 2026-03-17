'use client';

import { useRef } from 'react';
import Link from 'next/link';
import {
  Download,
  ArrowLeft,
  Github,
  Globe,
  Linkedin,
  Twitter,
  ExternalLink,
  Briefcase,
  Code2,
  User as UserIcon,
  FileText,
} from 'lucide-react';
import type { ResumeData } from '@/types/resume';

interface ResumeViewProps {
  resume: ResumeData;
}

export function ResumeView({ resume }: ResumeViewProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const hasContacts =
    resume.contacts.github ||
    resume.contacts.website ||
    resume.contacts.linkedin ||
    resume.contacts.twitter;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar — hidden in print */}
      <div className="print:hidden sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link
            href={`/${resume.username}/${resume.graphSlug}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to graph
          </Link>
          <button
            onClick={handlePrint}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Resume content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12" ref={printRef}>
        <div className="bg-surface rounded-xl border border-border p-6 sm:p-10 print:bg-white print:border-none print:shadow-none print:p-0 print:rounded-none">
          {/* Header */}
          <header className="mb-8 print:mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground print:text-black">
              {resume.name}
            </h1>
            <p className="text-lg sm:text-xl text-primary-400 font-medium mt-1 print:text-gray-700">
              {resume.title}
            </p>
            {/* Contact links inline */}
            {hasContacts && (
              <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground print:text-gray-500">
                {resume.contacts.github && (
                  <a
                    href={resume.contacts.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span className="print:hidden">GitHub</span>
                    <span className="hidden print:inline">{resume.contacts.github}</span>
                  </a>
                )}
                {resume.contacts.website && (
                  <a
                    href={resume.contacts.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span className="print:hidden">Website</span>
                    <span className="hidden print:inline">{resume.contacts.website}</span>
                  </a>
                )}
                {resume.contacts.linkedin && (
                  <a
                    href={resume.contacts.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                    <span className="print:hidden">LinkedIn</span>
                    <span className="hidden print:inline">{resume.contacts.linkedin}</span>
                  </a>
                )}
                {resume.contacts.twitter && (
                  <a
                    href={resume.contacts.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    <Twitter className="w-3.5 h-3.5" />
                    <span className="print:hidden">Twitter</span>
                    <span className="hidden print:inline">{resume.contacts.twitter}</span>
                  </a>
                )}
              </div>
            )}
          </header>

          {/* Summary */}
          {resume.summary && (
            <section className="mb-8 print:mb-6">
              <SectionHeader icon={UserIcon} title="Summary" />
              <p className="text-muted-foreground leading-relaxed print:text-gray-600">
                {resume.summary}
              </p>
            </section>
          )}

          {/* Skills */}
          {resume.skills.length > 0 && (
            <section className="mb-8 print:mb-6">
              <SectionHeader icon={Code2} title="Skills" />
              <div className="flex flex-wrap gap-2">
                {resume.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-primary/10 text-primary-400 border border-primary/20 print:bg-gray-100 print:text-gray-800 print:border-gray-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {resume.projects.length > 0 && (
            <section className="mb-8 print:mb-6">
              <SectionHeader icon={Briefcase} title="Projects" />
              <div className="space-y-4">
                {resume.projects.map((project) => (
                  <div
                    key={project.name}
                    className="p-4 rounded-lg border border-border bg-background/50 print:border-gray-200 print:bg-white"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-foreground print:text-black">
                        {project.name}
                      </h3>
                      {project.link && (
                        <a
                          href={project.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors print:hidden"
                          aria-label={`Open ${project.name} repository`}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    {project.description && (
                      <p className="text-sm text-muted-foreground mt-1 print:text-gray-600">
                        {project.description}
                      </p>
                    )}
                    {project.link && (
                      <p className="hidden print:block text-xs text-gray-400 mt-1">
                        {project.link}
                      </p>
                    )}
                    {project.tech.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {project.tech.map((t) => (
                          <span
                            key={t}
                            className="text-xs px-2 py-0.5 rounded-md bg-surface-light text-muted-foreground print:bg-gray-100 print:text-gray-600"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Source graph link */}
          <footer className="pt-6 border-t border-border print:border-gray-200 text-sm text-muted print:text-gray-400">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>
                Generated from{' '}
                <Link
                  href={`/${resume.username}/${resume.graphSlug}`}
                  className="text-primary-400 hover:underline print:text-gray-600"
                >
                  {resume.graphTitle}
                </Link>
                {' '}on HardGraph
              </span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-5 h-5 text-primary-400 print:text-gray-700" />
      <h2 className="text-lg font-semibold text-foreground print:text-black">{title}</h2>
    </div>
  );
}
