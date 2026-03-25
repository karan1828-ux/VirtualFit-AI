import { describe, it, expect } from 'vitest';
import { chooseBestImageFromHtml, normalizeCandidate } from './scraper';

describe('scraper service helpers', () => {
  it('normalizes relative and protocol-relative candidates', () => {
    expect(normalizeCandidate('/img/a.jpg', 'https://example.com/p/1')).toBe('https://example.com/img/a.jpg');
    expect(normalizeCandidate('//cdn.example.com/a.jpg', 'https://example.com/p/1')).toBe('https://cdn.example.com/a.jpg');
  });

  it('chooses the best image from HTML using og:image first', () => {
    const html = `
      <html>
        <head>
          <title>Test Product</title>
          <meta property="og:image" content="/img/og1.jpg" />
        </head>
        <body>
          <img src="https://cdn.example.com/pixel.gif" width="800" height="800" />
          <img src="/img/large2.jpg" width="300" height="300" />
        </body>
      </html>
    `;

    const res = chooseBestImageFromHtml(html, 'https://example.com/p/123');
    expect(res.title).toBe('Test Product');
    expect(res.imageUrl).toBe('https://example.com/img/og1.jpg');
  });
});

