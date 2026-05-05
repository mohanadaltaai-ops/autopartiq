import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function SupplierStatusBadge({ isActive }) {
  const { t } = useLanguage();
  const active = isActive !== false;

  return (
    <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      {active ? t('active') : t('disabled')}
    </span>
  );
}
