import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Target, Send, Briefcase, Trophy, Clock, AlertTriangle, Zap } from "lucide-react";
import { format, differenceInDays, isPast } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: roles = [] } = useQuery({
    queryKey: ["roles", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("roles")
        .select("*, companies(name)")
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ["follow-ups", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("conversations")
        .select("*, contacts(name), companies(name)")
        .eq("follow_up_done", false)
        .not("follow_up_date", "is", null)
        .order("follow_up_date", { ascending: true })
        .limit(5);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: emailSyncs = [] } = useQuery({
    queryKey: ["recent-detections", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("email_syncs")
        .select("*")
        .eq("dismissed", false)
        .eq("confirmed", false)
        .order("synced_at", { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user,
  });

  const totalRoles = roles.length;
  const applied = roles.filter((r: any) => r.status === "applied").length;
  const interviewing = roles.filter((r: any) => r.status === "interviewing").length;
  const offers = roles.filter((r: any) => r.status === "offer").length;

  const upcomingDeadlines = roles
    .filter((r: any) => r.deadline && !isPast(new Date(r.deadline)))
    .sort((a: any, b: any) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 5);

  const stats = [
    { label: "Total Roles", value: totalRoles, icon: Briefcase },
    { label: "Applied", value: applied, icon: Send },
    { label: "Interviewing", value: interviewing, icon: Target },
    { label: "Offers", value: offers, icon: Trophy },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Your recruiting overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold stat-number mt-1">{stat.value}</p>
                </div>
                <stat.icon className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
            ) : (
              upcomingDeadlines.map((role: any) => {
                const days = differenceInDays(new Date(role.deadline), new Date());
                return (
                  <div key={role.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-foreground font-medium">{role.title}</p>
                      <p className="text-xs text-muted-foreground">{role.companies?.name}</p>
                    </div>
                    <span className={`text-xs font-medium ${days <= 3 ? "text-destructive" : days <= 7 ? "text-warning" : "text-muted-foreground"}`}>
                      {days}d left
                    </span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Pending Follow-ups
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {conversations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending follow-ups</p>
            ) : (
              conversations.map((conv: any) => {
                const overdue = conv.follow_up_date && isPast(new Date(conv.follow_up_date));
                return (
                  <div key={conv.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-foreground font-medium">{conv.contacts?.name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{conv.companies?.name}</p>
                    </div>
                    <span className={`text-xs font-medium ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
                      {overdue ? "OVERDUE" : format(new Date(conv.follow_up_date), "MMM d")}
                    </span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-accent" />
              Recently Detected
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {emailSyncs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent detections. Connect Gmail or Simplify to auto-detect applications.</p>
            ) : (
              emailSyncs.map((sync: any) => (
                <div key={sync.id} className="text-sm">
                  <p className="text-foreground font-medium">{sync.company_detected || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground truncate">{sync.subject}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
