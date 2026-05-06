import React from 'react';
import SupplierCard from './SupplierCard';
import { useLanguage } from '../../contexts/LanguageContext';

export default function AdminSupplierList({ suppliers, token, reload }) {
  const { t } = useLanguage();

  if (!suppliers.length) {
    return (
      <div className="bg-white rounded-[28px] border border-dashed border-slate-200 p-6 text-center shadow-sm">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-black mb-3">
          —
        </div>
        <div className="text-sm font-bold text-slate-500">{t('noSuppliersYet')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {suppliers.map(supplier => (
        <SupplierCard key={supplier.id} supplier={supplier} token={token} reload={reload} />
      ))}
    </div>
  );
}
