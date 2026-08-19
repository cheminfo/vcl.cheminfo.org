import { defineConfig, globalIgnores } from 'eslint/config';
import { globals } from 'eslint-config-zakodium';
import react from 'eslint-config-zakodium/react';
import ts from 'eslint-config-zakodium/ts';
import unicorn from 'eslint-config-zakodium/unicorn';

export default defineConfig(
  globalIgnores(['coverage', 'dist', 'playwright-report', 'test-results']),
  ts,
  unicorn,
  react,
  {
    // The vite config and the plugin beside it run in node, and read the
    // address of the deployment from the environment they were started in.
    files: ['vite*.ts'],
    languageOptions: { globals: { ...globals.nodeBuiltin } },
  },
);
