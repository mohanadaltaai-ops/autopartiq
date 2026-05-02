import React from 'react';
import { Bell, Home, Package, User, BarChart3, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ tab, setTab, children }) {
  const { user, logout } = useAuth();
  const roleColor = { CUSTOMER: 'text-orange-600', SUPPLIER: 'text-blue-600', ADMIN: 'text-purple-600', SUPER_ADMIN: 'text-red-600' }[user?.role] || 'text-slate-800';
  const tabs = user?.role === 'CUSTOMER'
    ? [['home', Home, 'Home'], ['orders', Package, 'Orders'], ['profile', User, 'Profile']]
    : user?.role === 'SUPPLIER'
      ? [['home', Home, 'Leads'], ['orders', Package, 'Orders'], ['earnings', BarChart3, 'Earnings'], ['profile', User, 'Profile']]
      : [['home', BarChart3, 'Dashboard'], ['suppliers', Users, 'Suppliers'], ['orders', Package, 'Orders'], ['profile', User, 'Profile']];

  return <div className="min-h-screen flex items-center justify-center p-5 bg-slate-600">
    <div className="phone-frame bg-slate-100 rounded-[40px] border-8 border-slate-900 shadow-2xl overflow-hidden flex flex-col">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div>
          <div className="font-black text-slate-900">AutoParts IQ</div>
          <div className={`text-[10px] font-bold ${roleColor}`}>{user?.role?.replace('_',' ')}</div>
        </div>
        <button className="w-9 h-9 rounded-xl bg-slate-50 border flex items-center justify-center"><Bell size={17}/></button>
      </header>
      <main className="flex-1 overflow-y-auto">{children}</main>
      <nav className="bg-white border-t border-slate-200 flex">
        {tabs.map(([id, Icon, label]) => <button key={id} onClick={() => id === 'profile' ? logout() : setTab(id)} className={`flex-1 py-3 text-[10px] font-bold flex flex-col items-center gap-1 ${tab===id?'text-orange-600':'text-slate-400'}`}><Icon size={18}/>{id==='profile'?'Logout':label}</button>)}
      </nav>
    </div>
  </div>;
}
