import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
  {
    rules: {
      // Enforce that feature components never import directly from a theme folder.
      // Primitives must be accessed only through useTheme().primitives.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/themes/terminal/**', '**/themes/modern/**', '**/themes/*/index*'],
              message: 'Import theme primitives via useTheme().primitives, not directly.',
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
