import React from 'react';

const steps = [
  ['WAITING_PICKUP', 'Waiting pickup'],
  ['DELIVERING', 'Delivering'],
  ['COMPLETED', 'Completed']
];

export default function DeliveryWorkflow({ status }) {
  const currentIndex = steps.findIndex(([key]) => key === status);

  if (status === 'CANCELLED') {
    return <div className="rounded-xl bg-red-50 text-red-700 text-xs p-3">Delivery cancelled. Admin or support should review this order.</div>;
  }

  return (
    <div className="rounded-xl bg-slate-50 p-3 space-y-2">
      <div className="text-xs font-bold text-slate-500">Delivery workflow placeholder</div>
      <div className="grid grid-cols-3 gap-2">
        {steps.map(([key, label], index) => {
          const active = currentIndex >= index;
          return <div key={key} className={`text-[10px] rounded-xl p-2 text-center font-bold ${active ? 'bg-blue-100 text-blue-700' : 'bg-white text-slate-400 border'}`}>{label}</div>;
        })}
      </div>
      <div className="text-[11px] text-slate-400">Future: assign driver, pickup time, delivery ETA, and proof of delivery.</div>
    </div>
  );
}
