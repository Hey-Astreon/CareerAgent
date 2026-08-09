import { describe, it, expect } from 'vitest';
import { runAllProviders } from "../src/lib/providers/registry";

// This test simply triggers the provider pipeline and ensures it completes.
// The diagnostic logs are emitted to stdout and will be captured in the test output.

describe('Provider diagnostics run', () => {
  it('executes all providers without throwing', async () => {
    const result = await runAllProviders();
    expect(result).toBeDefined();
    expect(Array.isArray(result.providerResults)).toBe(true);
  }, 180000); // allow up to 3 minutes for all providers
});
