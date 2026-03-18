import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings as SettingsIcon, Mail, Zap, Download, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function SettingsPage() {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);

  const exportCSV = async () => {
    setExporting(true);
    try {
      const [{ data: roles }, { data: contacts }, { data: conversations }] = await Promise.all([
        supabase.from("roles").select("title, status, deadline, salary, location, source, link, notes, created_at, companies(name)"),
        supabase.from("contacts").select("name, kind, email, phone, linkedin, notes, created_at, companies(name)"),
        supabase.from("conversations").select("date, summary, follow_up_date, follow_up_done, notes, created_at, contacts(name), companies(name)"),
      ]);

      const toCsv = (headers: string[], rows: any[][]) => {
        const escape = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
        return [headers.map(escape).join(","), ...rows.map(r => r.map(escape).join(","))].join("\n");
      };

      const rolesCsv = toCsv(
        ["Title", "Company", "Status", "Deadline", "Salary", "Location", "Source", "Link", "Notes", "Created"],
        (roles || []).map((r: any) => [r.title, r.companies?.name, r.status, r.deadline, r.salary, r.location, r.source, r.link, r.notes, r.created_at])
      );

      const contactsCsv = toCsv(
        ["Name", "Company", "Kind", "Email", "Phone", "LinkedIn", "Notes", "Created"],
        (contacts || []).map((c: any) => [c.name, c.companies?.name, c.kind, c.email, c.phone, c.linkedin, c.notes, c.created_at])
      );

      const convCsv = toCsv(
        ["Date", "Contact", "Company", "Summary", "Follow-up Date", "Follow-up Done", "Notes", "Created"],
        (conversations || []).map((c: any) => [c.date, c.contacts?.name, c.companies?.name, c.summary, c.follow_up_date, c.follow_up_done, c.notes, c.created_at])
      );

      const full = `ROLES\n${rolesCsv}\n\nCONTACTS\n${contactsCsv}\n\nCONVERSATIONS\n${convCsv}`;
      const blob = new Blob([full], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mba-copilot-export-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data exported successfully");
    } catch (e) {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const { data: gmailStatus } = useQuery({
    queryKey: ["gmail-status-settings", user?.id],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gmail-connect?action=status`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) return { connected: false };
      return await response.json();
    },
    enabled: !!user && !!session,
    retry: false,
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <SettingsIcon className="h-6 w-6 text-primary" /> Settings
      </h1>

      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="text-foreground text-sm">Account</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">Email: {user?.email}</p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="text-foreground text-sm flex items-center gap-2"><Mail className="h-4 w-4" /> Gmail Connection</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {gmailStatus?.connected ? (
              <CheckCircle2 className="h-4 w-4 text-success" />
            ) : (
              <XCircle className="h-4 w-4 text-destructive" />
            )}
            <span className="text-sm text-muted-foreground">
              {gmailStatus?.connected ? `Connected (${gmailStatus.email})` : "Not connected"}
            </span>
          </div>
          <Button size="sm" onClick={() => navigate("/gmail-sync")}>
            {gmailStatus?.connected ? "Manage" : "Connect"}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="text-foreground text-sm flex items-center gap-2"><Zap className="h-4 w-4" /> Simplify Connection</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-muted-foreground">Not connected</span>
          </div>
          <Button size="sm" variant="outline" className="border-border text-foreground" onClick={() => navigate("/simplify")}>
            Connect
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="text-foreground text-sm">Email Scan Frequency</CardTitle></CardHeader>
        <CardContent>
          <Select defaultValue="6h">
            <SelectTrigger className="w-48 bg-secondary border-border text-foreground"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="6h">Every 6 hours</SelectItem>
              <SelectItem value="12h">Every 12 hours</SelectItem>
              <SelectItem value="24h">Every 24 hours</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="text-foreground text-sm">Export Data</CardTitle></CardHeader>
        <CardContent>
          <Button variant="outline" className="border-border text-foreground" onClick={exportCSV} disabled={exporting}>
            {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            {exporting ? "Exporting..." : "Export as CSV"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
