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
    <nav className="flex items-center gap-2 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 font-medium transition-colors duration-150 hover:text-[hsl(var(--foreground))]"
      >
        <Home size={14} />
      </Link>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRight size={12} className="shrink-0" />
          {item.href ? (
            <Link
              href={item.href}
              className="font-medium transition-colors duration-150 hover:text-[hsl(var(--foreground))]"
            >
              {item.label}
            </Link>
          ) : (
            <span className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
