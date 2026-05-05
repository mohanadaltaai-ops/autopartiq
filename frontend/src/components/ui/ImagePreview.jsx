import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function ImagePreview({ src, alt = 'Image preview', className = '' }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  if (!src) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
        title={t('openImage')}
      >
        <img src={src} alt={alt} className={className || 'w-16 h-16 rounded-xl object-cover border'} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 px-4 py-2 rounded-full bg-white text-slate-900 text-sm font-black shadow-lg"
          >
            {t('close')}
          </button>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default"
            aria-label={t('close')}
          />

          <img
            src={src}
            alt={alt}
            className="relative z-10 max-w-full max-h-[82vh] object-contain rounded-2xl shadow-2xl"
          />

          <div className="relative z-10 mt-4 text-white/60 text-xs">
            {t('tapCloseToReturn')}
          </div>
        </div>
      )}
    </>
  );
}
