import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth } from '../services/auth.js';
import { ApiError } from '../services/errors.js';
import { generateTryOnImage } from '../services/gemini.js';
import { scrapeProductImage } from '../services/scraper.js';
import { fetchImageAsDataUrl } from '../services/imageBase64.js';

export const tryOnRouter = Router();

const tryOnSchema = z.object({
  userImageBase64: z.string().min(20),
  garmentImageBase64: z.string().min(20),
});

const extractSchema = z.object({
  url: z.string().url(),
});

const imageToBase64Schema = z.object({
  url: z.string().url(),
});

tryOnRouter.post('/extract', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url } = extractSchema.parse(req.body);
    const result = await scrapeProductImage(url);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

tryOnRouter.post('/image-base64', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url } = imageToBase64Schema.parse(req.body);
    const dataUrl = await fetchImageAsDataUrl(url);
    res.json({ dataUrl });
  } catch (error) {
    next(error);
  }
});

tryOnRouter.post('/try-on', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userImageBase64, garmentImageBase64 } = tryOnSchema.parse(req.body);
    const apiKey = process.env.GEMINI_API_KEY || '';

    if (!apiKey) throw new ApiError(500, 'Missing GEMINI_API_KEY environment variable.');

    const image = await generateTryOnImage({
      apiKey,
      userImageBase64,
      garmentImageBase64,
    });

    res.json({ image });
  } catch (error) {
    next(error);
  }
});

