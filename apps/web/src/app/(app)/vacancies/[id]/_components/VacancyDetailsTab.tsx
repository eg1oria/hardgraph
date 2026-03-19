import { CheckCircle2, Send } from 'lucide-react';
import type { VacancyDetail, ApplicationStatus } from './types';

interface VacancyDetailsTabProps {
  vacancy: VacancyDetail;
  isOwner: boolean;
  user: { id: string } | null;
  checkingApplication: boolean;
  applicationStatus: ApplicationStatus | null;
  onApply: () => void;
}

export function VacancyDetailsTab({
  vacancy,
  isOwner,
  user,
  checkingApplication,
  applicationStatus,
  onApply,
}: VacancyDetailsTabProps) {
  const canApply = user && !isOwner && !checkingApplication && vacancy.isActive;

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {vacancy.description && (
          <div className="card">
            <h3 className="text-sm font-semibold mb-3">Description</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {vacancy.description}
            </p>
          </div>
        )}
        {/* Apply Button */}
        {canApply && (
          <div className="card">
            {applicationStatus ? (
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium">Applied</p>
                  <p className="text-xs text-muted-foreground">
                    Status:{' '}
                    <span
                      className={`font-medium ${
                        applicationStatus.status === 'accepted'
                          ? 'text-emerald-500'
                          : applicationStatus.status === 'rejected'
                            ? 'text-red-500'
                            : applicationStatus.status === 'shortlisted'
                              ? 'text-purple-500'
                              : applicationStatus.status === 'reviewing'
                                ? 'text-blue-500'
                                : 'text-amber-500'
                      }`}
                    >
                      {applicationStatus.status}
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={onApply}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Apply with my Graph
              </button>
            )}
          </div>
        )}
        {/* Show closed message for non-owners */}
        {user && !isOwner && !vacancy.isActive && (
          <div className="card bg-surface-light border-border">
            <p className="text-sm text-muted-foreground text-center">
              This vacancy is closed and no longer accepting applications.
            </p>
          </div>
        )}
      </div>
      <div className="space-y-4">
        <div className="card">
          <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-3">
            Required Skills ({vacancy.skills.length})
          </h3>
          <div className="space-y-2">
            {vacancy.skills.map((skill) => (
              <div key={skill.name} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: skill.categoryColor || '#6B7280' }}
                  />
                  <span className="text-sm font-medium">{skill.name}</span>
                </div>
                <span className="text-xs text-muted-foreground capitalize">{skill.level}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
