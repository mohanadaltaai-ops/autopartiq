import React from 'react';
import SupplierCard from './SupplierCard';
import { useLanguage } from '../../contexts/LanguageContext';

export default function AdminSupplierList({ suppliers, token, reload }) {
  const { t } = useLanguage();

  if (!suppliers.length) {
    return <div className="rounded-[1.5rem] border border-dashed border-blue-200 bg-white/80 p-6 text-center text-sm font-bold text-slate-400 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-500">{t('noSuppliersYet')}</div>;
  }

  return (
    <div className="space-y-3">
      {suppliers.map(supplier => (
        <SupplierCard key={supplier.id} supplier={supplier} token={token} reload={reload} />
      ))}
    </div>
  );
}
