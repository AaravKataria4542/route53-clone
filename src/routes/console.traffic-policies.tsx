import { createFileRoute, Link } from "@tanstack/react-router";
import { Route as RouteIcon, GitBranch, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/console/traffic-policies")({
  head: () => ({ meta: [{ title: "Traffic policies — Route 53" }] }),
  component: TrafficPolicies,
});

function TrafficPolicies() {
  return (
    <div className="px-8 py-6 max-w-[1400px] mx-auto">
      <nav className="text-[13px] text-muted-foreground mb-3"><Link to="/console/route53" className="text-aws-link hover:underline">Route 53</Link> › Traffic policies</nav>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[24px] font-bold">Traffic policies</h1>
        <Button variant="aws" className="h-8" disabled>Create traffic policy</Button>
      </div>

      <div className="bg-aws-panel border border-border rounded-sm p-8">
        <div className="max-w-2xl mx-auto text-center">
          <RouteIcon className="h-12 w-12 mx-auto text-aws-orange" />
          <h2 className="text-[18px] font-bold mt-3">Visual traffic flow editor</h2>
          <p className="text-[13px] text-muted-foreground mt-2">
            Design complex routing trees with weighted, latency, failover, and geolocation rules.
            The visual editor is coming soon.
          </p>
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <PolicyCard icon={<GitBranch className="h-5 w-5" />} title="Weighted routing" body="Distribute traffic across resources based on weights you assign." />
          <PolicyCard icon={<Globe2 className="h-5 w-5" />} title="Geolocation routing" body="Route users based on the geographic location of DNS queries." />
          <PolicyCard icon={<RouteIcon className="h-5 w-5" />} title="Failover routing" body="Configure active-passive failover with health checks." />
        </div>

        <div className="mt-8 border border-dashed border-border rounded-sm p-12">
          <svg viewBox="0 0 600 200" className="w-full h-48 text-muted-foreground/40">
            <rect x="20" y="80" width="100" height="40" rx="4" fill="none" stroke="currentColor" />
            <text x="70" y="105" textAnchor="middle" className="fill-current text-[12px]">Start</text>
            <line x1="120" y1="100" x2="200" y2="100" stroke="currentColor" />
            <polygon points="200,80 240,100 200,120" fill="none" stroke="currentColor" />
            <text x="220" y="105" textAnchor="middle" className="fill-current text-[10px]">Weighted</text>
            <line x1="240" y1="100" x2="320" y2="60" stroke="currentColor" />
            <line x1="240" y1="100" x2="320" y2="140" stroke="currentColor" />
            <rect x="320" y="40" width="120" height="40" rx="4" fill="none" stroke="currentColor" />
            <text x="380" y="65" textAnchor="middle" className="fill-current text-[11px]">us-east-1 A</text>
            <rect x="320" y="120" width="120" height="40" rx="4" fill="none" stroke="currentColor" />
            <text x="380" y="145" textAnchor="middle" className="fill-current text-[11px]">eu-west-1 A</text>
          </svg>
          <p className="text-center text-[12px] text-muted-foreground mt-2">Preview of the traffic flow visualization</p>
        </div>
      </div>
    </div>
  );
}

function PolicyCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="border border-border rounded-sm p-4">
      <div className="text-aws-orange">{icon}</div>
      <h3 className="font-bold text-[14px] mt-2">{title}</h3>
      <p className="text-[13px] text-muted-foreground mt-1">{body}</p>
    </div>
  );
}
