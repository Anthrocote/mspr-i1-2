import fs from 'node:fs';
import path from 'node:path';
import { HELP_ARTICLES } from '@/content/help';

const PUBLIC = path.join(process.cwd(), 'public');

describe('help image assets', () => {
  it('every image block points to a file that exists in public/', () => {
    for (const article of HELP_ARTICLES) {
      for (const lang of ['fr', 'en', 'es'] as const) {
        for (const block of article.blocks[lang]) {
          if (block.kind === 'image') {
            expect(fs.existsSync(path.join(PUBLIC, block.src))).toBe(true);
          }
        }
      }
    }
  });
});
