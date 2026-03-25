
import { ExtractionResult } from '../types';

export const extractProductImage = async (url: string): Promise<ExtractionResult> => {
  const response = await fetch('/api/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  const payload = await response.json();
  if (!response.ok) {
    return {
      imageUrl: null,
      title: null,
      error: payload?.error || 'Product image could not be found automatically.',
    };
  }

  return {
    imageUrl: payload?.imageUrl ?? null,
    title: payload?.title ?? null,
  };
};

export const imageUrlToBase64 = async (url: string): Promise<string> => {
  const response = await fetch('/api/image-base64', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  const payload = await response.json();
  if (!response.ok || !payload?.dataUrl) {
    throw new Error(payload?.error || 'Unable to fetch the product image data. Please upload it manually.');
  }
  return (payload.dataUrl as string).split(',')[1];
};
