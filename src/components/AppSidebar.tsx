import {
  BarChart3, Target, Mail, Zap, Clock, MessageSquare,
  Users, PlusCircle, Settings, Send
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: BarChart3 },
  { title: "Pipeline", url: "/pipeline", icon: Target },
  
  { title: "Simplify", url: "/simplify", icon: Zap },
  { title: "Deadlines", url: "/deadlines", icon: Clock },
  { title: "Follow-ups", url: "/follow-ups", icon: Send },
  { title: "Contacts", url: "/contacts", icon: Users },
  { title: "Conversations", url: "/conversations", icon: MessageSquare },
];

const actionItems = [
  { title: "Add Role", url: "/add-role", icon: PlusCircle },
  { title: "Add Contact", url: "/add-contact", icon: PlusCircle },
  { title: "Log Conversation", url: "/log-conversation", icon: PlusCircle },
];

const bottomItems = [
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const renderItems = (items: typeof navItems) =>
    items.map((item) => (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild>
          <NavLink
            to={item.url}
            end={item.url === "/"}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            activeClassName="bg-sidebar-accent text-primary font-medium"
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="flex flex-col h-full">
        {!collapsed && (
          <div className="px-4 py-5 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-sm font-bold text-foreground">Recruiting Copilot</h1>
                <p className="text-xs text-muted-foreground">MBA Job Tracker</p>
              </div>
            </div>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(navItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="border-t border-sidebar-border mx-3" />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(actionItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto">
          <div className="border-t border-sidebar-border mx-3" />
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>{renderItems(bottomItems)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
