"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { SidebarNav } from "@/components/sidebar-nav";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { UserMenu } from "@/components/user-menu";

type ShellUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export function AppShell({ user, children }: { user: ShellUser; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-card px-4 py-6 md:flex">
        <Link href="/dashboard" className="mb-6 px-2 text-lg font-semibold tracking-tight">
          Sisplan
        </Link>
        <div className="flex-1">
          <SidebarNav />
        </div>
        <UserMenu user={user} />
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-card px-4 py-3 md:hidden">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
            Sisplan
          </Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
              <Menu className="size-5" />
            </Button>
            <SheetContent side="left" className="w-72 px-4 py-6">
              <SheetTitle className="mb-6 px-2 text-lg font-semibold tracking-tight">
                Sisplan
              </SheetTitle>
              <SidebarNav onNavigate={() => setOpen(false)} />
              <div className="mt-6">
                <UserMenu user={user} />
              </div>
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
