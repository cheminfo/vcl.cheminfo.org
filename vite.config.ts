import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Derived from the project creation date 2026-08-11: 6 + 08 + 11 = 60811,
// over 60000 so minus 50000 gives the 10811 published by docker compose. The
// dev server takes that port plus one.
const DEV_SERVER_PORT = 10812;

export default defineConfig({
  plugins: [react()],
  server: {
    port: DEV_SERVER_PORT,
    // Fail loudly instead of drifting to the next free port, which would leave
    // the README and any bookmarked URL disagreeing with reality.
    strictPort: true,
  },
});
