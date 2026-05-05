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
    return <div className="rounded-xl bg-red-50 text-red-700 text-xs p-3">{t('deliveryCancelled')}</div>;
  }

  return (
    <div className="rounded-xl bg-slate-50 p-3 space-y-2">
      <div className="text-xs font-bold text-slate-500">{t('deliveryWorkflow')}</div>
      <div className="grid grid-cols-3 gap-2">
        {steps.map(([key, labelKey], index) => {
          const active = currentIndex >= index;
          return (
            <div
              key={key}
              className={`text-[10px] rounded-xl p-2 text-center font-bold ${active ? 'bg-blue-100 text-blue-700' : 'bg-white text-slate-400 border'}`}
            >
              {t(labelKey)}
            </div>
          );
        })}
      </div>
      <div className="text-[11px] text-slate-400">{t('deliveryWorkflowNote')}</div>
    </div>
  );
}
