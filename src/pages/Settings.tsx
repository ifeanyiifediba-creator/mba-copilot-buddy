import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, Zap, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function SettingsPage() {
  const { user } = useAuth();
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
        <CardHeader><CardTitle className="text-foreground text-sm flex items-center gap-2"><Zap className="h-4 w-4" /> Simplify Connection</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Manual sync for Simplify applications</span>
          <Button size="sm" variant="outline" className="border-border text-foreground" onClick={() => navigate("/simplify")}>
            Manage
          </Button>
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
