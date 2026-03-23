'use client';

import Link from 'next/link';
import { Building2, Plus, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="border-b bg-slate-900 text-white">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Building2 className="h-5 w-5 text-amber-400" />
          <span>RentAimmo</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <Link href="/">
              <LayoutDashboard className="h-4 w-4 mr-1.5" />
              Dashboard
            </Link>
          </Button>
          <Button
            size="sm"
            asChild
            className="bg-amber-500 hover:bg-amber-600 text-slate-900"
          >
            <Link href="/simulation/new">
              <Plus className="h-4 w-4 mr-1.5" />
              Nouvelle simulation
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
