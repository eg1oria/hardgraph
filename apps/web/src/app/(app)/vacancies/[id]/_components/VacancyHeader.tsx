import Link from 'next/link';
import { Building2, MapPin, DollarSign, Trash2, Edit3, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { timeAgo } from './types';
import type { VacancyDetail } from './types';

interface VacancyHeaderProps {
  vacancy: VacancyDetail;
  isOwner: boolean;
  onDelete: () => void;
}

export function VacancyHeader({ vacancy, isOwner, onDelete }: VacancyHeaderProps) {
  return (
    <div className="card mb-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold mb-2">{vacancy.title}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
            {vacancy.company && (
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> {vacancy.company}
              </span>
            )}
            {vacancy.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {vacancy.location}
              </span>
            )}
            {vacancy.salaryRange && (
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <DollarSign className="w-3.5 h-3.5" /> {vacancy.salaryRange}
              </span>
            )}
          </div>
        </div>
        {isOwner && (
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/vacancies/${vacancy.id}/edit`}
              className="p-2 rounded-lg hover:bg-surface-light text-muted-foreground hover:text-foreground transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </Link>
            <button
              onClick={onDelete}
              className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {vacancy.field && <Badge variant="muted">{vacancy.field}</Badge>}
        <Badge variant={vacancy.isActive ? 'primary' : 'muted'}>
          {vacancy.isActive ? 'Active' : 'Closed'}
        </Badge>
        <span className="flex items-center gap-1 text-xs text-muted">
          <Clock className="w-3 h-3" />
          Posted {timeAgo(vacancy.createdAt)} by{' '}
          {vacancy.author.displayName || vacancy.author.username}
        </span>
        {vacancy.updatedAt !== vacancy.createdAt && (
          <span className="text-xs text-muted">· Updated {timeAgo(vacancy.updatedAt)}</span>
        )}
      </div>
    </div>
  );
}
