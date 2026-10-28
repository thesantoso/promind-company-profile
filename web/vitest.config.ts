// Fixed non-UTC zone so date formatting tests cannot pass by coincidence on UTC runners.
process.env.TZ = 'Asia/Jakarta';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['src/**/*.test.ts', 'tests/**/*.test.ts'] },
});
