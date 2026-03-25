
export interface ImageState {
  original: string | null;
  product: string | null;
  generated: string | null;
}

export interface ExtractionResult {
  imageUrl: string | null;
  title: string | null;
  error?: string;
}

export interface ProfileMeasurements {
  height: number;
  weight: number;
  chest: number;
  waist: number;
  inseam: number;
}

export enum AppStatus {
  IDLE = 'IDLE',
  EXTRACTING = 'EXTRACTING',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
