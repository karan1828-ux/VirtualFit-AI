
import React, { useRef } from 'react';

interface UploaderProps {
  onUpload: (base64: string) => void;
  preview: string | null;
  label: string;
}

const Uploader: React.FC<UploaderProps> = ({ onUpload, preview, label }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpload(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-[0.25em]">{label}</label>
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`relative w-full aspect-square rounded-2xl transition-all flex items-center justify-center cursor-pointer overflow-hidden group
          ${preview ? 'bg-neutral-100' : 'bg-neutral-100 hover:bg-neutral-200/70'}`}
      >
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            draggable="false"
            className="w-full h-full object-cover transition-transform group-hover:scale-[1.02]"
          />
        ) : (
          <div className="text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mx-auto shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
              <svg className="w-6 h-6 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="space-y-1.5">
              <p className="text-sm text-neutral-800">Drop your photo here</p>
              <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-[0.25em]">JPG or PNG up to 10MB</p>
            </div>
          </div>
        )}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

export default Uploader;
