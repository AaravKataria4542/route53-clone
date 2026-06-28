import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Globe,
  Activity,
  Route as RouteIcon,
  Server,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getResourceCounts } from "@/lib/route53Store";

export const Route = createFileRoute("/console/route53")({
  head: () => ({
    meta: [
      { title: "Route 53 Dashboard" },
      { name: "description", content: "Amazon Route 53 management console." },
    ],
  }),
  component: Route53Dashboard,
});

function Route53Dashboard() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ zones: 0, records: 0, hc: 0 });
  useEffect(() => {
    setCounts(getResourceCounts());
  }, []);

  return (
    <div className="px-8 py-6 max-w-[1400px] mx-auto">
      <nav className="text-[13px] text-muted-foreground mb-3 flex items-center gap-1.5">
        <Link to="/console/route53" className="text-aws-link hover:underline">Route 53</Link>
        <span>›</span><span>Dashboard</span>
      </nav>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-bold leading-tight text-foreground">Route 53</h1>
          <p className="text-[14px] text-muted-foreground mt-1 max-w-2xl">
            A reliable and cost-effective way to route end users to internet applications by translating
            names like www.example.com into the numeric IP addresses that computers use to connect to each other.
          </p>
        </div>
      </div>

      <section className="bg-aws-panel border border-border rounded-sm">
        <header className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-[16px] font-bold">Get started</h2>
          <Button variant="aws" className="h-8" onClick={() => navigate({ to: "/console/zones" })}>Create hosted zone</Button>
        </header>
        <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
          <GetStartedCard icon={<Globe className="h-5 w-5" />} title="Register domain" body="Register a new domain or transfer an existing one to Route 53." cta="Register" />
          <GetStartedCard icon={<Server className="h-5 w-5" />} title="Create hosted zone" body="A hosted zone is a container for records that define how to route traffic for a domain." cta="Create hosted zone" onClick={() => navigate({ to: "/console/zones" })} />
          <GetStartedCard icon={<Activity className="h-5 w-5" />} title="Configure health check" body="Monitor the health of your endpoints and route traffic away from unhealthy resources." cta="Create health check" onClick={() => navigate({ to: "/console/health-checks" })} />
        </div>
      </section>

      <section className="mt-6 grid lg:grid-cols-2 gap-4">
        <ResourcePanel title="Hosted zones" count={String(counts.zones)} description="DNS records grouped by domain." icon={<Server className="h-4 w-4" />} onClick={() => navigate({ to: "/console/zones" })} />
        <ResourcePanel title="DNS records" count={String(counts.records)} description="Across all hosted zones." icon={<RouteIcon className="h-4 w-4" />} />
        <ResourcePanel title="Health checks" count={String(counts.hc)} description="Monitor endpoints and DNS failover." icon={<Activity className="h-4 w-4" />} onClick={() => navigate({ to: "/console/health-checks" })} />
        <ResourcePanel title="Traffic policies" count="0" description="Reusable DNS routing configurations." icon={<ShieldCheck className="h-4 w-4" />} onClick={() => navigate({ to: "/console/traffic-policies" })} />
      </section>

      {/* What's new */}
      <section className="mt-6 bg-aws-panel border border-border rounded-sm">
        <header className="px-5 py-3 border-b border-border">
          <h2 className="text-[16px] font-bold">What's new</h2>
        </header>
        <ul className="px-5 py-4 text-[13px] space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-muted-foreground tabular-nums mt-px">Jun 27, 2026</span>
            <a className="text-aws-link hover:underline cursor-pointer inline-flex items-center gap-1">
              Authentication is live — sign in to manage your zones
              <ExternalLink className="h-3 w-3" />
            </a>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-muted-foreground tabular-nums mt-px">Coming soon</span>
            <span>Hosted zones and DNS record management</span>
          </li>
        </ul>
      </section>
    </div>
  );
}

function GetStartedCard({ icon, title, body, cta, onClick }: { icon: React.ReactNode; title: string; body: string; cta: string; onClick?: () => void }) {
  return (
    <div className="p-5 flex flex-col">
      <div className="flex items-center gap-2 text-foreground">
        <span className="text-aws-orange">{icon}</span>
        <h3 className="font-bold text-[14px]">{title}</h3>
      </div>
      <p className="text-[13px] text-muted-foreground mt-2 flex-1">{body}</p>
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        className="text-[13px] text-aws-link hover:underline mt-3 self-start disabled:opacity-60 disabled:no-underline"
      >
        {cta} →
      </button>
    </div>
  );
}

function ResourcePanel({ title, count, description, icon, onClick }: { title: string; count: string; description: string; icon: React.ReactNode; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} disabled={!onClick} className="bg-aws-panel border border-border rounded-sm p-5 text-left hover:border-aws-link disabled:hover:border-border transition-colors">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-bold flex items-center gap-2">
          <span className="text-muted-foreground">{icon}</span>
          {onClick ? <span className="text-aws-link hover:underline">{title}</span> : title}
        </h3>
        <span className="text-[18px] font-bold tabular-nums">{count}</span>
      </div>
      <p className="text-[13px] text-muted-foreground mt-2">{description}</p>
    </button>
  );
}
