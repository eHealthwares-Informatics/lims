import { TestDefinitionEntity } from '../entities';
import {
  OrderPriorityLike,
  ResultReleaseLike,
  ResultTatSource,
} from './result-tat-source';

/** Order priority buckets a TAT target can be configured for. */
export enum TatPriority {
  ROUTINE = 'ROUTINE',
  STAT = 'STAT',
  EMERGENCY = 'EMERGENCY',
}

/** Minimal test-definition shape the TAT calculator needs. */
export interface TatTargets {
  tatRoutineMinutes?: number | null;
  tatStatMinutes?: number | null;
  tatEmergencyMinutes?: number | null;
}

/** TAT evaluation for a single result. */
export interface TatSummary {
  priority: TatPriority;
  /** Minutes from order entry to result release. Null when either timestamp is missing. */
  actualMinutes: number | null;
  /** Configured target (minutes) for the resolved priority, if any. */
  targetMinutes: number | null;
  /** True only when an actual exists, a target exists, and actual > target. */
  breached: boolean;
  /** How many minutes past the target the actual is (0 when within target). */
  breachedByMinutes: number | null;
}

const PRIORITY_ALIASES: Record<string, TatPriority> = {
  ROUTINE: TatPriority.ROUTINE,
  NORMAL: TatPriority.ROUTINE,
  STAT: TatPriority.STAT,
  URGENT: TatPriority.STAT,
  EMERGENCY: TatPriority.EMERGENCY,
  CRITICAL: TatPriority.EMERGENCY,
};

/**
 * Map an order priority (code or name) onto a TAT priority bucket.
 * Unknown/default priorities fall back to ROUTINE.
 */
export function resolvePriorityCode(
  priorityCode?: string | null,
  priorityName?: string | null,
): TatPriority {
  for (const raw of [priorityCode, priorityName]) {
    if (!raw) continue;
    const normalized = raw.trim().toUpperCase().replace(/[\s-]+/g, '_');
    const match = PRIORITY_ALIASES[normalized];
    if (match) return match;
    if (normalized.includes('EMERGENCY')) return TatPriority.EMERGENCY;
    if (normalized.includes('STAT') || normalized.includes('URGENT')) return TatPriority.STAT;
  }
  return TatPriority.ROUTINE;
}

/** Pick the configured target (minutes) for a priority. */
export function targetMinutesFor(test: TatTargets | null | undefined, priority: TatPriority): number | null {
  if (!test) return null;
  switch (priority) {
    case TatPriority.STAT:
      return test.tatStatMinutes ?? null;
    case TatPriority.EMERGENCY:
      return test.tatEmergencyMinutes ?? null;
    default:
      return test.tatRoutineMinutes ?? null;
  }
}

/**
 * Whole minutes between two timestamps, rounded to the nearest minute.
 * Null when either side is missing or the end precedes the start.
 */
export function actualMinutesBetween(
  startedAt: Date | string | null | undefined,
  releasedAt: Date | string | null | undefined,
): number | null {
  const start = toDate(startedAt);
  const end = toDate(releasedAt);
  if (!start || !end) return null;
  const diffMinutes = (end.getTime() - start.getTime()) / 60000;
  if (diffMinutes < 0) return null;
  return Math.round(diffMinutes);
}

/**
 * Evaluate TAT for one result: which target applies, how long it actually took,
 * and whether the target was breached.
 */
export function summarizeTat(input: {
  test?: TatTargets | null;
  priorityCode?: string | null;
  priorityName?: string | null;
  startedAt?: Date | string | null;
  releasedAt?: Date | string | null;
}): TatSummary {
  const priority = resolvePriorityCode(input.priorityCode, input.priorityName);
  const targetMinutes = targetMinutesFor(input.test, priority);
  const actualMinutes = actualMinutesBetween(input.startedAt, input.releasedAt);

  const hasBoth = actualMinutes !== null && targetMinutes !== null;
  return {
    priority,
    actualMinutes,
    targetMinutes,
    breached: hasBoth && actualMinutes > (targetMinutes as number),
    breachedByMinutes: hasBoth ? Math.max(0, (actualMinutes as number) - (targetMinutes as number)) : null,
  };
}

/**
 * Compute TAT for a result row loaded with its orderItem/order/testDefinition.
 * Order entry = order createdAt (requestedDate fallback); result release =
 * result validatedDate (updatedAt fallback).
 */
export function computeResultTat(result: ResultTatSource): TatSummary {
  const orderItem = result.orderItem;
  const order = orderItem?.order;
  const priority: OrderPriorityLike | null | undefined = order?.priority;
  return summarizeTat({
    test: orderItem?.testDefinition ?? null,
    priorityCode: priority?.code ?? null,
    priorityName: priority?.name ?? null,
    startedAt: order?.createdAt ?? order?.requestedDate ?? null,
    releasedAt: result.validatedDate ?? result.updatedAt ?? null,
  });
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
