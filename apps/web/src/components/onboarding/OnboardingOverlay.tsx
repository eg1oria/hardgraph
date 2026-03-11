'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import { onboardingSteps, type TooltipPlacement } from './onboarding-steps';

interface Position {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TooltipPos {
  top: number;
  left: number;
}

function calcTooltipPosition(
  target: Position,
  placement: TooltipPlacement,
  tooltipWidth: number,
  tooltipHeight: number,
  gap = 16,
): TooltipPos {
  switch (placement) {
    case 'right':
      return {
        top: target.top + target.height / 2 - tooltipHeight / 2,
        left: target.left + target.width + gap,
      };
    case 'left':
      return {
        top: target.top + target.height / 2 - tooltipHeight / 2,
        left: target.left - tooltipWidth - gap,
      };
    case 'bottom':
      return {
        top: target.top + target.height + gap,
        left: target.left + target.width / 2 - tooltipWidth / 2,
      };
    case 'top':
      return {
        top: target.top - tooltipHeight - gap,
        left: target.left + target.width / 2 - tooltipWidth / 2,
      };
  }
}

function getArrowClasses(placement: TooltipPlacement): string {
  switch (placement) {
    case 'right':
      return 'left-0 top-1/2 -translate-x-full -translate-y-1/2 border-r-[hsl(var(--surface))] border-t-transparent border-b-transparent border-l-transparent';
    case 'left':
      return 'right-0 top-1/2 translate-x-full -translate-y-1/2 border-l-[hsl(var(--surface))] border-t-transparent border-b-transparent border-r-transparent';
    case 'bottom':
      return 'top-0 left-1/2 -translate-y-full -translate-x-1/2 border-b-[hsl(var(--surface))] border-l-transparent border-r-transparent border-t-transparent';
    case 'top':
      return 'bottom-0 left-1/2 translate-y-full -translate-x-1/2 border-t-[hsl(var(--surface))] border-l-transparent border-r-transparent border-b-transparent';
  }
}

export function OnboardingOverlay() {
  const { isActive, currentStep, next, prev, skip, complete } = useOnboardingStore();
  const [targetRect, setTargetRect] = useState<Position | null>(null);
  const [tooltipSize, setTooltipSize] = useState({ width: 360, height: 200 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const prevStepRef = useRef(currentStep);

  const step = onboardingSteps[currentStep];
  const isLast = currentStep === onboardingSteps.length - 1;
  const isFirst = currentStep === 0;
  const totalSteps = onboardingSteps.length;

  // Client-side mount check
  useEffect(() => {
    setMounted(true);
  }, []);

  // Measure target element position
  const measureTarget = useCallback(() => {
    if (!step) return;
    const el = document.querySelector(step.target);
    if (!el) {
      // Target not found — try to skip to a visible step
      setTargetRect(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    setTargetRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
  }, [step]);

  // Measure tooltip for position calculation
  useEffect(() => {
    if (tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      setTooltipSize({ width: rect.width, height: rect.height });
    }
  }, [currentStep, isActive, targetRect]);

  // Recalculate on step change, resize, scroll
  useEffect(() => {
    if (!isActive) return;
    measureTarget();

    const onResize = () => measureTarget();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [isActive, currentStep, measureTarget]);

  // Animation on step change
  useEffect(() => {
    if (prevStepRef.current !== currentStep) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      prevStepRef.current = currentStep;
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // ESC key handler
  useEffect(() => {
    if (!isActive) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        skip();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isActive, skip]);

  // Arrow key navigation
  useEffect(() => {
    if (!isActive) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        if (isLast) complete();
        else next();
      }
      if (e.key === 'ArrowLeft' && !isFirst) {
        e.preventDefault();
        prev();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isActive, isLast, isFirst, next, prev, complete]);

  if (!mounted || !isActive || !step) return null;

  // Skip steps whose target is not in the DOM
  if (!targetRect) {
    // Auto-advance to next visible step or complete
    return null;
  }

  const tooltipPos = calcTooltipPosition(
    targetRect,
    step.placement,
    tooltipSize.width,
    tooltipSize.height,
  );

  // Clamp tooltip within viewport
  const clampedLeft = Math.max(
    12,
    Math.min(tooltipPos.left, window.innerWidth - tooltipSize.width - 12),
  );
  const clampedTop = Math.max(
    12,
    Math.min(tooltipPos.top, window.innerHeight - tooltipSize.height - 12),
  );

  const StepIcon = step.icon;
  const padding = 8;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999]"
      role="dialog"
      aria-modal="true"
      aria-label={`Onboarding step ${currentStep + 1} of ${totalSteps}: ${step.title}`}
    >
      {/* Overlay backdrop with cutout for target element */}
      <svg
        className="absolute inset-0 w-full h-full onboarding-fade-in"
        style={{ pointerEvents: 'none' }}
      >
        <defs>
          <mask id="onboarding-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={targetRect.left - padding}
              y={targetRect.top - padding}
              width={targetRect.width + padding * 2}
              height={targetRect.height + padding * 2}
              rx="12"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.6)"
          mask="url(#onboarding-mask)"
          style={{ pointerEvents: 'auto' }}
          onClick={skip}
        />
      </svg>

      {/* Highlight ring around target */}
      <div
        className="absolute pointer-events-none onboarding-pulse-ring"
        style={{
          top: targetRect.top - padding,
          left: targetRect.left - padding,
          width: targetRect.width + padding * 2,
          height: targetRect.height + padding * 2,
          borderRadius: 12,
          boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.5), 0 0 24px rgba(99, 102, 241, 0.2)',
        }}
      />

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        className={cn(
          'absolute w-[calc(100vw-24px)] sm:w-[360px] max-w-[360px] bg-surface border border-border rounded-xl shadow-2xl shadow-black/25',
          isAnimating ? 'onboarding-tooltip-enter' : 'onboarding-tooltip-idle',
        )}
        style={{
          top: clampedTop,
          left: clampedLeft,
          zIndex: 10000,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Arrow */}
        <div
          className={cn(
            'absolute w-0 h-0 border-[8px] border-solid',
            getArrowClasses(step.placement),
          )}
        />

        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary shrink-0">
            <StepIcon className="w-4.5 h-4.5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground leading-tight">{step.title}</h3>
            <p className="text-xs text-muted mt-0.5">
              Шаг {currentStep + 1} из {totalSteps}
            </p>
          </div>
          <button
            onClick={skip}
            className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface-light transition-colors"
            aria-label="Закрыть подсказки"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 pb-3">
          {onboardingSteps.map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === currentStep
                  ? 'w-6 bg-primary'
                  : i < currentStep
                    ? 'w-1.5 bg-primary/40'
                    : 'w-1.5 bg-border',
              )}
            />
          ))}
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-between px-5 pb-5">
          <button
            onClick={skip}
            className="text-xs text-muted hover:text-muted-foreground transition-colors py-1.5 px-2 rounded-md hover:bg-surface-light"
          >
            Пропустить
          </button>

          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                onClick={prev}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground py-1.5 px-3 rounded-md hover:bg-surface-light border border-border transition-colors"
              >
                <ChevronLeft className="w-3 h-3" />
                Назад
              </button>
            )}
            <button
              onClick={isLast ? complete : next}
              className="flex items-center gap-1.5 text-xs font-medium text-white bg-primary hover:bg-primary-600 py-1.5 px-4 rounded-md transition-colors"
            >
              {isLast ? (
                <>
                  <Sparkles className="w-3 h-3" />
                  Готово
                </>
              ) : (
                <>
                  Далее
                  <ChevronRight className="w-3 h-3" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
