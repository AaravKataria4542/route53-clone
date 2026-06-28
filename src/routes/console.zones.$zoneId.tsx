import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Download, Upload } from "lucide-react";
import { RECORD_TYPES, RecordType, validateRecord } from "@/lib/dns";
import {
  createDnsRecord,
  deleteDnsRecords,
  deleteHostedZones,
  getHostedZone,
  listDnsRecords,
  updateDnsRecord,
  type DnsRecord,
  type HostedZone,
} from "@/lib/route53Store";

export const Route = createFileRoute("/console/zones/$zoneId")({
  head: () => ({ meta: [{ title: "Hosted zone — Route 53" }] }),
  component: ZoneDetail,
});

type Zone = HostedZone;
type Rec = DnsRecord;

function ZoneDetail() {
  const { zoneId } = Route.useParams();
  const navigate = useNavigate();
  const [zone, setZone] = useState<Zone | null>(null);
  const [records, setRecords] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Rec | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setZone(getHostedZone(zoneId));
      setRecords(listDnsRecords(zoneId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load hosted zone");
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, [zoneId]);

  async function deleteZone() {
    try {
      deleteHostedZones([zoneId]);
      toast.success("Zone deleted");
      navigate({ to: "/console/zones" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete zone");
    }
  }

  async function deleteRecords() {
    if (!selected.size) return;
    try {
      deleteDnsRecords([...selected]);
      toast.success(`Deleted ${selected.size} record(s)`);
      setSelected(new Set());
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete records");
    }
  }

  function exportBind() {
    if (!zone) return;
    const lines = [`; Zone file for ${zone.name}`, `$ORIGIN ${zone.name}.`, ""];
    for (const r of records) {
      const vals = r.value.split("\n");
      for (const v of vals) lines.push(`${r.name}.\t${r.ttl}\tIN\t${r.type}\t${v}`);
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${zone.name}.zone`; a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = records;

  return (
    <div className="px-8 py-6 max-w-[1400px] mx-auto">
      <nav className="text-[13px] text-muted-foreground mb-3 flex items-center gap-1.5">
        <Link to="/console/route53" className="text-aws-link hover:underline">Route 53</Link>
        <span>›</span>
        <Link to="/console/zones" className="text-aws-link hover:underline">Hosted zones</Link>
        <span>›</span>
        <span className="font-mono">{zone?.name ?? "…"}</span>
      </nav>

      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-[24px] font-bold font-mono">{zone?.name ?? "…"}</h1>
          {zone && <p className="text-[13px] text-muted-foreground mt-1">{zone.type} hosted zone · {zone.record_count} records · Created {new Date(zone.created_at).toLocaleDateString()}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="aws-secondary" className="h-8" onClick={() => navigate({ to: "/console/zones" })}><ArrowLeft className="h-3.5 w-3.5" /> Back</Button>
          <Button variant="aws-secondary" className="h-8" onClick={exportBind}><Download className="h-3.5 w-3.5" /> Export</Button>
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="aws-secondary" className="h-8 text-destructive">Delete zone</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete hosted zone {zone?.name}?</AlertDialogTitle>
                <AlertDialogDescription>All {records.length} records will be permanently deleted.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={deleteZone}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="bg-aws-panel border border-border rounded-sm">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-[16px] font-bold">Records ({records.length})</h2>
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="aws-secondary" className="h-8" disabled={!selected.size}>Delete record</Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Delete {selected.size} record(s)?</AlertDialogTitle></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={deleteRecords}>Delete</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild><Button variant="aws" className="h-8">Create record</Button></DialogTrigger>
              <RecordDialog zone={zone} record={null} onSaved={() => { setCreateOpen(false); load(); }} />
            </Dialog>
          </div>
        </div>

        <table className="w-full text-[13px]">
          <thead className="bg-secondary text-left">
            <tr>
              <th className="w-10 px-3 py-2"></th>
              <th className="px-3 py-2 font-semibold">Record name</th>
              <th className="px-3 py-2 font-semibold">Type</th>
              <th className="px-3 py-2 font-semibold">Routing policy</th>
              <th className="px-3 py-2 font-semibold">TTL</th>
              <th className="px-3 py-2 font-semibold">Value</th>
              <th className="w-10 px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">No records yet.</td></tr>
            ) : filtered.map(r => (
              <tr key={r.id} className="border-t border-border hover:bg-accent/40">
                <td className="px-3 py-2">
                  <Checkbox
                    checked={selected.has(r.id)}
                    disabled={r.type === "SOA" || r.type === "NS"}
                    onCheckedChange={(c) => { const n = new Set(selected); if (c) n.add(r.id); else n.delete(r.id); setSelected(n); }}
                  />
                </td>
                <td className="px-3 py-2 font-mono">{r.name}</td>
                <td className="px-3 py-2"><span className="px-1.5 py-0.5 bg-secondary border border-border rounded-sm text-[11px] font-mono">{r.type}</span></td>
                <td className="px-3 py-2">{r.routing_policy}</td>
                <td className="px-3 py-2 tabular-nums">{r.ttl}</td>
                <td className="px-3 py-2 font-mono text-muted-foreground max-w-md truncate whitespace-pre-line">{r.value}</td>
                <td className="px-3 py-2">
                  {r.type !== "SOA" && (
                    <button className="text-aws-link hover:underline text-[12px]" onClick={() => setEditing(r)}>Edit</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <Dialog open onOpenChange={(o) => !o && setEditing(null)}>
          <RecordDialog zone={zone} record={editing} onSaved={() => { setEditing(null); load(); }} />
        </Dialog>
      )}
    </div>
  );
}

function RecordDialog({ zone, record, onSaved }: { zone: Zone | null; record: Rec | null; onSaved: () => void }) {
  const [name, setName] = useState(record?.name ?? "");
  const [type, setType] = useState<RecordType>((record?.type as RecordType) ?? "A");
  const [ttl, setTtl] = useState(record?.ttl ?? 300);
  const [value, setValue] = useState(record?.value ?? "");
  const [policy, setPolicy] = useState(record?.routing_policy ?? "Simple");
  const [saving, setSaving] = useState(false);

  const fullName = useMemo(() => {
    if (!zone) return name;
    if (!name || name === zone.name) return zone.name;
    return name.endsWith(zone.name) ? name : `${name.replace(/\.$/, "")}.${zone.name}`;
  }, [name, zone]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!zone) return;
    const err = validateRecord(type, value);
    if (err) { toast.error(err); return; }
    setSaving(true);
    const payload = { name: fullName, type, ttl, value: value.trim(), routing_policy: policy };
    try {
      if (record) updateDnsRecord(record.id, payload);
      else createDnsRecord(zone.id, payload);
      toast.success(record ? "Record updated" : "Record created");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save record");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{record ? "Edit record" : "Create record"}</DialogTitle>
        <DialogDescription>Define how Route 53 responds to DNS queries.</DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[13px] font-bold">Record name</Label>
            <div className="flex items-center mt-1">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="www" className="h-9 rounded-r-none" />
              <span className="px-2 h-9 flex items-center border border-l-0 border-border bg-secondary text-[13px] text-muted-foreground rounded-r-sm font-mono">.{zone?.name}</span>
            </div>
          </div>
          <div>
            <Label className="text-[13px] font-bold">Record type</Label>
            <Select value={type} onValueChange={(v) => setType(v as RecordType)}>
              <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {RECORD_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label className="text-[13px] font-bold">Value</Label>
          <Textarea value={value} onChange={(e) => setValue(e.target.value)} rows={3} className="mt-1 font-mono text-[13px]" placeholder={placeholderFor(type)} />
          <p className="text-[12px] text-muted-foreground mt-1">{hintFor(type)}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[13px] font-bold">TTL (seconds)</Label>
            <Input type="number" min={1} value={ttl} onChange={(e) => setTtl(Number(e.target.value))} className="h-9 mt-1" />
          </div>
          <div>
            <Label className="text-[13px] font-bold">Routing policy</Label>
            <Select value={policy} onValueChange={setPolicy}>
              <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Simple","Weighted","Latency","Failover","Geolocation","Multivalue"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" variant="aws" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} {record ? "Save changes" : "Create records"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function placeholderFor(t: RecordType): string {
  switch (t) {
    case "A": return "192.0.2.1";
    case "AAAA": return "2001:db8::1";
    case "CNAME": return "example.com";
    case "MX": return "10 mail.example.com";
    case "TXT": return '"v=spf1 -all"';
    case "SRV": return "10 60 5060 sip.example.com";
    case "CAA": return '0 issue "letsencrypt.org"';
    default: return "";
  }
}
function hintFor(t: RecordType): string {
  switch (t) {
    case "MX": return "Format: <priority> <mail server>";
    case "SRV": return "Format: <priority> <weight> <port> <target>";
    case "CAA": return 'Format: <flags> <tag> "<value>"';
    case "TXT": return "Wrap value in quotes.";
    default: return "One value per line for multiple values.";
  }
}
