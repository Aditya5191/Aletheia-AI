import React from 'react';
import { LayoutDashboard, ListTodo, Radar, ClipboardCheck, Download, FolderArchive, Search, PlusCircle } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, to }) => (
  <NavLink
    to={to}
    className={({ isActive }) => cn(
      "flex items-center gap-3 w-full px-4 py-3 text-sm font-sans transition-all rounded-md group",
      isActive 
        ? "text-primary bg-surface-high" 
        : "text-on-surface-variant hover:text-on-surface hover:bg-surface-high/50"
    )}
  >
    {({ isActive }) => (
      <>
        <span className={cn(isActive ? "text-primary" : "text-on-surface-variant group-hover:text-on-surface")}>
          {icon}
        </span>
        {label}
      </>
    )}
  </NavLink>
);

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();

  return (
    <aside className="w-64 h-screen bg-surface-lowest flex flex-col p-6 border-r border-outline-variant/5">
      <div className="flex flex-col gap-1 mb-10 px-4">
        <h1 className="font-display font-bold text-2xl tracking-tight text-on-surface">Aletheia AI</h1>
        <p className="text-xs tracking-[0.3em] text-on-surface-variant font-label font-medium opacity-80 uppercase">Clinical AI Audit</p>
      </div>


      <nav className="flex-1 flex flex-col gap-2">
        <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard Overview" to="/dashboard" />
        <NavItem icon={<ListTodo size={20} />} label="Column Inventory" to="/inventory" />
        <NavItem icon={<Search size={20} />} label="Numeric Profiles" to="/profiles" />
        <NavItem icon={<Radar size={20} />} label="Bias Signals" to="/bias" />
        <NavItem icon={<ClipboardCheck size={20} />} label="Recommendations" to="/recommendations" />
      </nav>

      <div className="flex flex-col gap-3 mt-auto pt-6 border-t border-outline-variant/5">
        <button 
          onClick={() => navigate('/')}
          className="btn-primary flex items-center justify-center gap-2 text-sm py-3 mb-4"
        >
          <PlusCircle size={16} />
          NEW AUDIT
        </button>
        <button className="btn-secondary flex items-center justify-center gap-2 text-xs py-2.5">
          <Download size={16} className="stroke-[1.5px]" />
          EXPORT .MD
        </button>
        <button className="btn-secondary flex items-center justify-center gap-2 text-xs py-2.5">
          <FolderArchive size={16} className="stroke-[1.5px]" />
          BUNDLE .ZIP
        </button>
      </div>
    </aside>
  );
};
