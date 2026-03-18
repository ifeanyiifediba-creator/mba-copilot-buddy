import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Target, Send, Briefcase, Trophy, Clock, AlertTriangle, Zap, Pencil, Linkedin, Github, ArrowRight } from "lucide-react";
import { format, differenceInDays, isPast, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Weekly goal from localStorage
  const [weeklyGoal, setWeeklyGoal] = useState(() => {
    const saved = localStorage.getItem("weekly-app-goal");
    return saved ? parseInt(saved) : 10;
  });
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(String(weeklyGoal));

  const saveGoal = () => {
    const val = Math.max(1, parseInt(goalInput) || 10);
    setWeeklyGoal(val);
    localStorage.setItem("weekly-app-goal", String(val));
    setEditingGoal(false);
  };

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

  // Weekly applications count
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const appsThisWeek = roles.filter((r: any) => {
    const created = new Date(r.created_at);
    return isWithinInterval(created, { start: weekStart, end: weekEnd });
  }).length;
  const goalProgress = Math.min(appsThisWeek / weeklyGoal, 1);

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

  const firstName = user?.email?.split("@")[0] || "there";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome, {firstName} 👋
        </h1>
        <p className="text-muted-foreground text-sm">Your recruiting overview</p>
      </div>

      {/* Weekly Goal Tracker — Simplify-inspired bright card */}
      <div className="rounded-2xl p-5 weekly-goal-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔥</span>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {appsThisWeek}/{weeklyGoal} Applications
              </h2>
              <p className="text-sm text-slate-500">
                {appsThisWeek >= weeklyGoal
                  ? "🎉 Weekly goal hit! Nice work."
                  : `💪 ${weeklyGoal - appsThisWeek} more to hit your weekly goal!`}
              </p>
            </div>
          </div>
          {editingGoal ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                className="w-16 h-8 text-center bg-white/80 border-slate-300 text-slate-800 text-sm"
                onKeyDown={(e) => e.key === "Enter" && saveGoal()}
              />
              <Button size="sm" onClick={saveGoal} className="h-8 bg-teal-500 hover:bg-teal-600 text-white text-xs">
                Save
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setGoalInput(String(weeklyGoal)); setEditingGoal(true); }}
              className="h-8 bg-white/60 border-slate-300 text-slate-600 hover:bg-white/80 text-xs"
            >
              <Settings2 className="h-3 w-3 mr-1" /> Set Goal
            </Button>
          )}
        </div>
        <div className="w-full h-3 bg-white/50 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${goalProgress * 100}%`,
              background: "linear-gradient(90deg, #2dd4bf, #14b8a6, #0d9488)",
            }}
          />
        </div>
        <div className="flex justify-end mt-1">
          <span className="text-xs font-medium text-teal-600">
            {appsThisWeek}/{weeklyGoal} this week
          </span>
        </div>
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

      {/* Team Section */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-foreground">Built by</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-lg font-bold text-primary-foreground">
              E
            </div>
            <div>
              <p className="text-foreground font-semibold">Emmanuel Ifeanyi</p>
              <p className="text-sm text-muted-foreground">MBA Candidate · Full-Stack Developer</p>
              <div className="flex gap-2 mt-1">
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Linkedin className="h-4 w-4" />
                </a>
                <a href="https://github.com" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Github className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
