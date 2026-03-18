import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");

// ATS domains that send application emails
const ATS_DOMAINS = [
  "greenhouse.io",
  "lever.co",
  "myworkday.com",
  "icims.com",
  "ashbyhq.com",
  "jobvite.com",
  "smartrecruiters.com",
  "bamboohr.com",
  "taleo.net",
  "brassring.com",
  "successfactors.com",
  "applytojob.com",
];

// Patterns for detecting email types
const APPLIED_PATTERNS = [
  /application\s+received/i,
  /thank\s+you\s+for\s+applying/i,
  /application\s+confirmation/i,
  /we\s+received\s+your\s+application/i,
  /your\s+application\s+(has\s+been\s+)?submitted/i,
  /application\s+for\s+.+\s+received/i,
];

const INTERVIEW_PATTERNS = [
  /schedule\s+(an?\s+)?interview/i,
  /interview\s+invitation/i,
  /next\s+steps?\s+in\s+your\s+application/i,
  /we('d|\s+would)\s+like\s+to\s+(meet|speak|interview)/i,
  /phone\s+screen/i,
  /virtual\s+interview/i,
];

const REJECTION_PATTERNS = [
  /move(d)?\s+forward\s+with\s+other\s+candidates/i,
  /not\s+moving\s+forward/i,
  /unfortunately/i,
  /we\s+regret/i,
  /decided\s+not\s+to\s+proceed/i,
  /position\s+has\s+been\s+filled/i,
  /will\s+not\s+be\s+moving\s+forward/i,
];

const OFFER_PATTERNS = [
  /offer\s+letter/i,
  /we('re|\s+are)\s+excited\s+to\s+offer/i,
  /congratulations/i,
  /pleased\s+to\s+extend\s+(an?\s+)?offer/i,
  /formal\s+offer/i,
];

function detectStatus(subject: string, snippet: string): string | null {
  const text = `${subject} ${snippet}`;
  if (OFFER_PATTERNS.some((p) => p.test(text))) return "offer";
  if (INTERVIEW_PATTERNS.some((p) => p.test(text))) return "interviewing";
  if (REJECTION_PATTERNS.some((p) => p.test(text))) return "rejected";
  if (APPLIED_PATTERNS.some((p) => p.test(text))) return "applied";
  return null;
}

function extractCompanyFromSubject(subject: string): string | null {
  // Try patterns like "Application to [Company]", "at [Company]", "[Company] - Application"
  const patterns = [
    /(?:application\s+(?:to|at|for)\s+)(.+?)(?:\s*[-–|]|\s*$)/i,
    /(?:at\s+)(.+?)(?:\s*[-–|]|\s*$)/i,
    /^(.+?)\s*[-–|]\s*(?:application|interview|thank|your)/i,
    /(?:from\s+)(.+?)(?:\s*[-–|]|\s*$)/i,
  ];
  for (const pattern of patterns) {
    const match = subject.match(pattern);
    if (match?.[1]) {
      const company = match[1].trim().replace(/^(the\s+)/i, "");
      if (company.length > 1 && company.length < 60) return company;
    }
  }
  return null;
}

async function refreshToken(refreshTokenStr: string): Promise<{ access_token: string; expires_in: number } | null> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) return null;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshTokenStr,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    console.error("Token refresh failed:", await response.text());
    return null;
  }

  return await response.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    // Get stored Gmail tokens
    const { data: gmailToken, error: tokenError } = await supabase
      .from("gmail_tokens")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (tokenError || !gmailToken) {
      return new Response(
        JSON.stringify({ error: "Gmail not connected. Please connect Gmail first." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if token needs refresh
    let accessToken = gmailToken.access_token;
    if (gmailToken.token_expires_at && new Date(gmailToken.token_expires_at) < new Date()) {
      if (!gmailToken.refresh_token) {
        return new Response(
          JSON.stringify({ error: "Gmail token expired. Please reconnect Gmail." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const refreshed = await refreshToken(gmailToken.refresh_token);
      if (!refreshed) {
        return new Response(
          JSON.stringify({ error: "Failed to refresh Gmail token. Please reconnect." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      accessToken = refreshed.access_token;
      const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

      // Update stored token using service role
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      await supabaseAdmin
        .from("gmail_tokens")
        .update({ access_token: accessToken, token_expires_at: newExpiry })
        .eq("user_id", userId);
    }

    // Build Gmail search query for ATS domains
    const domainQueries = ATS_DOMAINS.map((d) => `from:${d}`).join(" OR ");
    const query = `(${domainQueries}) newer_than:30d`;

    // Search Gmail
    const searchUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=50`;
    const searchResponse = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error("Gmail search failed:", errorText);
      return new Response(
        JSON.stringify({ error: `Gmail API error: ${searchResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const searchData = await searchResponse.json();
    const messageIds: string[] = (searchData.messages || []).map((m: any) => m.id);

    if (messageIds.length === 0) {
      // Update last_sync_at
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      await supabaseAdmin
        .from("gmail_tokens")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("user_id", userId);

      return new Response(
        JSON.stringify({ synced: 0, new_detections: 0, message: "No ATS emails found in the last 30 days" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check which messages we've already processed
    const { data: existingSyncs } = await supabase
      .from("email_syncs")
      .select("gmail_message_id")
      .eq("user_id", userId)
      .in("gmail_message_id", messageIds);

    const existingIds = new Set((existingSyncs || []).map((s: any) => s.gmail_message_id));
    const newMessageIds = messageIds.filter((id) => !existingIds.has(id));

    // Fetch details of new messages (batch, max 10 at a time)
    const detections: any[] = [];
    const batchSize = 10;

    for (let i = 0; i < Math.min(newMessageIds.length, 30); i += batchSize) {
      const batch = newMessageIds.slice(i, i + batchSize);
      const fetchPromises = batch.map(async (msgId) => {
        const msgUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`;
        const msgResponse = await fetch(msgUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!msgResponse.ok) {
          await msgResponse.text();
          return null;
        }
        return await msgResponse.json();
      });

      const messages = await Promise.all(fetchPromises);

      for (const msg of messages) {
        if (!msg) continue;

        const headers = msg.payload?.headers || [];
        const subject = headers.find((h: any) => h.name === "Subject")?.value || "";
        const from = headers.find((h: any) => h.name === "From")?.value || "";
        const date = headers.find((h: any) => h.name === "Date")?.value || "";
        const snippet = msg.snippet || "";

        // Extract sender email
        const fromEmailMatch = from.match(/<([^>]+)>/);
        const fromEmail = fromEmailMatch ? fromEmailMatch[1] : from;

        // Detect status and company
        const statusDetected = detectStatus(subject, snippet);
        if (!statusDetected) continue; // Skip if we can't determine status

        const companyDetected = extractCompanyFromSubject(subject);

        detections.push({
          user_id: userId,
          gmail_message_id: msg.id,
          from_email: fromEmail,
          subject,
          company_detected: companyDetected,
          role_detected: null,
          status_detected: statusDetected,
          synced_at: date ? new Date(date).toISOString() : new Date().toISOString(),
        });
      }
    }

    // Insert new detections
    if (detections.length > 0) {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const { error: insertError } = await supabaseAdmin
        .from("email_syncs")
        .insert(detections);

      if (insertError) {
        console.error("Failed to insert detections:", insertError);
      }
    }

    // Update last_sync_at
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    await supabaseAdmin
      .from("gmail_tokens")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("user_id", userId);

    return new Response(
      JSON.stringify({
        synced: messageIds.length,
        new_detections: detections.length,
        detections: detections.map((d) => ({
          subject: d.subject,
          company: d.company_detected,
          status: d.status_detected,
          from: d.from_email,
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("gmail-scan error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
