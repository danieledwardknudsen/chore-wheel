import type { Preview } from '@storybook/react';
import { ThemeProvider } from '../src/context/ThemeContext';
import '../src/app/globals.css';

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'terminal',
      values: [{ name: 'terminal', value: '#0a0a0a' }],
    },
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
  ],
};

export default preview;
