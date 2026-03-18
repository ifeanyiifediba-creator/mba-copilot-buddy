import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Building2, Briefcase, Users, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { StatusBadge } from "./StatusBadge";

interface SearchResult {
  type: "company" | "role" | "contact";
  id: string;
  title: string;
  subtitle?: string;
  status?: string;
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const pattern = `%${q}%`;

    const [{ data: companies }, { data: roles }, { data: contacts }] = await Promise.all([
      supabase.from("companies").select("id, name, industry").ilike("name", pattern).limit(5),
      supabase.from("roles").select("id, title, status, companies(name)").ilike("title", pattern).limit(5),
      supabase.from("contacts").select("id, name, kind, companies(name)").ilike("name", pattern).limit(5),
    ]);

    const mapped: SearchResult[] = [
      ...(companies || []).map((c: any) => ({
        type: "company" as const, id: c.id, title: c.name, subtitle: c.industry,
      })),
      ...(roles || []).map((r: any) => ({
        type: "role" as const, id: r.id, title: r.title, subtitle: r.companies?.name, status: r.status,
      })),
      ...(contacts || []).map((c: any) => ({
        type: "contact" as const, id: c.id, title: c.name, subtitle: c.companies?.name || c.kind,
      })),
    ];

    setResults(mapped);
    setSelectedIndex(-1);
    setLoading(false);
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (query.length < 2) { setResults([]); setOpen(false); return; }
    setOpen(true);
    debounceRef.current = setTimeout(() => search(query), 200);
    return () => clearTimeout(debounceRef.current);
  }, [query, search]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const navigateToResult = (result: SearchResult) => {
    setOpen(false);
    setQuery("");
    if (result.type === "company" || result.type === "role") navigate("/pipeline");
    else navigate("/contacts");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && selectedIndex >= 0) { e.preventDefault(); navigateToResult(results[selectedIndex]); }
    if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
  };

  const icons = { company: Building2, role: Briefcase, contact: Users };
  const labels = { company: "Company", role: "Role", contact: "Contact" };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search companies, roles, contacts..."
          className="pl-9 pr-8 bg-secondary border-border text-foreground h-9"
        />
        {query && (
          <button onClick={() => { setQuery(""); setResults([]); setOpen(false); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden max-h-80 overflow-y-auto">
          {loading && <div className="p-3 text-xs text-muted-foreground">Searching...</div>}
          {!loading && results.length === 0 && query.length >= 2 && (
            <div className="p-3 text-xs text-muted-foreground">No results found</div>
          )}
          {results.map((result, i) => {
            const Icon = icons[result.type];
            return (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => navigateToResult(result)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                  i === selectedIndex ? "bg-accent/10" : "hover:bg-secondary"
                }`}
              >
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">{result.title}</span>
                    {result.status && <StatusBadge status={result.status} />}
                  </div>
                  {result.subtitle && <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>}
                </div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider shrink-0">{labels[result.type]}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
