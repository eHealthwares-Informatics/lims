import { Injectable } from '@nestjs/common';

@Injectable()
export class CodeGeneratorService {
  private readonly patterns: Record<string, { prefix: string; expression: RegExp }> = {
    'test-definitions': { prefix: 'TST', expression: /^TST-[A-Z0-9]{3,}$/ },
    'rejection-reasons': { prefix: 'REJ', expression: /^REJ-[A-Z0-9]{3,}$/ },
    priorities: { prefix: 'PRI', expression: /^PRI-[A-Z0-9]{3,}$/ },
    'test-categories': { prefix: 'CAT', expression: /^CAT-[A-Z0-9]{3,}$/ },
    'location-types': { prefix: 'LOC', expression: /^[A-Z][A-Z0-9_]{2,49}$/ },
    loinc: { prefix: 'LNC', expression: /^[A-Z0-9.-]{2,30}$/ },
    programs: { prefix: 'PRG', expression: /^PRG-[A-Z0-9]{3,}$/ },
    'sample-types': { prefix: 'SMP', expression: /^[A-Z0-9_]{2,30}$/ },
    uoms: { prefix: 'UOM', expression: /^UOM-[A-Z0-9]{2,}$/ },
    'test-sections': { prefix: 'SEC', expression: /^SEC-[A-Z0-9]{2,}$/ },
    methods: { prefix: 'MET', expression: /^MET-[A-Z0-9]{2,}$/ },
    panels: { prefix: 'PNL', expression: /^PNL-[A-Z0-9]{2,}$/ },
    orders: { prefix: 'ORD', expression: /^ORD-[0-9]{8}-[A-Z0-9]{4}$/ },
  };

  generate(scope: string, seed: string): string {
    const config = this.patterns[scope] ?? { prefix: 'LIS', expression: /^.+$/ };
    const normalizedSeed = seed.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, 8);
    return `${config.prefix}-${normalizedSeed || Date.now().toString(36).toUpperCase()}`;
  }

  expression(scope: string) {
    return this.patterns[scope]?.expression ?? /^.+$/;
  }

  isValid(scope: string, code: string): boolean {
    return (this.patterns[scope]?.expression ?? /^.+$/).test(code);
  }
}
