import React from 'react';

export default function SupplierStatusBadge({ isActive }) {
  const active = isActive !== false;
  return (
    <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      {active ? 'Active' : 'Disabled'}
    </span>
  );
}
