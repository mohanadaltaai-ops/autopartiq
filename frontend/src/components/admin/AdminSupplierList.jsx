import React from 'react';
import SupplierCard from './SupplierCard';
import { useLanguage } from '../../contexts/LanguageContext';

export default function AdminSupplierList({ suppliers, token, reload }) {
  const { t } = useLanguage();

  if (!suppliers.length) {
    return <div className="bg-white rounded-[28px] border border-dashed border-slate-200 p-6 text-center shadow-sm text-sm font-bold text-slate-500">{t('noSuppliersYet')}</div>;
  }

  return (
    <div className="space-y-3">
      {suppliers.map(supplier => (
        <SupplierCard key={supplier.id} supplier={supplier} token={token} reload={reload} />
      ))}
    </div>
  );
}
