import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Mail, Linkedin, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const kindColors: Record<string, string> = {
  recruiter: "bg-primary/20 text-primary border-primary/30",
  hiring_manager: "bg-accent/20 text-accent border-accent/30",
  alum: "bg-success/20 text-success border-success/30",
  referral: "bg-warning/20 text-warning border-warning/30",
  other: "bg-muted text-muted-foreground border-border",
};

export default function Contacts() {
  const { user } = useAuth();

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["contacts", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("contacts")
        .select("*, companies(name)")
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" /> Contacts
        </h1>
        <p className="text-muted-foreground text-sm">{contacts.length} contacts</p>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Name</TableHead>
                <TableHead className="text-muted-foreground">Company</TableHead>
                <TableHead className="text-muted-foreground">Type</TableHead>
                <TableHead className="text-muted-foreground">Email</TableHead>
                <TableHead className="text-muted-foreground">LinkedIn</TableHead>
                <TableHead className="text-muted-foreground">Phone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
              ) : contacts.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No contacts yet</TableCell></TableRow>
              ) : (
                contacts.map((c: any) => (
                  <TableRow key={c.id} className="border-border hover:bg-secondary/50">
                    <TableCell className="text-foreground font-medium">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground">{c.companies?.name || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`capitalize text-xs ${kindColors[c.kind] || kindColors.other}`}>
                        {c.kind.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {c.email ? (
                        <a href={`mailto:${c.email}`} className="text-primary text-sm hover:underline flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {c.email}
                        </a>
                      ) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      {c.linkedin ? (
                        <a href={c.linkedin} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline flex items-center gap-1">
                          <Linkedin className="h-3 w-3" /> Profile
                        </a>
                      ) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      {c.phone ? (
                        <span className="text-foreground text-sm flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {c.phone}
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
