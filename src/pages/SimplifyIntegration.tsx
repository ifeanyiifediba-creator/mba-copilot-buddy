import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zap, ExternalLink, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useState } from "react";

export default function SimplifyIntegration() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [appliedDate, setAppliedDate] = useState(new Date().toISOString().split("T")[0]);
  const [simplifyUrl, setSimplifyUrl] = useState("");

  const { data: jobs = [] } = useQuery({
    queryKey: ["simplify-jobs", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("simplify_jobs")
        .select("*")
        .order("synced_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const addJob = useMutation({
    mutationFn: async () => {
      if (!company.trim() || !title.trim()) throw new Error("Company and title are required");
      const { error } = await supabase.from("simplify_jobs").insert({
        user_id: user!.id,
        company: company.trim(),
        title: title.trim(),
        applied_date: appliedDate || null,
        simplify_url: simplifyUrl.trim() || null,
        status: "Applied",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simplify-jobs"] });
      toast.success("Job added from Simplify");
      setCompany(""); setTitle(""); setSimplifyUrl(""); setShowForm(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteJob = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("simplify_jobs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simplify-jobs"] });
      toast.success("Job removed");
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Zap className="h-6 w-6 text-accent" /> Simplify Integration
        </h1>
        <p className="text-muted-foreground text-sm">Track jobs applied via Simplify Copilot</p>
      </div>

      {/* Info card */}
      <Card className="bg-card border-border">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-accent mt-0.5 shrink-0" />
            <div>
              <p className="text-foreground font-medium text-sm">How it works</p>
              <p className="text-xs text-muted-foreground mt-1">
                Log jobs you've applied to via Simplify Copilot here to keep your pipeline in sync.
                Open Simplify to see your application history, then add them below.
              </p>
              <Button variant="outline" size="sm" className="mt-3 border-border text-foreground" asChild>
                <a href="https://simplify.jobs/tracker" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-3.5 w-3.5" /> Open Simplify Tracker
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add job form */}
      {showForm ? (
        <Card className="bg-card border-border">
          <CardContent className="p-5 space-y-3">
            <h3 className="text-sm font-medium text-foreground">Add Simplify Job</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <Input placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} className="bg-secondary border-border text-foreground" />
              <Input placeholder="Job Title" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-secondary border-border text-foreground" />
              <Input type="date" value={appliedDate} onChange={(e) => setAppliedDate(e.target.value)} className="bg-secondary border-border text-foreground" />
              <Input placeholder="Simplify URL (optional)" value={simplifyUrl} onChange={(e) => setSimplifyUrl(e.target.value)} className="bg-secondary border-border text-foreground" />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => addJob.mutate()} disabled={addJob.isPending}>
                {addJob.isPending ? "Adding..." : "Add Job"}
              </Button>
              <Button variant="outline" className="border-border text-foreground" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Simplify Job
        </Button>
      )}

      {/* Job list */}
      {jobs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Synced Jobs ({jobs.length})
          </h2>
          {jobs.map((job: any) => (
            <Card key={job.id} className="bg-card border-border">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-foreground font-medium text-sm">{job.company} — {job.title}</p>
                    <span className="text-xs px-2 py-0.5 rounded bg-warning/20 text-warning">{job.status || "Applied"}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {job.applied_date && (
                      <span className="text-xs text-muted-foreground">Applied {format(new Date(job.applied_date), "MMM d, yyyy")}</span>
                    )}
                    {job.simplify_url && (
                      <a href={job.simplify_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" /> View on Simplify
                      </a>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteJob.mutate(job.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {jobs.length === 0 && !showForm && (
        <div className="text-center py-12 text-muted-foreground">
          <Zap className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No Simplify jobs synced yet. Add your first one above.</p>
        </div>
      )}
    </div>
  );
}
