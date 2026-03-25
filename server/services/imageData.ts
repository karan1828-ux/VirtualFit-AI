/**
 * Utility to extract MIME type and data from a data URL.
 */
export const parseDataUrl = (dataUrl: string): { mimeType: string; data: string } => {
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    // Fallback if it's already a raw base64 string.
    return { mimeType: 'image/png', data: dataUrl };
  }
  return { mimeType: matches[1], data: matches[2] };
};

