import React, { useEffect } from 'react';
import { ProfileMeasurements } from '../types';

interface ProfileModalProps {
  open: boolean;
  profile: ProfileMeasurements;
  onClose: () => void;
  onChange: (next: ProfileMeasurements) => void;
}

const METRICS: Array<{ key: keyof ProfileMeasurements; label: string; min: number; max: number }> = [
  { key: 'height', label: 'Height (cm)', min: 140, max: 210 },
  { key: 'weight', label: 'Weight (kg)', min: 40, max: 140 },
  { key: 'chest', label: 'Chest (cm)', min: 70, max: 140 },
  { key: 'waist', label: 'Waist (cm)', min: 55, max: 130 },
  { key: 'inseam', label: 'Inseam (cm)', min: 60, max: 110 },
];

const ProfileModal: React.FC<ProfileModalProps> = ({ open, profile, onClose, onChange }) => {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-white/40 backdrop-blur-xl flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-white/80 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.08)] p-8 relative"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-neutral-400 hover:text-neutral-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 rounded-full"
          aria-label="Close profile modal"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-8">
          <h3 className="font-serif text-5xl text-neutral-900">Complete Your Profile</h3>
          <p className="mt-2 text-neutral-500">Help us provide accurate virtual try-on results with your measurements.</p>
        </div>

        <div className="space-y-5">
          {METRICS.map((metric) => (
            <label key={metric.key} className="block">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 font-semibold">{metric.label}</span>
                <span className="text-sm text-neutral-900">{profile[metric.key]}</span>
              </div>
              <input
                type="range"
                min={metric.min}
                max={metric.max}
                value={profile[metric.key]}
                onChange={(e) => onChange({ ...profile, [metric.key]: Number(e.target.value) })}
                className="w-full accent-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/10 rounded-lg"
              />
            </label>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-8 bg-neutral-900 text-white rounded-xl py-3.5 text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-black active:scale-[0.99] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/30"
        >
          Save & Continue
        </button>
      </div>
    </div>
  );
};

export default ProfileModal;
