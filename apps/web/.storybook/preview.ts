import type { Preview } from '@storybook/react';
import '../src/app/globals.css';

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'terminal',
      values: [{ name: 'terminal', value: '#0a0a0a' }],
    },
    layout: 'padded',
  },
  // ThemeProvider decorator is added in Phase 07 once the context is implemented.
  decorators: [],
};

export default preview;
