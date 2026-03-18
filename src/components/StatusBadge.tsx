import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  interested: "bg-primary/20 text-primary border-primary/30",
  applied: "bg-warning/20 text-warning border-warning/30",
  interviewing: "bg-accent/20 text-accent border-accent/30",
  offer: "bg-success/20 text-success border-success/30",
  accepted: "bg-success/20 text-success border-success/30",
  rejected: "bg-destructive/20 text-destructive border-destructive/30",
  declined: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("capitalize text-xs font-medium", statusColors[status] || statusColors.interested)}>
      {status}
    </Badge>
  );
}
