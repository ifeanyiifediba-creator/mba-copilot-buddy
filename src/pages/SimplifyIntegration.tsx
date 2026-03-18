import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, ExternalLink, AlertCircle } from "lucide-react";

const mockJobs = [
  { id: "1", company: "McKinsey", title: "Summer Associate", date: "Mar 10, 2026", status: "Applied" },
  { id: "2", company: "BCG", title: "Summer Consultant", date: "Mar 8, 2026", status: "Applied" },
  { id: "3", company: "Deloitte", title: "Strategy Intern", date: "Mar 5, 2026", status: "Applied" },
];

export default function SimplifyIntegration() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Zap className="h-6 w-6 text-accent" /> Simplify Integration
        </h1>
        <p className="text-muted-foreground text-sm">Sync jobs applied via Simplify Copilot</p>
      </div>

      <Card className="bg-card border-border gradient-card">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-warning" />
            <div>
              <p className="text-foreground font-medium">Simplify not connected</p>
              <p className="text-sm text-muted-foreground">Install the Simplify Copilot Chrome extension and connect your account</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Zap className="mr-2 h-4 w-4" /> Connect Simplify
            </Button>
            <Button variant="outline" className="border-border text-foreground" asChild>
              <a href="https://simplify.jobs" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" /> Get Extension
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-lg font-semibold text-foreground">Synced Jobs (Demo)</h2>
      <div className="space-y-3">
        {mockJobs.map((job) => (
          <Card key={job.id} className="bg-card border-border">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-foreground font-medium">{job.company} — {job.title}</p>
                <p className="text-xs text-muted-foreground">Applied {job.date} via Simplify</p>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-warning/20 text-warning">{job.status}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
