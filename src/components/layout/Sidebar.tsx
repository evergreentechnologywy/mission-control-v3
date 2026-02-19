'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/tasks', icon: '📋', label: 'Tasks' },
  { href: '/content', icon: '🎬', label: 'Content' },
  { href: '/office', icon: '🏢', label: 'Office' },
  { href: '/team', icon: '👥', label: 'Team' },
  { href: '/memory', icon: '🧠', label: 'Memory' },
  { href: '/calendar', icon: '📅', label: 'Calendar' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-16 bg-dark-card border-r border-dark-border flex flex-col items-center py-4 shrink-0">
      <div className="mb-6">
        <span className="text-2xl">🎮</span>
      </div>
      
      <nav className="flex-1 flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all group relative ${
                isActive
                  ? 'bg-accent-blue/20 text-accent-blue'
                  : 'text-dark-muted hover:bg-dark-hover hover:text-white'
              }`}
              title={item.label}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="absolute left-full ml-2 px-2 py-1 bg-dark-card border border-dark-border rounded text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
      
      <div className="mt-auto pt-4 border-t border-dark-border">
        <button
          onClick={() => {
            fetch('/api/auth', { method: 'DELETE' }).then(() => {
              window.location.href = '/login';
            });
          }}
          className="w-12 h-12 flex items-center justify-center rounded-xl text-dark-muted hover:bg-dark-hover hover:text-white transition-all"
          title="Logout"
        >
          <span className="text-xl">🚪</span>
        </button>
      </div>
    </aside>
  );
}
