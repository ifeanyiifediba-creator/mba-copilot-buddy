import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon, Mail, Zap, Download, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function SettingsPage() {
  const { user } = useAuth();

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
            <XCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-muted-foreground">Not connected</span>
          </div>
          <Button size="sm">Connect Gmail</Button>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="text-foreground text-sm flex items-center gap-2"><Zap className="h-4 w-4" /> Simplify Connection</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-muted-foreground">Not connected</span>
          </div>
          <Button size="sm" variant="outline" className="border-border text-foreground">Connect</Button>
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
          <Button variant="outline" className="border-border text-foreground">
            <Download className="mr-2 h-4 w-4" /> Export as CSV
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
