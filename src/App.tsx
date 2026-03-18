import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Pipeline from "@/pages/Pipeline";

import SimplifyIntegration from "@/pages/SimplifyIntegration";
import Deadlines from "@/pages/Deadlines";
import FollowUps from "@/pages/FollowUps";
import Contacts from "@/pages/Contacts";
import Conversations from "@/pages/Conversations";
import AddRole from "@/pages/AddRole";
import AddContact from "@/pages/AddContact";
import LogConversation from "@/pages/LogConversation";
import SettingsPage from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return <Auth />;

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="/gmail-sync" element={<GmailSync />} />
        <Route path="/simplify" element={<SimplifyIntegration />} />
        <Route path="/deadlines" element={<Deadlines />} />
        <Route path="/follow-ups" element={<FollowUps />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/conversations" element={<Conversations />} />
        <Route path="/add-role" element={<AddRole />} />
        <Route path="/add-contact" element={<AddContact />} />
        <Route path="/log-conversation" element={<LogConversation />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
