
export const generateTryOnImage = async (userImageBase64: string, garmentImageBase64: string): Promise<string> => {
  const response = await fetch('/api/try-on', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userImageBase64,
      garmentImageBase64,
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error || 'Failed to generate try-on image.');
  }
  if (!payload?.image) {
    throw new Error('Invalid try-on response from server.');
  }

  return payload.image as string;
};
