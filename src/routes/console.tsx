import { createFileRoute, redirect, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  Bell,
  HelpCircle,
  Search,
  Globe,
  LogOut,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { getMockSession, signOutMock, type MockSession } from "@/lib/mockAuth";

export const Route = createFileRoute("/console")({
  ssr: false,
  beforeLoad: ({ location }) => {
    if (!getMockSession()) {
      throw redirect({
        to: "/auth",
        search: { redirect: location.href },
      });
    }
  },
  component: ConsoleLayout,
});

function ConsoleLayout() {
  const navigate = useNavigate();
  const [session, setSession] = useState<MockSession | null>(null);

  useEffect(() => {
    const activeSession = getMockSession();
    setSession(activeSession);
    if (!activeSession) navigate({ to: "/auth", replace: true });
  }, [navigate]);

  function handleSignOut() {
    signOutMock();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  const email = session?.user?.email ?? "user@example.com";
  const accountId = (session?.user?.id ?? "000000000000").replace(/-/g, "").slice(0, 12);

  return (
    <div className="min-h-screen flex flex-col bg-aws-surface">
      {/* AWS top navigation */}
      <header className="h-10 bg-aws-nav text-aws-nav-foreground flex items-center px-3 text-[13px] gap-1 shrink-0">
        <Link to="/console/route53" className="px-2 py-1 hover:bg-aws-nav-hover rounded-sm font-bold tracking-tight">
          <span className="text-aws-orange">aws</span>
        </Link>

        <button className="flex items-center gap-1 px-2 py-1 hover:bg-aws-nav-hover rounded-sm">
          Services <ChevronDown className="h-3 w-3" />
        </button>

        <div className="hidden md:flex items-center bg-aws-nav-hover/60 rounded-sm px-2 ml-2 flex-1 max-w-md">
          <Search className="h-3.5 w-3.5 opacity-70" />
          <input
            placeholder="Search [Option+S]"
            className="bg-transparent text-[13px] px-2 py-1.5 outline-none w-full placeholder:text-white/60"
          />
        </div>

        <div className="flex-1 md:hidden" />

        <div className="flex items-center gap-1 ml-auto">
          <button className="p-1.5 hover:bg-aws-nav-hover rounded-sm" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </button>
          <button className="p-1.5 hover:bg-aws-nav-hover rounded-sm" aria-label="Help">
            <HelpCircle className="h-4 w-4" />
          </button>
          <button className="hidden md:flex items-center gap-1 px-2 py-1 hover:bg-aws-nav-hover rounded-sm">
            <Globe className="h-3.5 w-3.5" /> Global <ChevronDown className="h-3 w-3" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 px-2 py-1 hover:bg-aws-nav-hover rounded-sm">
              <div className="w-6 h-6 rounded-full bg-aws-orange text-white text-[11px] font-bold flex items-center justify-center">
                {email.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline max-w-[140px] truncate">{email}</span>
              <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-sm">
              <DropdownMenuLabel>
                <div className="text-[13px] font-semibold truncate">{email}</div>
                <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                  Account: {accountId}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-[13px]">Account</DropdownMenuItem>
              <DropdownMenuItem className="text-[13px]">Security credentials</DropdownMenuItem>
              <DropdownMenuItem className="text-[13px]">Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-[13px]" onClick={handleSignOut}>
                <LogOut className="h-3.5 w-3.5 mr-2" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <Route53Sidebar />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const NAV_ITEMS: { label: string; to?: string; badge?: string }[] = [
  { label: "Dashboard", to: "/console/route53" },
  { label: "Hosted zones", to: "/console/zones" },
  { label: "Health checks", to: "/console/health-checks" },
  { label: "Traffic policies", to: "/console/traffic-policies" },
  { label: "Policy records", badge: "Soon" },
  { label: "Domains", badge: "Soon" },
  { label: "Resolver", badge: "Soon" },
  { label: "Application Recovery Controller", badge: "Soon" },
  { label: "IP-based routing", badge: "Soon" },
  { label: "Profiles", badge: "Soon" },
];

function Route53Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="w-[260px] shrink-0 bg-aws-sidebar border-r border-aws-sidebar-border hidden lg:flex flex-col">
      <div className="px-4 py-3 border-b border-aws-sidebar-border">
        <div className="text-[13px] font-bold text-foreground">Route 53</div>
      </div>
      <nav className="py-2 text-[13px] flex-1 overflow-auto">
        {NAV_ITEMS.map((item) => {
          const active = item.to && (pathname === item.to || (item.to !== "/console/route53" && pathname.startsWith(item.to)));
          const inner = (
            <span className="flex items-center justify-between w-full">
              <span>{item.label}</span>
              {item.badge && (
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground border border-border rounded-sm px-1.5 py-px">
                  {item.badge}
                </span>
              )}
            </span>
          );
          const className = `block px-4 py-1.5 hover:bg-accent border-l-2 ${
            active
              ? "border-aws-orange bg-accent font-semibold text-foreground"
              : "border-transparent text-foreground/90"
          }`;
          return item.to ? (
            <Link key={item.label} to={item.to} className={className}>
              {inner}
            </Link>
          ) : (
            <div key={item.label} className={`${className} cursor-not-allowed opacity-70`}>
              {inner}
            </div>
          );
        })}
      </nav>
      <div className="p-3 border-t border-aws-sidebar-border text-[12px] text-muted-foreground">
        <a className="text-aws-link hover:underline cursor-pointer">What's new</a>
        <div className="mt-1">Documentation</div>
      </div>
    </aside>
  );
}
