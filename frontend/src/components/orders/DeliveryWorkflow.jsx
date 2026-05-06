import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const steps = [
  ['WAITING_PICKUP', 'waitingPickup'],
  ['DELIVERING', 'delivering'],
  ['COMPLETED', 'completed']
];

export default function DeliveryWorkflow({ status }) {
  const { t } = useLanguage();
  const currentIndex = steps.findIndex(([key]) => key === status);

  if (status === 'CANCELLED') {
    return (
      <div className="rounded-[22px] bg-red-50 border border-red-100 text-red-700 text-xs p-3 font-bold">
        {t('deliveryCancelled')}
      </div>
    );
  }

  return (
    <div className="rounded-[22px] bg-white border border-slate-200 p-4 space-y-3 shadow-sm">
      <div>
        <div className="text-[10px] uppercase font-black text-blue-600">{t('deliveryWorkflow')}</div>
        <div className="text-xs text-slate-400 font-semibold mt-1">{t('deliveryWorkflowNote')}</div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {steps.map(([key, labelKey], index) => {
          const active = currentIndex >= index;
          return (
            <div
              key={key}
              className={`rounded-[18px] p-3 text-center border ${
                active
                  ? 'bg-blue-50 border-blue-100 text-blue-700'
                  : 'bg-slate-50 border-slate-100 text-slate-400'
              }`}
            >
              <div className={`mx-auto mb-2 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black ${
                active ? 'bg-[#27439C] text-white' : 'bg-white text-slate-400 border border-slate-200'
              }`}>
                {index + 1}
              </div>
              <div className="text-[10px] font-black leading-tight">{t(labelKey)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
