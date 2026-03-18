import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, CheckCircle } from "lucide-react";
import { format, isPast } from "date-fns";
import { toast } from "sonner";

export default function FollowUps() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: conversations = [] } = useQuery({
    queryKey: ["all-follow-ups", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("conversations")
        .select("*, contacts(name), companies(name)")
        .not("follow_up_date", "is", null)
        .eq("follow_up_done", false)
        .order("follow_up_date", { ascending: true });
      return data || [];
    },
    enabled: !!user,
  });

  const markDone = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("conversations").update({ follow_up_done: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-follow-ups"] });
      toast.success("Follow-up marked as done");
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Send className="h-6 w-6 text-primary" /> Follow-ups
        </h1>
        <p className="text-muted-foreground text-sm">Pending follow-up actions</p>
      </div>

      {conversations.length === 0 ? (
        <p className="text-muted-foreground text-sm">No pending follow-ups. Log a conversation with a follow-up date to track it here.</p>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv: any) => {
            const overdue = conv.follow_up_date && isPast(new Date(conv.follow_up_date));
            return (
              <Card key={conv.id} className={`bg-card border-border ${overdue ? "border-l-2 border-l-destructive" : ""}`}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-foreground font-medium">{conv.contacts?.name || "Unknown"}</p>
                      {overdue && <span className="text-xs px-2 py-0.5 rounded bg-destructive/20 text-destructive font-medium">OVERDUE</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{conv.companies?.name} · Follow up by {format(new Date(conv.follow_up_date), "MMM d, yyyy")}</p>
                    <p className="text-sm text-muted-foreground mt-1">{conv.summary}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markDone.mutate(conv.id)}
                    className="text-success hover:bg-success/10"
                  >
                    <CheckCircle className="mr-1 h-4 w-4" /> Done
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
