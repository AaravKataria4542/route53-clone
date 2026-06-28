import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { createHealthCheck, listHealthChecks, type HealthCheck } from "@/lib/route53Store";

export const Route = createFileRoute("/console/health-checks")({
  head: () => ({ meta: [{ title: "Health checks — Route 53" }] }),
  component: HealthChecksPage,
});

type HC = HealthCheck;

function HealthChecksPage() {
  const [items, setItems] = useState<HC[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setItems(listHealthChecks());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load health checks");
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  return (
    <div className="px-8 py-6 max-w-[1400px] mx-auto">
      <nav className="text-[13px] text-muted-foreground mb-3"><Link to="/console/route53" className="text-aws-link hover:underline">Route 53</Link> › Health checks</nav>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[24px] font-bold">Health checks <span className="text-muted-foreground text-[14px] font-normal">({items.length})</span></h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="aws" className="h-8">Create health check</Button></DialogTrigger>
          <CreateHC onSaved={() => { setOpen(false); load(); }} />
        </Dialog>
      </div>
      <div className="bg-aws-panel border border-border rounded-sm">
        <table className="w-full text-[13px]">
          <thead className="bg-secondary text-left">
            <tr>
              <th className="px-3 py-2 font-semibold">Name</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 font-semibold">Protocol</th>
              <th className="px-3 py-2 font-semibold">Endpoint</th>
              <th className="px-3 py-2 font-semibold">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="px-3 py-8 text-center"><Loader2 className="h-4 w-4 inline animate-spin" /></td></tr>
              : items.length === 0 ? <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">No health checks yet.</td></tr>
              : items.map(h => (
                <tr key={h.id} className="border-t border-border">
                  <td className="px-3 py-2 font-mono">{h.name}</td>
                  <td className="px-3 py-2"><span className="text-green-700 font-semibold">● {h.status}</span></td>
                  <td className="px-3 py-2">{h.protocol}</td>
                  <td className="px-3 py-2 font-mono text-muted-foreground">{h.endpoint}:{h.port}{h.path}</td>
                  <td className="px-3 py-2 text-muted-foreground">{new Date(h.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CreateHC({ onSaved }: { onSaved: () => void }) {
  const [name, setName] = useState(""); const [proto, setProto] = useState("HTTPS");
  const [endpoint, setEndpoint] = useState(""); const [port, setPort] = useState(443); const [path, setPath] = useState("/");
  const [saving, setSaving] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      createHealthCheck({ name, protocol: proto, endpoint, port, path });
      toast.success("Health check created");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create health check");
    } finally {
      setSaving(false);
    }
  }
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Create health check</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="space-y-3">
        <div><Label className="text-[13px] font-bold">Name</Label><Input value={name} onChange={e=>setName(e.target.value)} required className="h-9 mt-1" /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label className="text-[13px] font-bold">Protocol</Label>
            <Select value={proto} onValueChange={setProto}><SelectTrigger className="h-9 mt-1"><SelectValue/></SelectTrigger>
              <SelectContent>{["HTTP","HTTPS","TCP"].map(p=><SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
          <div><Label className="text-[13px] font-bold">Port</Label><Input type="number" value={port} onChange={e=>setPort(+e.target.value)} className="h-9 mt-1" /></div>
        </div>
        <div><Label className="text-[13px] font-bold">Endpoint (IP or domain)</Label><Input value={endpoint} onChange={e=>setEndpoint(e.target.value)} required className="h-9 mt-1" /></div>
        <div><Label className="text-[13px] font-bold">Path</Label><Input value={path} onChange={e=>setPath(e.target.value)} className="h-9 mt-1" /></div>
        <DialogFooter><Button type="submit" variant="aws" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin"/>} Create</Button></DialogFooter>
      </form>
    </DialogContent>
  );
}
