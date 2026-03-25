import axios from 'axios';
import { ApiError } from './errors.js';

export const fetchImageAsDataUrl = async (
  url: string,
  deps?: {
    axiosClient?: typeof axios;
    timeoutMs?: number;
  },
): Promise<string> => {
  const axiosClient = deps?.axiosClient ?? axios;
  const timeoutMs = deps?.timeoutMs ?? 15000;

  try {
    const response = await axiosClient.get<ArrayBuffer>(url, {
      timeout: timeoutMs,
      responseType: 'arraybuffer',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      },
    });

    const mimeType = response.headers['content-type'] || 'image/png';
    const base64 = Buffer.from(response.data).toString('base64');
    return `data:${mimeType};base64,${base64}`;
  } catch (err) {
    throw new ApiError(502, 'Unable to fetch the product image data.');
  }
};

