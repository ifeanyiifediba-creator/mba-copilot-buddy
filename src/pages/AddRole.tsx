import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type RoleStatus = Database["public"]["Enums"]["role_status"];

export default function AddRole() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [companyName, setCompanyName] = useState("");
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState<RoleStatus>("interested");
  const [source, setSource] = useState("Manual");
  const [location, setLocation] = useState("");
  const [link, setLink] = useState("");
  const [salary, setSalary] = useState("");
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

      // Find or create company
      let companyId: string;
      const existing = companies.find((c: any) => c.name.toLowerCase() === companyName.toLowerCase());
      if (existing) {
        companyId = existing.id;
      } else {
        const { data, error } = await supabase
          .from("companies")
          .insert({ name: companyName, user_id: user.id })
          .select()
          .single();
        if (error) throw error;
        companyId = data.id;
      }

      const { error } = await supabase.from("roles").insert({
        user_id: user.id,
        company_id: companyId,
        title,
        deadline: deadline || null,
        status,
        source,
        location: location || null,
        link: link || null,
        salary: salary || null,
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["deadlines"] });
      toast.success("Role added!");
      navigate("/pipeline");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <PlusCircle className="h-6 w-6 text-primary" /> Add Role
        </h1>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground">Company *</Label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Bain & Company"
                list="company-list"
                required
                className="bg-secondary border-border text-foreground"
              />
              <datalist id="company-list">
                {companies.map((c: any) => <option key={c.id} value={c.name} />)}
              </datalist>
            </div>
            <div>
              <Label className="text-foreground">Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Summer Associate"
                required
                className="bg-secondary border-border text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground">Deadline</Label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="bg-secondary border-border text-foreground"
              />
            </div>
            <div>
              <Label className="text-foreground">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as RoleStatus)}>
                <SelectTrigger className="bg-secondary border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {["interested", "applied", "interviewing", "offer", "accepted", "rejected", "declined"].map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground">Source</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger className="bg-secondary border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {["Manual", "LinkedIn", "Handshake", "Simplify", "Referral", "Career Fair", "Campus", "Other"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-foreground">Location</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. New York, NY"
                className="bg-secondary border-border text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground">Link</Label>
              <Input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
                className="bg-secondary border-border text-foreground"
              />
            </div>
            <div>
              <Label className="text-foreground">Salary</Label>
              <Input
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="e.g. $180,000"
                className="bg-secondary border-border text-foreground"
              />
            </div>
          </div>

          <div>
            <Label className="text-foreground">Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes..."
              className="bg-secondary border-border text-foreground"
            />
          </div>

          <Button
            onClick={() => mutation.mutate()}
            disabled={!companyName || !title || mutation.isPending}
            className="w-full"
          >
            {mutation.isPending ? "Adding..." : "Add Role"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
