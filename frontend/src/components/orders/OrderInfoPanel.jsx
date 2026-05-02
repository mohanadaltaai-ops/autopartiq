import React from 'react';

export default function OrderInfoPanel({ order }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 space-y-2">
      <div className="grid grid-cols-2 gap-1">
        <span>Payment</span>
        <strong className="text-slate-700">{order.paymentMethod || 'CASH_ON_DELIVERY'}</strong>
        <span>Payment status</span>
        <strong className="text-slate-700">{order.paymentStatus || 'PENDING'}</strong>
        <span>Driver</span>
        <strong className="text-slate-700">{order.driverName || 'Not assigned'}</strong>
        <span>Driver phone</span>
        <strong className="text-slate-700">{order.driverPhone || 'Pending'}</strong>
        <span>Pickup ETA</span>
        <strong className="text-slate-700">{order.pickupEta || 'Pending'}</strong>
        <span>Delivery ETA</span>
        <strong className="text-slate-700">{order.deliveryEta || 'Pending'}</strong>
      </div>
      {order.deliveryNotes && <div className="rounded-xl bg-white border p-2"><div className="font-bold text-slate-700 mb-1">Delivery comments</div><div>{order.deliveryNotes}</div></div>}
    </div>
  );
}
