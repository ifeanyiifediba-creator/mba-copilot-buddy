import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Clock, ExternalLink } from "lucide-react";
import { format, differenceInDays, isPast } from "date-fns";
import { Button } from "@/components/ui/button";

export default function Deadlines() {
  const { user } = useAuth();

  const { data: roles = [] } = useQuery({
    queryKey: ["deadlines", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("roles")
        .select("*, companies(name)")
        .not("deadline", "is", null)
        .order("deadline", { ascending: true });
      return data || [];
    },
    enabled: !!user,
  });

  const upcoming = roles.filter((r: any) => !isPast(new Date(r.deadline)));
  const past = roles.filter((r: any) => isPast(new Date(r.deadline)));

  const renderRole = (role: any) => {
    const days = differenceInDays(new Date(role.deadline), new Date());
    const overdue = days < 0;
    return (
      <Card key={role.id} className="bg-card border-border">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`text-center min-w-[48px] ${overdue ? "text-destructive" : days <= 3 ? "text-warning" : "text-muted-foreground"}`}>
              <p className="text-lg font-bold">{Math.abs(days)}</p>
              <p className="text-xs">{overdue ? "days ago" : "days"}</p>
            </div>
            <div>
              <p className="text-foreground font-medium">{role.title}</p>
              <p className="text-xs text-muted-foreground">{role.companies?.name} · {format(new Date(role.deadline), "MMM d, yyyy")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={role.status} />
            {role.link && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" asChild>
                <a href={role.link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Clock className="h-6 w-6 text-primary" /> Deadlines
        </h1>
        <p className="text-muted-foreground text-sm">Application deadlines timeline</p>
      </div>

      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Upcoming</h2>
          {upcoming.map(renderRole)}
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Past</h2>
          {past.map(renderRole)}
        </div>
      )}

      {roles.length === 0 && (
        <p className="text-muted-foreground text-sm">No deadlines set. Add deadlines to your roles to track them here.</p>
      )}
    </div>
  );
}
