'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, Network, Send, BarChart3, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { getScoreColor, getScoreBg } from './types';
import type { VacancyDetail, MyGraph, CompareResult } from './types';

interface ApplyModalProps {
  vacancy: VacancyDetail;
  onClose: () => void;
  onApplied: (result: { id: string; status: string }) => void;
}

export function ApplyModal({ vacancy, onClose, onApplied }: ApplyModalProps) {
  const { toast } = useToast();

  const [myGraphs, setMyGraphs] = useState<MyGraph[]>([]);
  const [loadingMyGraphs, setLoadingMyGraphs] = useState(true);
  const [selectedGraphId, setSelectedGraphId] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);

  // Match preview state
  const [previewResult, setPreviewResult] = useState<CompareResult | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewedGraphId, setPreviewedGraphId] = useState('');

  // Load graphs on mount
  useEffect(() => {
    api
      .get<MyGraph[]>('/graphs')
      .then((graphs) => {
        setMyGraphs(graphs);
        if (graphs.length > 0 && graphs[0]) setSelectedGraphId(graphs[0].id);
      })
      .catch(() => toast('Failed to load your graphs', 'error'))
      .finally(() => setLoadingMyGraphs(false));
  }, [toast]);

  const handlePreviewMatch = async () => {
    if (!selectedGraphId) return;
    if (selectedGraphId === previewedGraphId && previewResult) return;
    setLoadingPreview(true);
    setPreviewResult(null);
    try {
      const result = await api.get<CompareResult>(
        `/vacancies/${vacancy.id}/compare/${selectedGraphId}`,
      );
      setPreviewResult(result);
      setPreviewedGraphId(selectedGraphId);
    } catch {
      toast('Failed to preview match', 'error');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleApply = async () => {
    if (!selectedGraphId) {
      toast('Please select a graph', 'error');
      return;
    }
    setApplying(true);
    try {
      const result = await api.post<{ id: string; status: string }>(
        `/vacancies/${vacancy.id}/applications`,
        { graphId: selectedGraphId, coverLetter: coverLetter || undefined },
      );
      onApplied(result);
      toast('Application submitted successfully!', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to apply';
      toast(message, 'error');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Apply to {vacancy.title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-light text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loadingMyGraphs ? (
          <div className="flex justify-center py-8">
            <Spinner size="md" className="text-primary" />
          </div>
        ) : myGraphs.length === 0 ? (
          <div className="text-center py-8">
            <Network className="w-10 h-10 mx-auto mb-3 text-muted opacity-40" />
            <p className="text-sm text-muted-foreground mb-3">
              You don&apos;t have any graphs yet. Create one first!
            </p>
            <Link href="/dashboard" className="btn-primary text-sm">
              Create Graph
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Your Graph</label>
              <select
                value={selectedGraphId}
                onChange={(e) => {
                  setSelectedGraphId(e.target.value);
                  setPreviewResult(null);
                  setPreviewedGraphId('');
                }}
                className="input-field w-full"
              >
                {myGraphs.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title} ({g._count.nodes} skills)
                  </option>
                ))}
              </select>
            </div>

            {/* Match Preview */}
            <div>
              <button
                onClick={handlePreviewMatch}
                disabled={!selectedGraphId || loadingPreview}
                className="text-sm text-primary hover:underline flex items-center gap-1.5 disabled:opacity-50"
              >
                {loadingPreview ? (
                  <Spinner size="sm" className="text-primary" />
                ) : (
                  <BarChart3 className="w-3.5 h-3.5" />
                )}
                Preview match score
              </button>

              {previewResult && (
                <div className="mt-2 rounded-lg bg-surface-light p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Match Score</span>
                    <span
                      className={`text-lg font-bold ${getScoreColor(previewResult.matchScore)}`}
                    >
                      {previewResult.matchScore}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-surface overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getScoreBg(previewResult.matchScore)}`}
                      style={{ width: `${previewResult.matchScore}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="text-emerald-400">{previewResult.matchedCount} matched</span>
                    <span className="text-amber-400">{previewResult.upgradeCount} partial</span>
                    <span className="text-red-400">{previewResult.missingCount} missing</span>
                    {previewResult.bonusCount > 0 && (
                      <span className="text-cyan-400">{previewResult.bonusCount} bonus</span>
                    )}
                  </div>
                  <Link
                    href={`/${previewResult.candidateUsername}/${previewResult.graphSlug}/pitch?vacancy=${vacancy.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View Interactive Pitch
                  </Link>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Cover Letter <span className="text-muted-foreground">(optional)</span>
              </label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                maxLength={2000}
                rows={5}
                placeholder="Tell the employer why you're a great fit..."
                className="input-field w-full resize-none"
              />
              <p className="text-xs text-muted mt-1">{coverLetter.length}/2000</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-surface-light transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={applying || !selectedGraphId}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                {applying ? (
                  <Spinner size="sm" />
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Submit Application
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
