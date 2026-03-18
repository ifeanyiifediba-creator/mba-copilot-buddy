import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";

export default function LogConversation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [contactId, setContactId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [summary, setSummary] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [notes, setNotes] = useState("");

  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts-list", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("contacts").select("*, companies(name)").order("name");
      return data || [];
    },
    enabled: !!user,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["companies", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("companies").select("*").order("name");
      return data || [];
    },
    enabled: !!user,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("conversations").insert({
        user_id: user.id,
        contact_id: contactId || null,
        company_id: companyId || null,
        date,
        summary: summary || null,
        follow_up_date: followUpDate || null,
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["all-follow-ups"] });
      toast.success("Conversation logged!");
      navigate("/conversations");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <PlusCircle className="h-6 w-6 text-primary" /> Log Conversation
      </h1>

      <Card className="bg-card border-border">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground">Contact</Label>
              <Select value={contactId} onValueChange={setContactId}>
                <SelectTrigger className="bg-secondary border-border text-foreground"><SelectValue placeholder="Select contact" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {contacts.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-foreground">Company</Label>
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger className="bg-secondary border-border text-foreground"><SelectValue placeholder="Select company" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {companies.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground">Date *</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="bg-secondary border-border text-foreground" />
            </div>
            <div>
              <Label className="text-foreground">Follow-up Date</Label>
              <Input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className="bg-secondary border-border text-foreground" />
            </div>
          </div>

          <div>
            <Label className="text-foreground">Summary *</Label>
            <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="What did you discuss?" className="bg-secondary border-border text-foreground" />
          </div>

          <div>
            <Label className="text-foreground">Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-secondary border-border text-foreground" />
          </div>

          <Button onClick={() => mutation.mutate()} disabled={!date || mutation.isPending} className="w-full">
            {mutation.isPending ? "Logging..." : "Log Conversation"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
