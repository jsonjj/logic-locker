import type { Lesson, Step } from '../types'

/** Total number of versions for a step (base + variants). */
export function variantCount(step: Step): number {
  return (step.variants?.length ?? 0) + 1
}

/**
 * How many full "case tracks" a lesson offers. Every step is rendered with the
 * same track so a room's questions stay consistent within one run.
 */
export function trackCount(lesson: Lesson): number {
  return lesson.steps.reduce((max, s) => Math.max(max, variantCount(s)), 1)
}

/**
 * Merge the chosen track's variant content over the base step. Track 0 is the
 * base step; 1..N select a variant. The step's identity (id, type, phase) is
 * always preserved so progress tracking stays stable across versions. Steps
 * with no variant for the requested track fall back to the base.
 */
export function resolveStep(step: Step, track: number): Step {
  const variants = step.variants
  if (!variants || track <= 0 || track > variants.length) return step
  const v = variants[track - 1]
  return {
    ...step,
    ...v,
    id: step.id,
    type: step.type,
    phase: step.phase,
    variants: step.variants,
  } as Step
}

/**
 * Choose a case track for a run. New players get a random track; on retry we
 * guarantee a different track than the previous run.
 */
export function pickTrack(lesson: Lesson, previous?: number): number {
  const total = trackCount(lesson)
  if (total <= 1) return 0
  if (previous === undefined || previous === null) {
    return Math.floor(Math.random() * total)
  }
  return (previous + 1 + Math.floor(Math.random() * (total - 1))) % total
}
