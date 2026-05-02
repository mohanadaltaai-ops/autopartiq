import React, { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => onClose?.(), 3000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const color = type === 'error' ? 'bg-red-600' : 'bg-green-600';

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[320px] max-w-[calc(100vw-32px)]">
      <div className={`${color} text-white rounded-2xl shadow-xl px-4 py-3 text-sm font-bold text-center`}>
        {message}
      </div>
    </div>
  );
}
