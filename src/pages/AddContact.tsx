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
import type { Database } from "@/integrations/supabase/types";

type ContactKind = Database["public"]["Enums"]["contact_kind"];

export default function AddContact() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [kind, setKind] = useState<ContactKind>("other");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [notes, setNotes] = useState("");

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
      const { error } = await supabase.from("contacts").insert({
        user_id: user.id,
        name,
        company_id: companyId || null,
        kind,
        email: email || null,
        phone: phone || null,
        linkedin: linkedin || null,
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact added!");
      navigate("/contacts");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <PlusCircle className="h-6 w-6 text-primary" /> Add Contact
      </h1>

      <Card className="bg-card border-border">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground">Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required className="bg-secondary border-border text-foreground" />
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
              <Label className="text-foreground">Type</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as ContactKind)}>
                <SelectTrigger className="bg-secondary border-border text-foreground"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {["recruiter", "hiring_manager", "alum", "referral", "other"].map((k) => (
                    <SelectItem key={k} value={k} className="capitalize">{k.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-foreground">Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-secondary border-border text-foreground" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground">Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-secondary border-border text-foreground" />
            </div>
            <div>
              <Label className="text-foreground">LinkedIn</Label>
              <Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." className="bg-secondary border-border text-foreground" />
            </div>
          </div>

          <div>
            <Label className="text-foreground">Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-secondary border-border text-foreground" />
          </div>

          <Button onClick={() => mutation.mutate()} disabled={!name || mutation.isPending} className="w-full">
            {mutation.isPending ? "Adding..." : "Add Contact"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
