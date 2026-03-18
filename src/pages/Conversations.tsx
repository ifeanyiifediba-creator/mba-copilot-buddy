import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";

export default function Conversations() {
  const { user } = useAuth();

  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("conversations")
        .select("*, contacts(name), companies(name)")
        .order("date", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" /> Conversations
        </h1>
        <p className="text-muted-foreground text-sm">{conversations.length} logged</p>
      </div>

      {conversations.length === 0 ? (
        <p className="text-muted-foreground text-sm">No conversations logged yet.</p>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv: any) => (
            <Card key={conv.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{format(new Date(conv.date), "MMM d, yyyy")}</span>
                      <span className="text-foreground font-medium text-sm">{conv.contacts?.name || "Unknown"}</span>
                      {conv.companies?.name && <span className="text-xs text-muted-foreground">at {conv.companies.name}</span>}
                    </div>
                    <p className="text-sm text-foreground">{conv.summary || "No summary"}</p>
                  </div>
                  {conv.follow_up_date && (
                    <div className="flex items-center gap-1 text-xs shrink-0 ml-4">
                      {conv.follow_up_done ? (
                        <span className="text-success flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Done</span>
                      ) : (
                        <span className="text-warning flex items-center gap-1"><Clock className="h-3 w-3" /> {format(new Date(conv.follow_up_date), "MMM d")}</span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
