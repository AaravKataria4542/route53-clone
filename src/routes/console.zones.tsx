import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Search, RefreshCw, Loader2, Trash2 } from "lucide-react";
import { isValidDomain } from "@/lib/dns";
import { createHostedZone, deleteHostedZones, listHostedZones, type HostedZone } from "@/lib/route53Store";

export const Route = createFileRoute("/console/zones")({
  head: () => ({
    meta: [
      { title: "Hosted zones — Route 53" },
      { name: "description", content: "Manage your Route 53 hosted zones." },
    ],
  }),
  component: ZonesPage,
});

type Zone = HostedZone;

function ZonesPage() {
  const navigate = useNavigate();
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | "Public" | "Private">("All");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setZones(listHostedZones());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load hosted zones");
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return zones.filter(z =>
      (typeFilter === "All" || z.type === typeFilter) &&
      (!q || z.name.toLowerCase().includes(q.toLowerCase()) || (z.comment ?? "").toLowerCase().includes(q.toLowerCase()))
    );
  }, [zones, q, typeFilter]);

  async function deleteSelected() {
    if (!selected.size) return;
    try {
      deleteHostedZones([...selected]);
      toast.success(`Deleted ${selected.size} zone(s)`);
      setSelected(new Set());
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete hosted zones");
    }
  }

  return (
    <div className="px-8 py-6 max-w-[1400px] mx-auto">
      <nav className="text-[13px] text-muted-foreground mb-3 flex items-center gap-1.5">
        <Link to="/console/route53" className="text-aws-link hover:underline">Route 53</Link>
        <span>›</span><span>Hosted zones</span>
      </nav>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[24px] font-bold">Hosted zones <span className="text-muted-foreground text-[14px] font-normal">({zones.length})</span></h1>
        </div>
        <div className="flex gap-2">
          <Button variant="aws-secondary" className="h-8" onClick={load}><RefreshCw className="h-3.5 w-3.5" /></Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="aws-secondary" className="h-8" disabled={!selected.size}>Delete</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {selected.size} hosted zone(s)?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone. All DNS records in these zones will also be deleted.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={deleteSelected}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="aws" className="h-8">Create hosted zone</Button>
            </DialogTrigger>
            <CreateZoneDialog onCreated={() => { setCreateOpen(false); load(); }} />
          </Dialog>
        </div>
      </div>

      <div className="bg-aws-panel border border-border rounded-sm">
        <div className="flex gap-2 p-3 border-b border-border">
          <div className="flex items-center gap-2 bg-background border border-border rounded-sm px-2 flex-1 max-w-md">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              placeholder="Filter hosted zones by name or comment"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="bg-transparent text-[13px] py-1.5 outline-none flex-1"
            />
          </div>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
            <SelectTrigger className="w-[140px] h-8 text-[13px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All types</SelectItem>
              <SelectItem value="Public">Public</SelectItem>
              <SelectItem value="Private">Private</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <table className="w-full text-[13px]">
          <thead className="bg-secondary text-foreground/80 text-left">
            <tr>
              <th className="w-10 px-3 py-2"></th>
              <th className="px-3 py-2 font-semibold">Domain name</th>
              <th className="px-3 py-2 font-semibold">Type</th>
              <th className="px-3 py-2 font-semibold">Record count</th>
              <th className="px-3 py-2 font-semibold">Comment</th>
              <th className="px-3 py-2 font-semibold">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline" /> Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-12 text-center">
                <div className="text-foreground font-semibold">No hosted zones</div>
                <div className="text-muted-foreground mt-1">Create your first hosted zone to start routing DNS traffic.</div>
              </td></tr>
            ) : filtered.map(z => (
              <tr key={z.id} className="border-t border-border hover:bg-accent/40">
                <td className="px-3 py-2">
                  <Checkbox
                    checked={selected.has(z.id)}
                    onCheckedChange={(c) => {
                      const next = new Set(selected);
                      if (c) next.add(z.id); else next.delete(z.id);
                      setSelected(next);
                    }}
                  />
                </td>
                <td className="px-3 py-2">
                  <button className="text-aws-link hover:underline font-mono" onClick={() => navigate({ to: "/console/zones/$zoneId", params: { zoneId: z.id } })}>
                    {z.name}
                  </button>
                </td>
                <td className="px-3 py-2">{z.type}</td>
                <td className="px-3 py-2 tabular-nums">{z.record_count}</td>
                <td className="px-3 py-2 text-muted-foreground">{z.comment ?? "—"}</td>
                <td className="px-3 py-2 text-muted-foreground">{new Date(z.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CreateZoneDialog({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"Public" | "Private">("Public");
  const [comment, setComment] = useState("");
  const [vpcId, setVpcId] = useState("");
  const [vpcRegion, setVpcRegion] = useState("us-east-1");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidDomain(name)) { toast.error("Enter a valid domain name (e.g. example.com)"); return; }
    setSaving(true);
    try {
      createHostedZone({
      name: name.trim().replace(/\.$/, ""),
      type, comment: comment || null,
      vpc_id: type === "Private" ? vpcId : null,
      vpc_region: type === "Private" ? vpcRegion : null,
      });
      toast.success("Hosted zone created");
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DialogContent className="max-w-xl">
      <DialogHeader>
        <DialogTitle>Create hosted zone</DialogTitle>
        <DialogDescription>A hosted zone tells Route 53 how to respond to DNS queries for a domain.</DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <Label className="text-[13px] font-bold">Domain name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="example.com" className="h-9 mt-1" required />
        </div>
        <div>
          <Label className="text-[13px] font-bold">Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as "Public" | "Private")}>
            <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Public">Public hosted zone</SelectItem>
              <SelectItem value="Private">Private hosted zone</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {type === "Private" && (
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-[13px] font-bold">VPC ID</Label><Input value={vpcId} onChange={(e) => setVpcId(e.target.value)} placeholder="vpc-0123abcd" className="h-9 mt-1" /></div>
            <div><Label className="text-[13px] font-bold">Region</Label><Input value={vpcRegion} onChange={(e) => setVpcRegion(e.target.value)} className="h-9 mt-1" /></div>
          </div>
        )}
        <div>
          <Label className="text-[13px] font-bold">Comment (optional)</Label>
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} className="mt-1" rows={2} />
        </div>
        <DialogFooter>
          <Button type="submit" variant="aws" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Create hosted zone
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
