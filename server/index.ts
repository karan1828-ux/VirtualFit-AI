import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { z } from 'zod';
import { ApiError } from './services/errors.js';
import { generateTryOnImage } from './services/gemini.js';
import { scrapeProductImage } from './services/scraper.js';
import { fetchImageAsDataUrl } from './services/imageBase64.js';

export const app = express();
const port = Number(process.env.PORT || 8787);

app.use(cors());
app.use(express.json({ limit: '20mb' }));

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

app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.post('/api/extract', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url } = extractSchema.parse(req.body);
    const result = await scrapeProductImage(url);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.post('/api/image-base64', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url } = imageToBase64Schema.parse(req.body);
    const dataUrl = await fetchImageAsDataUrl(url);
    res.json({ dataUrl });
  } catch (error) {
    next(error);
  }
});

app.post('/api/try-on', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userImageBase64, garmentImageBase64 } = tryOnSchema.parse(req.body);
    const apiKey = process.env.GEMINI_API_KEY;
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

app.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      error: 'Invalid request payload.',
      details: error.flatten(),
    });
  }
  if (error instanceof ApiError) {
    return res.status(error.status).json({ error: error.message });
  }

  const fallbackMessage = error instanceof Error ? error.message : 'Unexpected server error.';
  return res.status(500).json({ error: fallbackMessage });
});

if (process.env.NODE_ENV !== 'production' || process.env.RENDER) {
  app.listen(port, () => {
    console.log(`VirtualFit backend running on port ${port}`);
  });
}
