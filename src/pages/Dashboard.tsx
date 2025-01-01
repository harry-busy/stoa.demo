import { useState } from "react";
import { Link, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { LayoutDashboard, Wallet, Key, BarChart3, Settings, ChevronLeft, DollarSign, Zap, Bot, Clock } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/StatCard";
import { CopyButton } from "@/components/CopyButton";
import { Spinner } from "@/components/Spinner";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useSEO } from "@/lib/seo";
import { useAuth } from "@/lib/auth-context";
import * as api from "@/lib/api";

const NAV = [
  { label: "Overview", path: "/dashboard", icon: LayoutDashboard },
  { label: "Wallet", path: "/dashboard/wallet", icon: Wallet },
  { label: "API Keys", path: "/dashboard/api-keys", icon: Key },
  { label: "Usage", path: "/dashboard/usage", icon: BarChart3 },
];

const USAGE_DATA = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`,
  calls: Math.floor(50 + Math.random() * 200),
  revenue: parseFloat((Math.random() * 5).toFixed(2)),
}));

const ACTIVITY = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  time: `${2 + i * 3} min ago`,
  agent: ["Chest X-Ray", "Sentiment", "Plant ID", "Deepfake", "Summarizer"][i % 5],
  caller: `0x${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`,
  amount: [0.05, 0.01, 0.02, 0.03, 0.02][i % 5],
  status: i < 8 ? "success" : "pending",
}));

const MOCK_KEYS = [
  { name: "Production", key: "sk-prod...a3f2", created: "2025-01-15", lastUsed: "2 hours ago", active: true },
  { name: "Development", key: "sk-dev...b7c1", created: "2025-02-01", lastUsed: "5 days ago", active: true },
];

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background pt-[72px] flex">
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-border bg-card transition-all duration-300",
          collapsed ? "w-16" : "w-60"
        )}
        aria-label="Dashboard navigation"
      >
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              aria-current={location.pathname === item.path ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 font-body text-body-sm transition-colors",
                location.pathname === item.path
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-3 border-t border-border text-muted-foreground hover:text-foreground"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft className={cn("h-5 w-5 transition-transform", collapsed && "rotate-180")} />
        </button>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[var(--z-sticky)] bg-card border-t border-border flex" aria-label="Dashboard navigation">
        {NAV.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-3",
              location.pathname === item.path ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px]">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Main */}
      <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="p-6 md:p-10 max-w-6xl">
          {children}
        </div>
      </div>
    </div>
  );
}

function Overview() {
  const { user } = useAuth();

  const { data: statsData } = useQuery({
    queryKey: ["providerStats", user?.id],
    queryFn: () => api.getProviderStats(user?.id),
    enabled: !!user?.id,
  });

  const { data: activityData } = useQuery({
    queryKey: ["activity"],
    queryFn: () => api.getActivity(),
  });

  const stats = statsData?.stats;
  const activity = activityData?.activity ?? ACTIVITY;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-heading-lg font-bold text-foreground">
          Good morning{user?.name ? `, ${user.name}` : ""}.
        </h1>
        <p className="font-body text-body-sm text-muted-foreground mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={DollarSign} label="Total Earnings" value={stats?.totalEarnings ? `$${stats.totalEarnings}` : "$0.00"} change="+23%" changeType="positive" />
        <StatCard icon={Zap} label="Total Calls" value={stats?.totalCalls?.toLocaleString() ?? "0"} change="+12%" changeType="positive" />
        <StatCard icon={Bot} label="Active Agents" value={String(stats?.activeAgents ?? 0)} />
        <StatCard icon={Clock} label="Avg Response" value={stats?.avgResponse ?? "—"} change="-8%" changeType="positive" />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-body text-heading-sm font-semibold mb-4">Usage (30 days)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={USAGE_DATA}>
            <defs>
              <linearGradient id="gradCalls" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(70 47% 54%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(70 47% 54%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" hide />
            <YAxis hide />
            <Tooltip />
            <Area type="monotone" dataKey="calls" stroke="hsl(70 47% 54%)" fill="url(#gradCalls)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="font-body text-heading-sm font-semibold">Recent Activity</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr className="font-body text-caption text-muted-foreground">
                <th className="text-left p-3">Time</th><th className="text-left p-3">Agent</th>
                <th className="text-left p-3">Caller</th><th className="text-left p-3">Amount</th>
                <th className="text-left p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {activity.map((a: any, i: number) => (
                <tr key={a.id ?? i} className="border-t border-border font-body text-body-sm">
                  <td className="p-3 text-muted-foreground">{a.time || a.timestamp || "—"}</td>
                  <td className="p-3">{a.agent || a.serviceName || "—"}</td>
                  <td className="p-3 font-mono text-caption">{a.caller || a.walletAddress || "—"}</td>
                  <td className="p-3 font-mono text-primary">{(a.amount ?? 0).toFixed(2)} USDC</td>
                  <td className="p-3">
                    <span className={cn(
                      "rounded-pill px-2 py-0.5 text-caption font-medium",
                      (a.status || "success") === "success" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                    )}>{a.status || "success"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function WalletPage() {
  const { data: balanceData } = useQuery({
    queryKey: ["walletBalance"],
    queryFn: () => api.getWalletBalance(),
  });

  const { data: txData } = useQuery({
    queryKey: ["walletTransactions"],
    queryFn: () => api.getWalletTransactions(),
  });

  const balance = balanceData?.balance ?? 0;
  const walletAddress = balanceData?.address;
  const transactions = txData?.transactions;

  const [showAction, setShowAction] = useState<string | null>(null);
  const [amount, setAmount] = useState("");

  const handleAction = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: "Invalid amount", description: "Please enter a valid amount." });
      return;
    }
    toast({
      title: showAction === "Add Funds" ? "Funds added" : "Withdrawal initiated",
      description: `${parseFloat(amount).toFixed(2)} USDC ${showAction === "Add Funds" ? "added to" : "withdrawn from"} your wallet.`,
    });
    setAmount("");
    setShowAction(null);
  };

  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <p className="font-display text-display-sm font-bold">${balance.toFixed(2)} USDC</p>
        <p className="font-body text-body-sm text-muted-foreground mt-1">on Base Sepolia</p>
        {walletAddress && (
          <p className="font-mono text-caption text-muted-foreground mt-1">{walletAddress}</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {["Add Funds", "Withdraw", "History"].map((action) => (
          <div
            key={action}
            onClick={() => {
              if (action === "History") {
                toast({ title: "Transaction history", description: "Showing last 30 days of transactions." });
              } else {
                setShowAction(action);
              }
            }}
            className={cn(
              "rounded-2xl border bg-card p-6 text-center hover:shadow-lg transition cursor-pointer",
              showAction === action ? "border-primary" : "border-border"
            )}
          >
            <p className="font-body text-body-md font-semibold">{action}</p>
          </div>
        ))}
      </div>

      {showAction && (
        <div className="rounded-2xl border border-primary/30 bg-primary/[0.03] p-6 space-y-4">
          <h3 className="font-body text-heading-sm font-semibold">{showAction}</h3>
          <div className="flex gap-3">
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Amount (USDC)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1"
            />
            <Button variant="default" onClick={handleAction}>
              {showAction === "Add Funds" ? "Add" : "Withdraw"}
            </Button>
            <Button variant="ghost" onClick={() => setShowAction(null)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Transaction history */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-body text-heading-sm font-semibold">Recent Transactions</h3>
        </div>
        <div className="divide-y divide-border">
          {(transactions ?? [
            { type: "Deposit", amount: "+5.00", time: "2 hours ago" },
            { type: "Agent Call", amount: "-0.05", time: "3 hours ago" },
            { type: "Agent Call", amount: "-0.02", time: "5 hours ago" },
            { type: "Deposit", amount: "+10.00", time: "1 day ago" },
            { type: "Agent Call", amount: "-0.03", time: "1 day ago" },
          ]).map((tx: any, i: number) => {
            const amountStr = typeof tx.amount === "string" ? tx.amount : (tx.amount >= 0 ? `+${tx.amount.toFixed(2)}` : tx.amount.toFixed(2));
            return (
              <div key={i} className="flex items-center justify-between p-4 font-body text-body-sm">
                <span className="text-muted-foreground">{tx.type}</span>
                <span className={amountStr.startsWith("+") ? "text-primary font-mono" : "text-foreground font-mono"}>{amountStr} USDC</span>
                <span className="text-muted-foreground text-caption">{tx.time || tx.timestamp || "—"}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ApiKeysPage() {
  const [keys, setKeys] = useState(MOCK_KEYS);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-heading-lg font-bold">API Keys</h2>
        <Button variant="default" onClick={() => toast({ title: "Key generated", description: "sk-new...x7y8 — Copy it now, it won't be shown again." })}>
          Generate New Key
        </Button>
      </div>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr className="font-body text-caption text-muted-foreground">
              <th className="text-left p-3">Name</th><th className="text-left p-3">Key</th>
              <th className="text-left p-3">Created</th><th className="text-left p-3">Last Used</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k.name} className="border-t border-border font-body text-body-sm">
                <td className="p-3 font-medium">{k.name}</td>
                <td className="p-3 font-mono text-caption flex items-center gap-1">{k.key} <CopyButton text={k.key} /></td>
                <td className="p-3 text-muted-foreground">{k.created}</td>
                <td className="p-3 text-muted-foreground">{k.lastUsed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UsagePage() {
  const { data: usageData } = useQuery({
    queryKey: ["walletUsage"],
    queryFn: () => api.getWalletUsage(),
  });

  const chartData = usageData?.usage ?? USAGE_DATA;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-heading-lg font-bold">Usage</h2>
        <Button variant="outline" size="sm" onClick={() => toast({ title: "Export started" })}>
          Export CSV
        </Button>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6">
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="gradUsage" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(70 47% 54%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(70 47% 54%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="calls" stroke="hsl(70 47% 54%)" fill="url(#gradUsage)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const Dashboard = () => {
  const { isAuthenticated, isLoading } = useAuth();
  useSEO({ title: "Dashboard — Stoa", description: "Manage your AI agents, wallet, API keys, and usage analytics." });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background pt-[72px]">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="wallet" element={<WalletPage />} />
        <Route path="api-keys" element={<ApiKeysPage />} />
        <Route path="usage" element={<UsagePage />} />
      </Routes>
    </DashboardLayout>
  );
};

export default Dashboard;
