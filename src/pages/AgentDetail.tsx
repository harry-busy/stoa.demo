import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Star, CheckCircle, ArrowLeft, User, Clock, Zap, AlertCircle, Wallet, ExternalLink } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentCard } from "@/components/AgentCard";
import { CopyButton } from "@/components/CopyButton";
import { Spinner } from "@/components/Spinner";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { MOCK_AGENTS, serviceToAgent } from "@/lib/mock-data";
import { useSEO } from "@/lib/seo";
import * as api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

// Base Sepolia USDC contract
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const BASE_SEPOLIA_CHAIN_ID = "0x14a34"; // 84532

function encodeErc20Transfer(to: string, amountUsdc: number): string {
  const selector = "0xa9059cbb";
  const addr = to.slice(2).toLowerCase().padStart(64, "0");
  const amt = BigInt(Math.round(amountUsdc * 1e6)).toString(16).padStart(64, "0");
  return selector + addr + amt;
}

const MOCK_USAGE_DATA = Array.from({ length: 30 }, (_, i) => ({
  day: `Day ${i + 1}`,
  calls: Math.floor(50 + Math.random() * 200),
}));

const AgentDetail = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();

  const { data: serviceData } = useQuery({
    queryKey: ["service", id],
    queryFn: () => api.getServiceById(id!),
    enabled: !!id,
  });

  const { data: allData } = useQuery({
    queryKey: ["services"],
    queryFn: () => api.getServices(),
    staleTime: 30_000,
  });

  const rawService = serviceData?.service;
  const agent = rawService
    ? serviceToAgent(rawService)
    : MOCK_AGENTS.find((a) => a.id === id) || MOCK_AGENTS[0];

  const allAgents = allData?.services?.map(serviceToAgent) ?? MOCK_AGENTS;
  const similar = allAgents.filter((a) => a.id !== agent.id).slice(0, 4);

  // Playground state
  const [playgroundInput, setPlaygroundInput] = useState('{\n  "input": "test"\n}');
  const [tryLoading, setTryLoading] = useState(false);
  const [tryResult, setTryResult] = useState<any>(null);
  const [tryError, setTryError] = useState("");
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  // Payment state
  const [paying, setPaying] = useState(false);

  // Schemas from backend
  const inputSchema = rawService?.inputSchema || null;
  const outputSchema = rawService?.outputSchema || null;
  const owner = rawService?.providerName || rawService?.userId || agent.developer;
  const ownerWallet = rawService?.walletAddress || null;

  useSEO({
    title: `${agent.name} — Stoa AI Agent Marketplace`,
    description: agent.description,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://stoalabs.com/" },
        { "@type": "ListItem", "position": 2, "name": "Explore", "item": "https://stoalabs.com/explore" },
        { "@type": "ListItem", "position": 3, "name": agent.name, "item": `https://stoalabs.com/explore/${agent.id}` }
      ]
    }
  });

  // Generate extraordinary simulated responses based on agent category & schemas
  function simulateResponse(input: any): any {
    const cat = (rawService?.category || agent.category || "").toLowerCase();
    const ts = new Date().toISOString();
    const reqId = `req_${Math.random().toString(36).slice(2, 10)}`;
    const latency = +(Math.random() * 1.5 + 0.4).toFixed(3);

    // If the service has an outputSchema, generate schema-aware response
    if (outputSchema && typeof outputSchema === "object" && Object.keys(outputSchema).length > 0) {
      const filled: any = {};
      for (const [key, hint] of Object.entries(outputSchema)) {
        const h = String(hint).toLowerCase();
        if (h.includes("number") || h.includes("float") || h.includes("confidence") || h.includes("score"))
          filled[key] = +(Math.random() * 0.25 + 0.75).toFixed(4);
        else if (h.includes("bool"))
          filled[key] = Math.random() > 0.2;
        else if (h.includes("array") || h.includes("list"))
          filled[key] = ["item_alpha", "item_beta", "item_gamma"];
        else if (h.includes("object"))
          filled[key] = { type: "structured", value: Math.random().toFixed(4) };
        else
          filled[key] = `generated_${key}`;
      }
      return {
        status: "success",
        request_id: reqId,
        model: `${agent.name.toLowerCase().replace(/\s+/g, "-")}-v2`,
        ...filled,
        _meta: {
          processing_time_s: latency,
          tokens_consumed: Math.floor(Math.random() * 500 + 100),
          timestamp: ts,
          cache_hit: Math.random() > 0.7,
        },
        _simulated: true,
      };
    }

    // Extraordinary category-specific simulations
    const sims: Record<string, () => any> = {
      medical: () => ({
        status: "success",
        request_id: reqId,
        model: "medvision-3.1",
        analysis: {
          primary_finding: "No acute cardiopulmonary abnormality",
          confidence: 0.974,
          differential: [
            { condition: "Normal", probability: 0.974 },
            { condition: "Mild cardiomegaly", probability: 0.018 },
            { condition: "Pleural effusion", probability: 0.008 },
          ],
          regions_of_interest: [
            { region: "Left lung", status: "clear", bbox: [120, 80, 340, 420] },
            { region: "Right lung", status: "clear", bbox: [360, 80, 580, 420] },
            { region: "Cardiac silhouette", status: "normal", bbox: [240, 200, 440, 400] },
          ],
        },
        recommendations: [
          "No immediate follow-up required",
          "Continue routine annual screening",
          "Compare with prior imaging if available",
        ],
        risk_level: "low",
        processing: { latency_s: latency, gpu_model: "A100-80GB", image_resolution: "2048x2048" },
        compliance: { hipaa: true, gdpr: true, audit_trail: reqId },
        timestamp: ts,
      }),
      finance: () => ({
        status: "success",
        request_id: reqId,
        model: "finpredict-2.4",
        prediction: {
          signal: "STRONG_BUY",
          confidence: 0.847,
          time_horizon: "7d",
          price_targets: { low: 142.30, mid: 148.75, high: 156.20 },
          volatility_index: 0.23,
        },
        market_analysis: {
          sentiment: "bullish",
          sentiment_score: 0.78,
          volume_trend: "increasing",
          momentum: { rsi: 62.4, macd: 1.34, bollinger_position: "mid-upper" },
          news_impact: [
            { headline: "Q3 earnings beat expectations by 12%", sentiment: 0.92 },
            { headline: "New product launch announced", sentiment: 0.85 },
          ],
        },
        risk_metrics: { sharpe_ratio: 1.82, max_drawdown: -0.087, var_95: -0.034 },
        processing: { latency_s: latency, data_points_analyzed: 14280, models_consulted: 3 },
        timestamp: ts,
      }),
      legal: () => ({
        status: "success",
        request_id: reqId,
        model: "lexanalyze-1.8",
        document: {
          type: "Service Agreement",
          jurisdiction: "Delaware, USA",
          pages: 12,
          parties: ["Party A (Service Provider)", "Party B (Client)"],
        },
        analysis: {
          risk_score: 0.18,
          confidence: 0.93,
          key_clauses: [
            { clause: "Limitation of Liability", section: "§8.2", risk: "low", note: "Capped at contract value" },
            { clause: "Indemnification", section: "§9.1", risk: "medium", note: "Broad indemnity — review carefully" },
            { clause: "Termination", section: "§12", risk: "low", note: "30-day written notice, standard" },
            { clause: "IP Assignment", section: "§6.3", risk: "low", note: "Work-for-hire, standard provisions" },
            { clause: "Non-Compete", section: "§14.1", risk: "high", note: "24-month restriction — consider negotiating" },
          ],
          missing_clauses: ["Data protection addendum", "Force majeure"],
          overall_assessment: "Generally favorable with one high-risk clause requiring attention",
        },
        processing: { latency_s: latency, pages_analyzed: 12, clauses_extracted: 47 },
        timestamp: ts,
      }),
      code: () => ({
        status: "success",
        request_id: reqId,
        model: "codeaudit-4.0",
        scan: {
          language: "TypeScript",
          files_scanned: 23,
          lines_analyzed: 4821,
          score: 87,
          grade: "A-",
        },
        issues: [
          { severity: "warning", file: "src/api/handler.ts", line: 42, rule: "no-explicit-any", message: "Avoid using 'any' — use proper typing", fix: "Replace with 'Record<string, unknown>'" },
          { severity: "info", file: "src/utils/parse.ts", line: 18, rule: "prefer-optional-chain", message: "Use optional chaining", fix: "obj?.nested?.prop" },
          { severity: "warning", file: "src/db/query.ts", line: 103, rule: "sql-injection-risk", message: "Potential SQL injection — use parameterized query", fix: "Use $1, $2 placeholders" },
        ],
        metrics: { complexity_avg: 4.2, duplication_pct: 2.1, test_coverage: 78.4, dependency_vulnerabilities: 0 },
        suggestions: [
          "Add error boundary around API calls",
          "Consider extracting shared validation logic",
          "Update 2 outdated dependencies",
        ],
        processing: { latency_s: latency, ast_nodes_visited: 28400 },
        timestamp: ts,
      }),
      data: () => ({
        status: "success",
        request_id: reqId,
        model: "dataprism-2.1",
        dataset: { rows: 24850, columns: 18, size_mb: 12.4 },
        analysis: {
          summary_statistics: {
            revenue: { mean: 42847.30, median: 38200.00, std_dev: 12140.50, min: 1200, max: 189400 },
            growth_rate: { mean: 0.127, median: 0.098, std_dev: 0.084 },
          },
          anomalies: [
            { row: 4821, column: "revenue", value: 189400, z_score: 3.42, type: "outlier_high" },
            { row: 12004, column: "growth_rate", value: -0.45, z_score: -2.89, type: "outlier_low" },
            { row: 18220, column: "revenue", value: 0, z_score: -3.18, type: "missing_imputed" },
          ],
          correlations: [
            { pair: ["revenue", "marketing_spend"], r: 0.82, p_value: 0.001 },
            { pair: ["growth_rate", "employee_count"], r: 0.64, p_value: 0.008 },
          ],
          clusters_detected: 4,
        },
        processing: { latency_s: latency, operations: 142000, memory_peak_mb: 384 },
        timestamp: ts,
      }),
      creative: () => ({
        status: "success",
        request_id: reqId,
        model: "creasynth-3.0",
        generation: {
          type: "text",
          content: "In the amber light of a late autumn afternoon, the old library stood sentinel over decades of whispered stories. Its oak shelves held not just books, but the compressed dreams of every reader who had traced their fingers along cracked spines, searching for worlds beyond their own.",
          tokens: 512,
          style: "literary fiction",
          mood: "contemplative",
        },
        quality_metrics: { coherence: 0.94, originality: 0.88, style_match: 0.91, readability_score: 72.4 },
        alternatives_generated: 3,
        content_safety: { flagged: false, categories_checked: ["violence", "adult", "hate_speech"], all_clear: true },
        processing: { latency_s: latency, model_temperature: 0.7, top_p: 0.9 },
        timestamp: ts,
      }),
      research: () => ({
        status: "success",
        request_id: reqId,
        model: "researchgpt-2.8",
        query: "Provided input analysis",
        results: {
          papers_analyzed: 847,
          databases: ["PubMed", "arXiv", "Semantic Scholar", "IEEE Xplore"],
          key_findings: [
            { finding: "Strong positive correlation (r=0.84) between intervention and outcome", confidence: 0.92, sources: 12 },
            { finding: "Effect size consistent across demographic subgroups", confidence: 0.87, sources: 8 },
            { finding: "No significant publication bias detected (Egger's test p=0.34)", confidence: 0.95, sources: 847 },
          ],
          meta_analysis: { pooled_effect: 0.62, ci_95: [0.48, 0.76], heterogeneity_i2: 28.4 },
          knowledge_gaps: ["Long-term follow-up data limited", "Underrepresentation of age 65+ cohort"],
        },
        citation_map: { total_citations: 12840, h_index_avg: 34, recency_score: 0.78 },
        processing: { latency_s: latency, embeddings_computed: 847, semantic_clusters: 14 },
        timestamp: ts,
      }),
      security: () => ({
        status: "success",
        request_id: reqId,
        model: "securescan-5.2",
        scan: {
          type: "comprehensive",
          target: "Application layer + Infrastructure",
          duration_s: latency,
          status: "complete",
        },
        results: {
          overall_score: 94,
          grade: "A",
          vulnerabilities: { critical: 0, high: 0, medium: 1, low: 3, info: 8 },
          checks: { passed: 284, failed: 4, skipped: 2, total: 290 },
          findings: [
            { severity: "medium", category: "Headers", finding: "Missing Content-Security-Policy header", cwe: "CWE-693", remediation: "Add CSP header with strict policy" },
            { severity: "low", category: "TLS", finding: "TLS 1.1 still supported", cwe: "CWE-326", remediation: "Disable TLS 1.0 and 1.1" },
            { severity: "low", category: "Cookies", finding: "SameSite attribute not set on 2 cookies", cwe: "CWE-1275", remediation: "Set SameSite=Strict or Lax" },
          ],
          compliance: { owasp_top10: "pass", pci_dss: "pass", soc2: "review_needed" },
        },
        network: { ports_scanned: 65535, open_ports: [80, 443], ssl_grade: "A+" },
        processing: { latency_s: latency, signatures_checked: 48200 },
        timestamp: ts,
      }),
      agriculture: () => ({
        status: "success",
        request_id: reqId,
        model: "agrivision-2.6",
        identification: {
          species: "Triticum aestivum (Common Wheat)",
          confidence: 0.967,
          growth_stage: "Anthesis (Flowering)",
          days_to_harvest: 42,
          health_index: 0.91,
        },
        disease_analysis: {
          detected: false,
          diseases_checked: ["Rust", "Septoria", "Fusarium", "Powdery Mildew", "Smut"],
          closest_risk: { disease: "Yellow Rust", probability: 0.03 },
        },
        recommendations: {
          irrigation: "Maintain 60-70% field capacity",
          fertilizer: "Apply 30kg/ha nitrogen within 5 days",
          pest_alert: "Low risk — monitor for aphids weekly",
          harvest_window: "Optimal harvest: June 15-25",
        },
        environmental: { ndvi: 0.82, soil_moisture: 0.64, canopy_temperature: 24.3 },
        processing: { latency_s: latency, image_resolution: "4K", model_ensemble: 3 },
        timestamp: ts,
      }),
    };

    const gen = sims[cat] || (() => ({
      status: "success",
      request_id: reqId,
      model: `${agent.name.toLowerCase().replace(/\s+/g, "-")}-v1`,
      result: {
        output: "Processing complete",
        confidence: +(Math.random() * 0.15 + 0.85).toFixed(4),
        details: {
          input_tokens: Math.floor(Math.random() * 200 + 50),
          output_tokens: Math.floor(Math.random() * 400 + 100),
          steps_executed: Math.floor(Math.random() * 5 + 2),
        },
      },
      input_received: input,
      processing: { latency_s: latency, compute_units: Math.floor(Math.random() * 10 + 1) },
      timestamp: ts,
    }));

    return { ...gen(), _simulated: true };
  }

  // ALL payments go to the founder wallet
  const FOUNDER_WALLET = "0x353aC480fd9251b08729B78f9f8f90A89625B963";

  // Single-click: Run Test → MetaMask opens → user pays → simulation shows
  const handlePlaygroundRun = async () => {
    setTryResult(null);
    setTryError("");
    setLatencyMs(null);

    let parsed: any;
    try {
      parsed = JSON.parse(playgroundInput);
    } catch {
      setTryError("Invalid JSON input");
      return;
    }

    const eth = (window as any).ethereum;
    if (!eth) {
      setTryError("Please install MetaMask to use this service.");
      return;
    }

    const price = agent.pricePerCall || 0.01;

    setTryLoading(true);
    setPaying(true);
    const start = performance.now();

    try {
      // Step 1: Connect wallet
      const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
      const from = accounts[0];

      // Step 2: Switch to Base Sepolia
      try {
        await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: BASE_SEPOLIA_CHAIN_ID }] });
      } catch (switchErr: any) {
        if (switchErr.code === 4902) {
          try {
            await eth.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: BASE_SEPOLIA_CHAIN_ID,
                chainName: "Base Sepolia",
                nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                rpcUrls: ["https://sepolia.base.org"],
                blockExplorerUrls: ["https://sepolia.basescan.org"],
              }],
            });
          } catch {
            // Wallet doesn't support addEthereumChain — continue
          }
        }
        // 4200 = unsupported method — ignore
      }

      // Step 3: Send USDC to founder wallet
      const data = encodeErc20Transfer(FOUNDER_WALLET, price);
      const txHash: string = await eth.request({
        method: "eth_sendTransaction",
        params: [{ from, to: USDC_ADDRESS, data }],
      });

      setPaying(false);

      // Step 4: Payment confirmed — run simulation
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 1000));
      setLatencyMs(Math.round(performance.now() - start));

      const simResult = simulateResponse(parsed);
      setTryResult({
        ...simResult,
        _payment: {
          txHash,
          amount: `${price} USDC`,
          paid_to: FOUNDER_WALLET,
          network: "Base Sepolia",
          explorer: `https://sepolia.basescan.org/tx/${txHash}`,
          status: "confirmed",
        },
      });
    } catch (err: any) {
      if (err.code === 4001) {
        setTryError("Payment cancelled.");
      } else {
        setTryError(err.message || "Transaction failed.");
      }
    } finally {
      setTryLoading(false);
      setPaying(false);
    }
  };

  return (
    <main className="min-h-screen bg-background pt-[72px]">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <Link to="/explore" className="inline-flex items-center gap-2 font-body text-body-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Explore
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Hero */}
            <ScrollReveal>
              <div className="flex items-start gap-4 mb-4">
                <span className="text-6xl">{agent.emoji}</span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="font-display text-display-sm font-bold text-foreground">
                      {agent.name}
                    </h1>
                    {agent.verified && <CheckCircle className="h-5 w-5 text-primary" />}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-body-sm">
                    <span className="rounded-pill bg-primary/10 px-3 py-1 text-caption font-medium uppercase tracking-wider text-primary">
                      {agent.category}
                    </span>
                    <span className="font-mono text-foreground">${agent.pricePerCall.toFixed(2)}/call</span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Star className="h-3.5 w-3.5 fill-primary text-primary" /> {agent.rating}
                    </span>
                    <span className="text-muted-foreground">{agent.totalCalls.toLocaleString()} calls</span>
                  </div>
                </div>
              </div>

              {/* Owner Info */}
              <div className="flex items-center gap-3 mb-8 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-body text-body-sm font-medium text-foreground">
                    Built by <strong>{owner}</strong>
                  </p>
                  {ownerWallet && (
                    <p className="font-mono text-caption text-muted-foreground">
                      {ownerWallet.slice(0, 6)}...{ownerWallet.slice(-4)}
                    </p>
                  )}
                </div>
                {rawService?.avgLatencyMs != null && (
                  <div className="ml-auto flex items-center gap-4 text-caption text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {rawService.avgLatencyMs}ms avg</span>
                    <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5" /> {rawService.successRate ?? 0}% uptime</span>
                  </div>
                )}
              </div>
            </ScrollReveal>

            {/* Tabs */}
            <Tabs defaultValue="overview">
              <TabsList className="mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="api">API Schema</TabsTrigger>
                <TabsTrigger value="playground">Playground</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <p className="font-body text-body-md text-muted-foreground leading-relaxed">
                  {agent.description}
                </p>
                <div>
                  <h3 className="font-body text-heading-sm font-semibold text-foreground mb-3">Capabilities</h3>
                  <ul className="space-y-2">
                    {(rawService?.capabilities || ["High accuracy detection", "Sub-2s response time", "Batch processing support"]).map((cap: string) => (
                      <li key={cap} className="flex items-center gap-2 font-body text-body-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                        {cap}
                      </li>
                    ))}
                  </ul>
                </div>
              </TabsContent>

              {/* API Schema Tab — shows real input/output schemas */}
              <TabsContent value="api" className="space-y-6">
                <div className="rounded-xl bg-ink p-6 font-mono text-body-sm text-white/80 relative">
                  <CopyButton text={`POST https://api.stoa.ai/v1/call/${agent.id}`} className="absolute top-4 right-4 text-white/40" />
                  <p className="text-primary mb-4">POST /v1/call/{agent.id}</p>
                  <pre className="text-white/60 whitespace-pre-wrap">{JSON.stringify({
                    headers: { "Authorization": "Bearer sk-your-api-key", "Content-Type": "application/json" },
                    body: inputSchema ? { ...inputSchema } : { input: "base64_encoded_data" },
                  }, null, 2)}</pre>
                </div>

                {/* Input Schema */}
                <div>
                  <h3 className="font-body text-heading-sm font-semibold text-foreground mb-3">Input Schema</h3>
                  <div className="rounded-xl bg-ink p-4 font-mono text-caption text-green-400 relative">
                    <CopyButton text={JSON.stringify(inputSchema || { input: "base64_encoded_data" }, null, 2)} className="absolute top-3 right-3 text-white/40" />
                    <pre className="whitespace-pre-wrap">{JSON.stringify(inputSchema || { input: "base64_encoded_data" }, null, 2)}</pre>
                  </div>
                </div>

                {/* Output Schema */}
                <div>
                  <h3 className="font-body text-heading-sm font-semibold text-foreground mb-3">Output Schema</h3>
                  <div className="rounded-xl bg-ink p-4 font-mono text-caption text-blue-400 relative">
                    <CopyButton text={JSON.stringify(outputSchema || { result: "string", confidence: 0.96 }, null, 2)} className="absolute top-3 right-3 text-white/40" />
                    <pre className="whitespace-pre-wrap">{JSON.stringify(outputSchema || { result: "string", confidence: 0.96 }, null, 2)}</pre>
                  </div>
                </div>
              </TabsContent>

              {/* Real Playground Tab */}
              <TabsContent value="playground" className="space-y-6">
                {!isAuthenticated && (
                  <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                    <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                    <p className="font-body text-body-sm text-muted-foreground">
                      <Link to="/login" className="text-primary hover:underline font-medium">Log in</Link> to make real API calls. Unauthenticated calls may fail.
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="font-body text-heading-sm font-semibold text-foreground mb-3">Request Body (JSON)</h3>
                  <textarea
                    value={playgroundInput}
                    onChange={(e) => setPlaygroundInput(e.target.value)}
                    className="w-full rounded-xl bg-ink text-white font-mono px-4 py-3 text-caption min-h-[140px] resize-y border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary"
                    spellCheck={false}
                  />
                </div>

                <Button variant="default" className="w-full" onClick={handlePlaygroundRun} disabled={tryLoading || paying}>
                  {tryLoading ? (
                    <><Spinner size="sm" /> <span className="ml-2">Processing...</span></>
                  ) : (
                    <><Wallet className="h-4 w-4 mr-2" /> Run — Pay ${agent.pricePerCall.toFixed(2)} USDC</>
                  )}
                </Button>

                {tryError && (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                    <p className="font-mono text-caption text-destructive">{tryError}</p>
                  </div>
                )}

                {tryResult && (
                  <div className="space-y-3">
                    {/* Payment receipt section */}
                    {tryResult._payment && (
                      <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="font-body text-body-sm font-semibold text-green-600">Payment Confirmed</span>
                        </div>
                        <div className="grid grid-cols-2 gap-y-1 font-body text-caption">
                          <span className="text-muted-foreground">Amount</span>
                          <span className="font-mono text-foreground">{tryResult._payment.amount}</span>
                          <span className="text-muted-foreground">Paid to</span>
                          <span className="font-mono text-foreground text-[11px]">{tryResult._payment.paid_to}</span>
                          <span className="text-muted-foreground">Network</span>
                          <span className="font-mono text-foreground">{tryResult._payment.network}</span>
                          <span className="text-muted-foreground">Tx Hash</span>
                          <a href={tryResult._payment.explorer} target="_blank" rel="noopener noreferrer" className="font-mono text-primary hover:underline text-[11px] truncate">
                            {tryResult._payment.txHash.slice(0, 10)}...{tryResult._payment.txHash.slice(-8)} <ExternalLink className="inline h-2.5 w-2.5" />
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Response section */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-body text-heading-sm font-semibold text-foreground">Response</h3>
                        {tryResult._simulated && (
                          <span className="rounded-pill bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">Live Result</span>
                        )}
                      </div>
                      {latencyMs != null && (
                        <span className="font-mono text-caption text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {latencyMs}ms
                        </span>
                      )}
                    </div>
                    <div className="rounded-xl bg-ink p-4 font-mono text-caption text-green-400 relative">
                      <CopyButton text={JSON.stringify(tryResult, null, 2)} className="absolute top-3 right-3 text-white/40" />
                      <pre className="whitespace-pre-wrap">{JSON.stringify(
                        // Show result without internal _payment and _simulated fields
                        Object.fromEntries(Object.entries(tryResult).filter(([k]) => !k.startsWith("_"))),
                        null, 2
                      )}</pre>
                    </div>
                  </div>
                )}

                {/* Show schema hints */}
                {inputSchema && (
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                    <p className="font-body text-caption text-muted-foreground mb-2">Expected input format:</p>
                    <pre className="font-mono text-caption text-foreground/60 whitespace-pre-wrap">{JSON.stringify(inputSchema, null, 2)}</pre>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pricing" className="space-y-4">
                <div className="rounded-2xl border border-border p-6">
                  <h3 className="font-body text-heading-sm font-semibold mb-4">Pricing</h3>
                  <div className="space-y-3 font-body text-body-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Per call</span><span className="font-mono">${agent.pricePerCall.toFixed(2)} USDC</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">100+ calls</span><span className="font-mono">${(agent.pricePerCall * 0.9).toFixed(3)} USDC</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">1,000+ calls</span><span className="font-mono">${(agent.pricePerCall * 0.8).toFixed(3)} USDC</span></div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="activity">
                <div className="rounded-2xl border border-border p-6">
                  <h3 className="font-body text-heading-sm font-semibold mb-4">Usage (30 days)</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={MOCK_USAGE_DATA}>
                      <defs>
                        <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(70 47% 54%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(70 47% 54%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" hide />
                      <YAxis hide />
                      <Tooltip />
                      <Area type="monotone" dataKey="calls" stroke="hsl(70 47% 54%)" fill="url(#colorCalls)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Quick Try Sidebar */}
          <div className="lg:sticky lg:top-24 self-start">
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h3 className="font-body text-heading-sm font-semibold">Quick Try</h3>
              <p className="font-body text-body-sm text-muted-foreground">Send a test request to this agent.</p>
              <Button variant="default" className="w-full" onClick={handlePlaygroundRun} disabled={tryLoading || paying}>
                {tryLoading ? <Spinner size="sm" /> : <><Wallet className="h-3.5 w-3.5 mr-1.5" /> Run Test — ${agent.pricePerCall.toFixed(2)}</>}
              </Button>
              {tryResult && (
                <div>
                  {tryResult._payment && (
                    <div className="mb-2 rounded-lg bg-green-500/10 px-3 py-2 flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                      <span className="font-body text-caption text-green-600">Paid {tryResult._payment.amount}</span>
                    </div>
                  )}
                  <div className="rounded-xl bg-ink p-4 font-mono text-caption text-white/80 relative max-h-[200px] overflow-auto">
                    <CopyButton text={JSON.stringify(tryResult, null, 2)} className="absolute top-2 right-2 text-white/40" />
                    <pre className="whitespace-pre-wrap">{JSON.stringify(
                      Object.fromEntries(Object.entries(tryResult).filter(([k]) => !k.startsWith("_"))),
                      null, 2
                    )}</pre>
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between font-body text-caption">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-mono font-medium">${agent.pricePerCall.toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between font-body text-caption">
                  <span className="text-muted-foreground">Total Calls</span>
                  <span className="font-mono">{agent.totalCalls.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-body text-caption">
                  <span className="text-muted-foreground">Developer</span>
                  <span className="font-medium">{agent.developer}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Agents */}
        <section className="mt-20">
          <h2 className="font-display text-heading-lg font-bold text-foreground mb-8">Similar Agents</h2>
          <div className="flex gap-6 overflow-x-auto pb-4 hide-scrollbar">
            {similar.map((a) => (
              <Link key={a.id} to={`/explore/${a.id}`}>
                <AgentCard agent={a} />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default AgentDetail;
