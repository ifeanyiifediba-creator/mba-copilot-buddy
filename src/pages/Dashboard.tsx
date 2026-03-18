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
  const navigate = useNavigate();

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
  const interviewsThisWeek = roles.filter((r: any) => {
    return r.status === "interviewing" && isWithinInterval(new Date(r.created_at), { start: weekStart, end: weekEnd });
  }).length;
  const savedThisWeek = roles.filter((r: any) => {
    return r.status === "interested" && isWithinInterval(new Date(r.created_at), { start: weekStart, end: weekEnd });
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

      {/* Weekly Goal Tracker — Simplify-inspired */}
      <div className="rounded-2xl weekly-goal-card">
        <div className="grid md:grid-cols-2 divide-x divide-slate-200">
          {/* Left: Gauge + Goal */}
          <div className="p-6">
            <h3 className="text-sm font-bold text-slate-700 mb-4">
              Week of {format(weekStart, "M/d/yyyy")} - {format(weekEnd, "M/d/yyyy")}
            </h3>
            <div className="flex items-center gap-6">
              {/* Circular gauge */}
              <div className="relative w-28 h-28 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${Math.PI * 40 * 0.75} ${Math.PI * 40 * 0.25}`}
                    strokeDashoffset={0}
                    transform="rotate(-225 50 50)"
                  />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#14b8a6" strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${Math.PI * 40 * 0.75 * goalProgress} ${Math.PI * 40 * (1 - 0.75 * goalProgress)}`}
                    strokeDashoffset={0}
                    transform="rotate(-225 50 50)"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-slate-800">{appsThisWeek}</span>
                  <span className="text-[10px] text-slate-500">jobs applied</span>
                </div>
              </div>
              <div>
                <p className="text-lg font-bold text-slate-800">
                  {weeklyGoal - appsThisWeek > 0 ? `${weeklyGoal - appsThisWeek} Applications Remaining!` : "🎉 Goal Complete!"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Move jobs to "Applied" in your Pipeline to update your weekly goal progress
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              {editingGoal ? (
                <div className="flex items-center gap-2 bg-white/70 rounded-full px-3 py-1.5 border border-slate-200">
                  <span className="text-sm text-slate-600">Weekly goal:</span>
                  <Input
                    type="number" min={1} value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveGoal()}
                    className="w-14 h-7 text-center bg-transparent border-slate-300 text-slate-800 text-sm p-0"
                    autoFocus
                  />
                  <Button size="sm" onClick={saveGoal} className="h-7 rounded-full bg-teal-500 hover:bg-teal-600 text-white text-xs px-3">
                    Save
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => { setGoalInput(String(weeklyGoal)); setEditingGoal(true); }}
                  className="flex items-center gap-1.5 bg-white/70 rounded-full px-4 py-1.5 border border-slate-200 text-sm text-slate-600 hover:bg-white/90 transition-colors"
                >
                  Weekly goal: {weeklyGoal} <Pencil className="h-3 w-3" />
                </button>
              )}
              <Button
                size="sm"
                onClick={() => navigate("/add-role")}
                className="rounded-full bg-teal-500 hover:bg-teal-600 text-white text-sm px-4 h-8"
              >
                Log an application
              </Button>
            </div>
          </div>
          {/* Right: Tracker Overview */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-700">Tracker Overview</h3>
              <span className="text-xs text-slate-400">This week</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 flex items-center gap-2">📝 Applications this week</span>
                <span className="text-sm font-bold text-slate-800">{appsThisWeek}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 flex items-center gap-2">💬 Interviews this week</span>
                <span className="text-sm font-bold text-slate-800">{interviewsThisWeek}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 flex items-center gap-2">❤️ Saved jobs this week</span>
                <span className="text-sm font-bold text-slate-800">{savedThisWeek}</span>
              </div>
            </div>
            <button onClick={() => navigate("/pipeline")} className="flex items-center gap-1 text-teal-600 text-sm font-medium mt-5 hover:text-teal-700 transition-colors">
              Go to tracker <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
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
