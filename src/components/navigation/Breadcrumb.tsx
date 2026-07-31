// src/components/navigation/Breadcrumb.tsx
'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1.5 text-[11px] md:text-xs font-medium overflow-x-auto no-scrollbar whitespace-nowrap pb-1 -mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
      <Link
        href="/admin-portal"
        className="inline-flex items-center gap-1.5 transition-colors duration-150 hover:text-[hsl(var(--foreground))] shrink-0"
      >
        <Home size={13} />
      </Link>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1.5 shrink-0">
          <ChevronRight size={12} className="shrink-0 opacity-40" />
          {item.href ? (
            <Link
              href={item.href}
              className="transition-colors duration-150 hover:text-[hsl(var(--foreground))]"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-[hsl(var(--foreground))] font-semibold">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
