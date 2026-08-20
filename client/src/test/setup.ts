import { expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
// Type-only: augments vitest's `expect` with the jest-dom matcher types (erased at runtime, so it
// does not re-trigger the wrong-instance auto-extend that the '/vitest' runtime entry would).
import type {} from '@testing-library/jest-dom/vitest';

// Extend the test runner's own `expect` (setup runs transformed, so this `expect` is the injected
// one the tests use). Importing '@testing-library/jest-dom/vitest' instead would extend the expect
// of the physical vitest package resolved by node, which is a different instance under this
// single-root-config / per-package-node_modules layout, and the matchers would not attach.
expect.extend(matchers);
