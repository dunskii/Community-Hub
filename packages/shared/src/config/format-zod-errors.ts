/**
 * Format Zod validation issues into a human-readable error list.
 */
export function formatZodErrors(
  issues: ReadonlyArray<{ path: (string | number)[]; message: string }>,
): string {
  return issues
    .map((i) => `  - ${i.path.length > 0 ? i.path.join('.') : '(root)'}: ${i.message}`)
    .join('\n');
}
