import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, RefreshCw, CheckCircle, X, AlertCircle, CheckCircle2, Loader2, Unlink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";

export default function GmailSync() {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Check for ?connected=true from OAuth callback
  useEffect(() => {
    if (searchParams.get("connected") === "true") {
      toast.success("Gmail connected successfully!");
      queryClient.invalidateQueries({ queryKey: ["gmail-status"] });
      setSearchParams({});
    }
  }, [searchParams, queryClient, setSearchParams]);

  // Check Gmail connection status
  const { data: gmailStatus, isLoading: statusLoading } = useQuery({
    queryKey: ["gmail-status", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("gmail-connect", {
        body: null,
        method: "GET",
        headers: {},
      });
      // Use the query param approach since functions.invoke doesn't support query params well
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gmail-connect?action=status`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to check status");
      return await response.json();
    },
    enabled: !!user && !!session,
    retry: false,
  });

  // Connect Gmail
  const connectGmail = useMutation({
    mutationFn: async () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const redirectUri = `${supabaseUrl}/functions/v1/gmail-connect?action=callback`;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/gmail-connect?action=authorize&redirect_uri=${encodeURIComponent(redirectUri)}`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to initiate Gmail connection");
      }

      const { url } = await response.json();
      window.location.href = url;
    },
    onError: (error) => toast.error(error.message),
  });

  // Disconnect Gmail
  const disconnectGmail = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gmail-connect?action=disconnect`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to disconnect");
      return await response.json();
    },
    onSuccess: () => {
      toast.success("Gmail disconnected");
      queryClient.invalidateQueries({ queryKey: ["gmail-status"] });
    },
    onError: (error) => toast.error(error.message),
  });

  // Scan Gmail
  const scanGmail = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("gmail-scan");
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["email-syncs"] });
      queryClient.invalidateQueries({ queryKey: ["gmail-status"] });
      toast.success(`Scan complete: ${data.new_detections} new application(s) detected`);
    },
    onError: (error) => toast.error(error.message),
  });

  // Fetch email sync detections
  const { data: emailSyncs = [], isLoading: syncsLoading } = useQuery({
    queryKey: ["email-syncs", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("email_syncs")
        .select("*")
        .order("synced_at", { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!user,
  });

  // Confirm detection
  const confirmDetection = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_syncs").update({ confirmed: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-syncs"] });
      queryClient.invalidateQueries({ queryKey: ["recent-detections"] });
      toast.success("Detection confirmed");
    },
  });

  // Dismiss detection
  const dismissDetection = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_syncs").update({ dismissed: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-syncs"] });
      queryClient.invalidateQueries({ queryKey: ["recent-detections"] });
      toast.success("Detection dismissed");
    },
  });

  const isConnected = gmailStatus?.connected;
  const pendingSyncs = emailSyncs.filter((s: any) => !s.confirmed && !s.dismissed);
  const processedSyncs = emailSyncs.filter((s: any) => s.confirmed || s.dismissed);

  const statusBgColors: Record<string, string> = {
    applied: "bg-warning/20 text-warning",
    interviewing: "bg-accent/20 text-accent",
    rejected: "bg-destructive/20 text-destructive",
    offer: "bg-success/20 text-success",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Mail className="h-6 w-6 text-primary" /> Gmail Sync
        </h1>
        <p className="text-muted-foreground text-sm">Auto-detect applications from your inbox</p>
      </div>

      {/* Connection Status Card */}
      <Card className="bg-card border-border gradient-card">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {statusLoading ? (
              <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
            ) : isConnected ? (
              <CheckCircle2 className="h-5 w-5 text-success" />
            ) : (
              <AlertCircle className="h-5 w-5 text-warning" />
            )}
            <div>
              <p className="text-foreground font-medium">
                {isConnected ? `Gmail connected (${gmailStatus.email})` : "Gmail not connected"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isConnected
                  ? gmailStatus.last_sync_at
                    ? `Last synced ${format(new Date(gmailStatus.last_sync_at), "MMM d, h:mm a")}`
                    : "Never synced"
                  : "Connect your Gmail to auto-detect job applications from ATS platforms"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {isConnected ? (
              <>
                <Button
                  onClick={() => scanGmail.mutate()}
                  disabled={scanGmail.isPending}
                >
                  {scanGmail.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  {scanGmail.isPending ? "Scanning..." : "Sync Now"}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => disconnectGmail.mutate()}
                  className="border-border text-muted-foreground hover:text-destructive"
                  title="Disconnect Gmail"
                >
                  <Unlink className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                onClick={() => connectGmail.mutate()}
                disabled={connectGmail.isPending}
              >
                {connectGmail.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                Connect Gmail
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ATS Platforms Info */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">
            <span className="text-foreground font-medium">Supported ATS platforms: </span>
            Greenhouse, Lever, Workday, iCIMS, Ashby, Jobvite, SmartRecruiters, BambooHR, Taleo, Brassring, SuccessFactors
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            <span className="text-foreground font-medium">Detects: </span>
            Application confirmations, interview invitations, rejections, and offers
          </p>
        </CardContent>
      </Card>

      {/* Pending Detections */}
      {pendingSyncs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">
            New Detections ({pendingSyncs.length})
          </h2>
          {pendingSyncs.map((sync: any) => (
            <Card key={sync.id} className="bg-card border-border">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(sync.synced_at), "MMM d, yyyy")}
                    </span>
                    {sync.status_detected && (
                      <span className={`text-xs px-2 py-0.5 rounded capitalize ${statusBgColors[sync.status_detected] || "bg-primary/20 text-primary"}`}>
                        {sync.status_detected}
                      </span>
                    )}
                  </div>
                  <p className="text-foreground font-medium text-sm truncate">{sync.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {sync.from_email}
                    {sync.company_detected && <> → Detected: <span className="text-foreground">{sync.company_detected}</span></>}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-success hover:bg-success/10"
                    onClick={() => confirmDetection.mutate(sync.id)}
                    title="Confirm"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => dismissDetection.mutate(sync.id)}
                    title="Dismiss"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Processed Detections */}
      {processedSyncs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            History ({processedSyncs.length})
          </h2>
          {processedSyncs.slice(0, 20).map((sync: any) => (
            <Card key={sync.id} className="bg-card border-border opacity-60">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(sync.synced_at), "MMM d")}
                    </span>
                    {sync.status_detected && (
                      <span className={`text-xs px-2 py-0.5 rounded capitalize ${statusBgColors[sync.status_detected] || "bg-primary/20 text-primary"}`}>
                        {sync.status_detected}
                      </span>
                    )}
                    <span className={`text-xs ${sync.confirmed ? "text-success" : "text-muted-foreground"}`}>
                      {sync.confirmed ? "✓ Confirmed" : "Dismissed"}
                    </span>
                  </div>
                  <p className="text-foreground text-xs truncate">{sync.subject}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!syncsLoading && emailSyncs.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {isConnected
              ? 'No emails detected yet. Click "Sync Now" to scan your inbox.'
              : "Connect Gmail to start detecting applications automatically."}
          </p>
        </div>
      )}
    </div>
  );
}
