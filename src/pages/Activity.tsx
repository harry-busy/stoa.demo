import { useQuery } from "@tanstack/react-query";
import { Activity as ActivityIcon, Zap, DollarSign, Users, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { useSEO } from "@/lib/seo";
import * as api from "@/lib/api";

interface ActivityEntry {
    id: string;
    serviceName: string;
    serviceId: string;
    callerAddress: string;
    costUsdc: number;
    latencyMs: number;
    success: boolean;
    txHash: string | null;
    basescanUrl: string | null;
    createdAt: string;
}

const Activity = () => {
    useSEO({
        title: "Live Activity — Stoa",
        description: "Real-time feed of AI agent calls, transactions, and platform activity on Stoa.",
    });

    const { data, isLoading, error } = useQuery({
        queryKey: ["activity-page"],
        queryFn: () => api.getActivity(),
        refetchInterval: 5000, // Auto-refresh every 5s
    });

    const { data: servicesData } = useQuery({
        queryKey: ["services"],
        queryFn: () => api.getServices(),
        staleTime: 30_000,
    });

    const activities: ActivityEntry[] = data?.activity ?? [];
    const serviceCount = servicesData?.services?.length ?? 0;

    // Summary stats
    const totalCalls = activities.length;
    const totalUsdc = activities.reduce((sum, a) => sum + (a.costUsdc || 0), 0);
    const successCount = activities.filter((a) => a.success).length;
    const uniqueCallers = new Set(activities.map((a) => a.callerAddress)).size;

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        const now = new Date();
        const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return d.toLocaleDateString();
    };

    return (
        <main className="min-h-screen bg-background pt-[72px]">
            <div className="mx-auto max-w-7xl px-6 py-12">
                {/* Header */}
                <ScrollReveal>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10">
                            <ActivityIcon className="h-5 w-5 text-primary" />
                        </div>
                        <h1 className="font-display text-display-sm font-bold text-foreground">
                            Live Activity
                        </h1>
                        <span className="relative flex h-3 w-3 ml-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                        </span>
                    </div>
                    <p className="font-body text-body-md text-muted-foreground mb-8">
                        Real-time feed of all agent calls across the Stoa marketplace. Auto-refreshes every 5 seconds.
                    </p>
                </ScrollReveal>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    {[
                        { label: "Total Calls", value: totalCalls, icon: Zap, color: "text-primary" },
                        { label: "USDC Transacted", value: `$${totalUsdc.toFixed(4)}`, icon: DollarSign, color: "text-green-500" },
                        { label: "Success Rate", value: totalCalls > 0 ? `${Math.round((successCount / totalCalls) * 100)}%` : "—", icon: CheckCircle, color: "text-blue-500" },
                        { label: "Unique Callers", value: uniqueCallers, icon: Users, color: "text-purple-500" },
                    ].map((stat) => (
                        <div key={stat.label} className="rounded-2xl border border-border bg-card p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                <span className="font-body text-caption text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                            </div>
                            <p className="font-display text-heading-md font-bold text-foreground">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Active Services Count */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="font-body text-heading-sm font-semibold text-foreground">
                        Recent Calls ({totalCalls})
                    </h2>
                    <span className="font-body text-caption text-muted-foreground">
                        {serviceCount} services active
                    </span>
                </div>

                {/* Activity Feed */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                ) : error ? (
                    <div className="text-center py-20">
                        <p className="font-body text-body-md text-muted-foreground">Failed to load activity data.</p>
                    </div>
                ) : activities.length === 0 ? (
                    <div className="text-center py-20">
                        <ActivityIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="font-body text-body-md text-muted-foreground">No activity yet. Be the first to call an agent!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {activities.map((entry, i) => (
                            <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className="flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 hover:border-primary/30 transition-colors"
                            >
                                {/* Status */}
                                <div className="flex-shrink-0">
                                    {entry.success ? (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <XCircle className="h-5 w-5 text-red-400" />
                                    )}
                                </div>

                                {/* Service Name */}
                                <div className="flex-1 min-w-0">
                                    <Link
                                        to={`/explore/${entry.serviceId}`}
                                        className="font-body text-body-sm font-medium text-foreground hover:text-primary transition-colors truncate block"
                                    >
                                        {entry.serviceName || "Unknown Agent"}
                                    </Link>
                                    <p className="font-mono text-caption text-muted-foreground truncate">
                                        {entry.callerAddress === "free" ? "Free call" : `${entry.callerAddress.slice(0, 6)}...${entry.callerAddress.slice(-4)}`}
                                    </p>
                                </div>

                                {/* Latency */}
                                <span className="hidden md:inline font-mono text-caption text-muted-foreground">
                                    {entry.latencyMs}ms
                                </span>

                                {/* Cost */}
                                <span className="font-mono text-body-sm font-medium text-foreground min-w-[70px] text-right">
                                    {entry.costUsdc > 0 ? `$${entry.costUsdc.toFixed(4)}` : "Free"}
                                </span>

                                {/* TX Link */}
                                {entry.basescanUrl ? (
                                    <a
                                        href={entry.basescanUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                ) : (
                                    <div className="w-4" />
                                )}

                                {/* Time */}
                                <span className="font-body text-caption text-muted-foreground min-w-[60px] text-right">
                                    {formatTime(entry.createdAt)}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
};

export default Activity;
