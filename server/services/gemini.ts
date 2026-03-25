import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { ApiError } from './errors.js';
import { parseDataUrl } from './imageData.js';

const DEFAULT_MODEL = 'gemini-2.5-flash-image';

export const buildTryOnPrompt = () =>
  'Apply the garment from the second image onto the person in the first image. Keep face/body the same and change only clothing with natural lighting and folds. Return only the final edited image.';

export const extractGeneratedImageDataUrl = (response: GenerateContentResponse): string => {
  const candidate = response.candidates?.[0];
  const parts = candidate?.content?.parts ?? [];
  const outputPart = parts.find((part) => Boolean((part as any).inlineData));
  const inlineData = (outputPart as any)?.inlineData as { mimeType?: string; data?: string } | undefined;

  if (!inlineData?.data || !inlineData?.mimeType) {
    throw new ApiError(502, 'AI response did not include an output image.');
  }

  return `data:${inlineData.mimeType};base64,${inlineData.data}`;
};

export const generateTryOnImage = async (args: {
  apiKey: string;
  userImageBase64: string;
  garmentImageBase64: string;
  model?: string;
}): Promise<string> => {
  const { apiKey, userImageBase64, garmentImageBase64, model = DEFAULT_MODEL } = args;

  if (!apiKey) throw new ApiError(500, 'Missing GEMINI_API_KEY environment variable.');

  const ai = new GoogleGenAI({ apiKey });

  const userImg = parseDataUrl(userImageBase64);
  const garmentImg = parseDataUrl(garmentImageBase64);

  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { mimeType: userImg.mimeType, data: userImg.data } },
        { inlineData: { mimeType: garmentImg.mimeType, data: garmentImg.data } },
        { text: buildTryOnPrompt() },
      ],
    },
    config: { imageConfig: { aspectRatio: '1:1' } },
  });

  return extractGeneratedImageDataUrl(response);
};

