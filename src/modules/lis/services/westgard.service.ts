import { Injectable } from '@nestjs/common';

export interface WestgardViolation {
  rule: '1-2s' | '1-3s' | '2-2s' | 'R-4s' | '4-1s' | '10x';
  severity: 'WARNING' | 'REJECT';
  description: string;
}

/**
 * Evaluate Westgard rules for a new QC result given historical values
 * and the target mean/SD.
 *
 * Returns a list of violated rules (empty = in control).
 *
 * Westgard rules implemented:
 *   1-2s  — 1 observation exceeds mean ± 2SD (WARNING)
 *   1-3s  — 1 observation exceeds mean ± 3SD (REJECT)
 *   2-2s  — 2 consecutive observations exceed mean ± 2SD on same side (REJECT)
 *   R-4s  — 2 consecutive observations differ by > 4SD (REJECT)
 *   4-1s  — 4 consecutive observations exceed mean ± 1SD on same side (REJECT)
 *   10x   — 10 consecutive observations on same side of mean (REJECT)
 */
@Injectable()
export class WestgardService {
  evaluate(
    newValue: number,
    mean: number,
    sd: number,
    recentValues: { value: number; id: string }[],
  ): WestgardViolation[] {
    const violations: WestgardViolation[] = [];
    const allValues = [...recentValues.map((v) => v.value), newValue];
    const n = allValues.length;

    if (sd <= 0) return violations;

    const zScore = (val: number) => (val - mean) / sd;
    const z = zScore(newValue);

    // 1-2s: Warning — 1 value exceeds mean ± 2SD
    if (Math.abs(z) > 2) {
      violations.push({
        rule: '1-2s',
        severity: 'WARNING',
        description: `Value ${newValue.toFixed(2)} exceeds mean ± 2SD (z=${z.toFixed(2)})`,
      });
    }

    // 1-3s: Reject — 1 value exceeds mean ± 3SD
    if (Math.abs(z) > 3) {
      violations.push({
        rule: '1-3s',
        severity: 'REJECT',
        description: `Value ${newValue.toFixed(2)} exceeds mean ± 3SD (z=${z.toFixed(2)})`,
      });
    }

    if (n >= 2) {
      const prevZ = zScore(allValues[n - 2]);
      const currZ = z;

      // 2-2s: 2 consecutive outside ± 2SD on same side
      if (Math.abs(prevZ) > 2 && Math.abs(currZ) > 2 && Math.sign(prevZ) === Math.sign(currZ)) {
        violations.push({
          rule: '2-2s',
          severity: 'REJECT',
          description: '2 consecutive values exceed mean ± 2SD on same side',
        });
      }

      // R-4s: Range between 2 consecutive > 4SD
      if (Math.abs(currZ - prevZ) > 4) {
        violations.push({
          rule: 'R-4s',
          severity: 'REJECT',
          description: 'Range of 2 consecutive values exceeds 4SD',
        });
      }
    }

    if (n >= 4) {
      // 4-1s: 4 consecutive outside ± 1SD on same side
      const last4 = allValues.slice(-4);
      const z4 = last4.map(zScore);
      if (z4.every((v) => Math.abs(v) > 1) && z4.every((v) => Math.sign(v) === Math.sign(z4[0]))) {
        violations.push({
          rule: '4-1s',
          severity: 'REJECT',
          description: '4 consecutive values exceed mean ± 1SD on same side',
        });
      }
    }

    if (n >= 10) {
      // 10x: 10 consecutive on same side of mean
      const last10 = allValues.slice(-10).map(zScore);
      if (last10.every((v) => Math.sign(v) >= 0) || last10.every((v) => Math.sign(v) <= 0)) {
        violations.push({
          rule: '10x',
          severity: 'REJECT',
          description: '10 consecutive values on same side of mean',
        });
      }
    }

    return violations;
  }
}
