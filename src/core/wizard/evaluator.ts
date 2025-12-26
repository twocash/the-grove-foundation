/**
 * Condition Expression Evaluator
 * Sprint: wizard-engine-v1
 *
 * Safely evaluates simple condition expressions without using eval().
 *
 * Supported expressions:
 * - "key"              → truthy check
 * - "!key"             → falsy check
 * - "key === 'value'"  → equality
 * - "key !== 'value'"  → inequality
 */

import { ConditionalAction } from './schema';

export function evaluateCondition(
  expression: string,
  inputs: Record<string, unknown>
): boolean {
  const trimmed = expression.trim();

  // Truthy check: "key"
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed)) {
    return Boolean(inputs[trimmed]);
  }

  // Falsy check: "!key"
  if (/^![a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed)) {
    const key = trimmed.slice(1);
    return !inputs[key];
  }

  // Equality: "key === 'value'" or 'key === "value"'
  const eqMatch = trimmed.match(
    /^([a-zA-Z_][a-zA-Z0-9_]*)\s*===\s*['"](.+)['"]$/
  );
  if (eqMatch) {
    const [, key, value] = eqMatch;
    return inputs[key] === value;
  }

  // Inequality: "key !== 'value'"
  const neqMatch = trimmed.match(
    /^([a-zA-Z_][a-zA-Z0-9_]*)\s*!==\s*['"](.+)['"]$/
  );
  if (neqMatch) {
    const [, key, value] = neqMatch;
    return inputs[key] !== value;
  }

  console.warn(`[WizardEngine] Invalid condition expression: "${expression}"`);
  return false;
}

/**
 * Evaluate a ConditionalAction and return the target step ID
 */
export function evaluateNextStep(
  action: ConditionalAction,
  inputs: Record<string, unknown>
): string {
  if (action.conditions) {
    for (const condition of action.conditions) {
      if (evaluateCondition(condition.if, inputs)) {
        return condition.then;
      }
    }
  }
  return action.default;
}
