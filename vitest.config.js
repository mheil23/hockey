import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    environmentMatchGlobs: [
      ['tests/renderer.test.js', 'jsdom'],
      ['tests/controller.test.js', 'jsdom'],
      ['tests/drag.test.js', 'jsdom'],
      ['tests/description.test.js', 'jsdom'],
      ['tests/arrows-mode.test.js', 'jsdom'],
      ['tests/properties/drag.property.test.js', 'jsdom'],
    ],
  },
});
