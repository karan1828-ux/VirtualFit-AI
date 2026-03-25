import axios from 'axios';
import * as cheerio from 'cheerio';
import { ApiError } from './errors.js';

const BLACKLIST = [
  'logo',
  'icon',
  'sprite',
  'banner',
  'nav',
  'footer',
  'social',
  'avatar',
  'loading',
  'pixel',
  'tracking',
  'ads',
  'spinner',
];

const parseAmazonImage = ($: cheerio.CheerioAPI): string | null => {
  const selectors = [
    '#landingImage',
    '#main-image',
    'img[data-a-dynamic-image]',
    'img[data-old-hires]',
    'img[data-zoom-image]',
    '.a-dynamic-image',
  ];

  for (const selector of selectors) {
    const node = $(selector).first();
    if (!node.length) continue;

    const dynamicImage = node.attr('data-a-dynamic-image');
    if (dynamicImage) {
      try {
        const parsed = JSON.parse(dynamicImage) as Record<string, [number, number]>;
        const urls = Object.keys(parsed);
        if (urls.length) return urls.sort((a, b) => b.length - a.length)[0];
      } catch {
        // no-op
      }
    }

    const hiRes = node.attr('data-old-hires') || node.attr('data-zoom-image');
    if (hiRes) return hiRes;

    const src = node.attr('src');
    if (src && !src.includes('base64')) return src;
  }

  return null;
};

export const normalizeCandidate = (candidate: string, baseUrl: string): string | null => {
  try {
    if (!candidate) return null;
    if (candidate.startsWith('//')) return `https:${candidate}`;
    if (candidate.startsWith('/')) {
      const parsedBase = new URL(baseUrl);
      return `${parsedBase.protocol}//${parsedBase.host}${candidate}`;
    }

    const parsed = new URL(candidate);
    if (!parsed.protocol.startsWith('http')) return null;
    return parsed.toString();
  } catch {
    return null;
  }
};

export const chooseBestImageFromHtml = (
  html: string,
  productUrl: string,
): { imageUrl: string | null; title: string | null } => {
  const $ = cheerio.load(html);
  const candidates: string[] = [];

  const amazonImg = parseAmazonImage($);
  if (amazonImg) candidates.push(amazonImg);

  const metaNames = ['og:image', 'twitter:image', 'image', 'thumbnail'];
  for (const name of metaNames) {
    const value =
      $(`meta[property="${name}"]`).attr('content') ||
      $(`meta[name="${name}"]`).attr('content') ||
      $('meta[property="og:image:secure_url"]').attr('content');
    if (value) candidates.push(value);
  }

  const selectors = [
    '#landingImage',
    '#main-image',
    '.product-image img',
    '.pdp-image',
    'img.main',
    '.gallery-image',
    '[data-testid="pdp-main-image"]',
    '.product__img',
    '.img-responsive',
    '.product-main-image img',
  ];
  for (const selector of selectors) {
    const src = $(selector).first().attr('src');
    if (src) candidates.push(src);
  }

  $('img').each((_, element) => {
    const node = $(element);
    const width = Number(node.attr('width') || '0');
    const height = Number(node.attr('height') || '0');
    if ((width > 200 && height > 200) || (!width && !height)) {
      const src = node.attr('src') || node.attr('data-src') || node.attr('data-lazy-src');
      if (src) candidates.push(src);
    }
  });

  const normalized = candidates
    .map((candidate) => normalizeCandidate(candidate, productUrl))
    .filter((candidate): candidate is string => Boolean(candidate))
    .filter((candidate) => !BLACKLIST.some((bad) => candidate.toLowerCase().includes(bad)))
    .filter((candidate) => !candidate.toLowerCase().endsWith('.gif'));

  const unique = Array.from(new Set(normalized));
  return {
    imageUrl: unique[0] || null,
    title: $('title').text() || null,
  };
};

export const scrapeProductImage = async (
  url: string,
  deps?: {
    axiosClient?: typeof axios;
    timeoutMs?: number;
  },
): Promise<{ imageUrl: string | null; title: string | null }> => {
  const axiosClient = deps?.axiosClient ?? axios;
  const timeoutMs = deps?.timeoutMs ?? 15000;

  const response = await axiosClient.get<string>(url, {
    timeout: timeoutMs,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml',
    },
    responseType: 'text',
  });

  const html = response.data || '';
  const lowered = html.toLowerCase();
  if (lowered.includes('robot check') || lowered.includes('captcha')) {
    throw new ApiError(422, 'Retailer is blocking automated fetch. Please upload manually.');
  }

  const result = chooseBestImageFromHtml(html, url);
  if (!result.imageUrl) {
    throw new ApiError(404, 'Product image could not be found automatically.');
  }

  return result;
};

