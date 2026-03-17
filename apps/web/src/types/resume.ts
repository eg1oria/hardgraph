export interface ResumeProject {
  name: string;
  description?: string;
  tech: string[];
  link?: string;
}

export interface ResumeContacts {
  github?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
}

export interface ResumeData {
  name: string;
  title: string;
  summary: string;
  skills: string[];
  projects: ResumeProject[];
  contacts: ResumeContacts;
  graphTitle: string;
  graphSlug: string;
  username: string;
}
