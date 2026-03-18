import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { GlobalSearch } from "./GlobalSearch";
import { CoachChat } from "./CoachChat";

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-4 border-b border-border px-4 bg-card/50 backdrop-blur-sm shrink-0">
            <SidebarTrigger />
            <GlobalSearch />
            <div className="ml-auto flex items-center gap-3">
              <span className="text-xs text-muted-foreground hidden sm:block">{user?.email}</span>
              <Button variant="ghost" size="icon" onClick={signOut} className="text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
      <CoachChat />
    </SidebarProvider>
  );
}
