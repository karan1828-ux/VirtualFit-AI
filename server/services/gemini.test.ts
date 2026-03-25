import { beforeAll, describe, expect, it, vi } from 'vitest';

const mockResponse: any = {
  candidates: [
    {
      content: {
        parts: [
          { text: 'ok' },
          { inlineData: { mimeType: 'image/png', data: 'OUT_BASE64' } },
        ],
      },
    },
  ],
};

const mockGenerateContent = vi.fn().mockResolvedValue(mockResponse);

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class MockGoogleGenAI {
      models = {
        generateContent: mockGenerateContent,
      };
      constructor(_args: any) {}
    },
  };
});

describe('gemini service helpers', () => {
  it('extractGeneratedImageDataUrl returns a valid data URL', async () => {
    const mod = await import('./gemini');
    const url = mod.extractGeneratedImageDataUrl(mockResponse);
    expect(url).toBe('data:image/png;base64,OUT_BASE64');
  });
});

describe('gemini generateTryOnImage', () => {
  it('calls the model and returns the parsed image', async () => {
    const mod = await import('./gemini');
    const url = await mod.generateTryOnImage({
      apiKey: 'test-key',
      userImageBase64: 'data:image/jpeg;base64,USER',
      garmentImageBase64: 'data:image/png;base64,GARMENT',
      model: 'test-model',
    });

    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    const callArg = mockGenerateContent.mock.calls[0]?.[0];
    expect(callArg.model).toBe('test-model');
    expect(url).toBe('data:image/png;base64,OUT_BASE64');
  });
});

