import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, RefreshCw, CheckCircle, X, AlertCircle } from "lucide-react";

const mockDetections = [
  { id: "1", date: "Mar 15, 2026", from: "no-reply@greenhouse.io", subject: "Application received - Product Manager at Stripe", company: "Stripe", status: "applied" },
  { id: "2", date: "Mar 14, 2026", from: "recruiting@lever.co", subject: "Thank you for applying to Google", company: "Google", status: "applied" },
  { id: "3", date: "Mar 12, 2026", from: "notifications@myworkday.com", subject: "We'd like to schedule an interview - Amazon", company: "Amazon", status: "interviewing" },
];

export default function GmailSync() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Mail className="h-6 w-6 text-primary" /> Gmail Sync
        </h1>
        <p className="text-muted-foreground text-sm">Auto-detect applications from your inbox</p>
      </div>

      <Card className="bg-card border-border gradient-card">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-warning" />
            <div>
              <p className="text-foreground font-medium">Gmail not connected</p>
              <p className="text-sm text-muted-foreground">Connect your Gmail to auto-detect job applications</p>
            </div>
          </div>
          <Button className="bg-primary text-primary-foreground">
            <Mail className="mr-2 h-4 w-4" /> Connect Gmail
          </Button>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Detected Emails</h2>
        <Button variant="outline" size="sm" className="border-border text-foreground">
          <RefreshCw className="mr-2 h-3 w-3" /> Sync Now
        </Button>
      </div>

      <div className="space-y-3">
        {mockDetections.map((d) => (
          <Card key={d.id} className="bg-card border-border">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{d.date}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary capitalize">{d.status}</span>
                </div>
                <p className="text-foreground font-medium text-sm truncate">{d.subject}</p>
                <p className="text-xs text-muted-foreground">{d.from} → Detected: {d.company}</p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-success hover:bg-success/10">
                  <CheckCircle className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
