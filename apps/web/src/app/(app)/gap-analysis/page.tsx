'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Target, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { GraphSelector } from '@/components/gap-analysis/GraphSelector';
import { TargetSelector } from '@/components/gap-analysis/TargetSelector';
import {
  GapAnalysisResult,
  type GapAnalysisData,
} from '@/components/gap-analysis/GapAnalysisResult';

type Step = 'graph' | 'template' | 'result';

export default function GapAnalysisPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>('graph');
  const [selectedGraphId, setSelectedGraphId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [result, setResult] = useState<GapAnalysisData | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Pre-select graph from query param
  useEffect(() => {
    const graphId = searchParams.get('graphId');
    if (graphId) {
      setSelectedGraphId(graphId);
      setStep('template');
    }
  }, [searchParams]);

  const handleAnalyze = async () => {
    if (!selectedGraphId || !selectedTemplateId) return;
    setAnalyzing(true);
    try {
      const data = await api.get<GapAnalysisData>(
        `/gap-analysis/${selectedGraphId}/${selectedTemplateId}`,
      );
      setResult(data);
      setStep('result');
    } catch {
      toast('Failed to analyze skill gaps', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setStep('graph');
    setSelectedGraphId(null);
    setSelectedTemplateId(null);
    setResult(null);
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Target className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Skill Gap Analysis</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Compare your skill graph against a target template to identify gaps and plan your growth.
        </p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[
          { key: 'graph', label: '1. Select Graph' },
          { key: 'template', label: '2. Choose Target' },
          { key: 'result', label: '3. Results' },
        ].map((s, i) => {
          const steps: Step[] = ['graph', 'template', 'result'];
          const currentIdx = steps.indexOf(step);
          const stepIdx = i;
          const isActive = step === s.key;
          const isDone = stepIdx < currentIdx;
          return (
            <div key={s.key} className="flex items-center gap-2">
              {i > 0 && (
                <div className={`w-8 h-px ${isDone || isActive ? 'bg-primary' : 'bg-border'}`} />
              )}
              <span
                className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                  isActive
                    ? 'bg-primary/15 text-primary-400'
                    : isDone
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-surface-light text-muted-foreground'
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      {step === 'graph' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Select your skill graph</h2>
          <GraphSelector selectedId={selectedGraphId} onSelect={(id) => setSelectedGraphId(id)} />
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setStep('template')}
              disabled={!selectedGraphId}
              className="btn-primary"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 'template' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Choose a target template</h2>
          <p className="text-sm text-muted-foreground">
            Select the ideal role profile you want to compare your skills against.
          </p>
          <TargetSelector
            selectedId={selectedTemplateId}
            onSelect={(id) => setSelectedTemplateId(id)}
          />
          <div className="flex justify-between pt-2">
            <button onClick={() => setStep('graph')} className="btn-ghost">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleAnalyze}
              disabled={!selectedTemplateId || analyzing}
              className="btn-primary"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
                </>
              ) : (
                <>
                  Analyze <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {step === 'result' && result && (
        <div className="space-y-4">
          <GapAnalysisResult data={result} />
          <div className="flex justify-center pt-4">
            <button onClick={handleReset} className="btn-secondary">
              <ArrowLeft className="w-4 h-4" /> Analyze Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
