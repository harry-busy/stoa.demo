import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, CheckCircle2, Wallet, Sparkles, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/CopyButton";
import { AgentCard } from "@/components/AgentCard";
import { Spinner } from "@/components/Spinner";
import { MOCK_AGENTS } from "@/lib/mock-data";
import { toast } from "@/hooks/use-toast";
import { useSEO } from "@/lib/seo";
import { useAuth } from "@/lib/auth-context";
import { ConnectWalletButton } from "@/components/WalletModal";
import * as api from "@/lib/api";

/* ─── Animated Eye Components ─── */

interface PupilProps {
  size?: number;
  maxDistance?: number;
  pupilColor?: string;
  forceLookX?: number;
  forceLookY?: number;
}

const Pupil = ({ size = 12, maxDistance = 5, pupilColor = "black", forceLookX, forceLookY }: PupilProps) => {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { setMouseX(e.clientX); setMouseY(e.clientY); };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  const pos = (() => {
    if (!ref.current) return { x: 0, y: 0 };
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY };
    const r = ref.current.getBoundingClientRect();
    const dx = mouseX - (r.left + r.width / 2);
    const dy = mouseY - (r.top + r.height / 2);
    const d = Math.min(Math.sqrt(dx ** 2 + dy ** 2), maxDistance);
    const a = Math.atan2(dy, dx);
    return { x: Math.cos(a) * d, y: Math.sin(a) * d };
  })();

  return (
    <div ref={ref} className="rounded-full" style={{ width: size, height: size, backgroundColor: pupilColor, transform: `translate(${pos.x}px, ${pos.y}px)`, transition: "transform 0.1s ease-out" }} />
  );
};

interface EyeBallProps {
  size?: number; pupilSize?: number; maxDistance?: number; eyeColor?: string; pupilColor?: string; isBlinking?: boolean; forceLookX?: number; forceLookY?: number;
}

const EyeBall = ({ size = 48, pupilSize = 16, maxDistance = 10, eyeColor = "white", pupilColor = "black", isBlinking = false, forceLookX, forceLookY }: EyeBallProps) => {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { setMouseX(e.clientX); setMouseY(e.clientY); };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  const pos = (() => {
    if (!ref.current) return { x: 0, y: 0 };
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY };
    const r = ref.current.getBoundingClientRect();
    const dx = mouseX - (r.left + r.width / 2);
    const dy = mouseY - (r.top + r.height / 2);
    const d = Math.min(Math.sqrt(dx ** 2 + dy ** 2), maxDistance);
    const a = Math.atan2(dy, dx);
    return { x: Math.cos(a) * d, y: Math.sin(a) * d };
  })();

  return (
    <div ref={ref} className="rounded-full flex items-center justify-center transition-all duration-150" style={{ width: size, height: isBlinking ? 2 : size, backgroundColor: eyeColor, overflow: "hidden" }}>
      {!isBlinking && <div className="rounded-full" style={{ width: pupilSize, height: pupilSize, backgroundColor: pupilColor, transform: `translate(${pos.x}px, ${pos.y}px)`, transition: "transform 0.1s ease-out" }} />}
    </div>
  );
};

/* ─── Animated Characters Panel ─── */

function AnimatedCharactersPanel({ hiding = false }: { hiding?: boolean }) {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const purpleRef = useRef<HTMLDivElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const yellowRef = useRef<HTMLDivElement>(null);
  const orangeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { setMouseX(e.clientX); setMouseY(e.clientY); };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  useEffect(() => {
    const scheduleBlink = (setter: (v: boolean) => void): ReturnType<typeof setTimeout> => {
      const t = setTimeout(() => {
        setter(true);
        setTimeout(() => { setter(false); scheduleBlink(setter); }, 150);
      }, Math.random() * 4000 + 3000);
      return t;
    };
    const t1 = scheduleBlink(setIsPurpleBlinking);
    const t2 = scheduleBlink(setIsBlackBlinking);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const calcPos = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };
    const rect = ref.current.getBoundingClientRect();
    const dx = mouseX - (rect.left + rect.width / 2);
    const dy = mouseY - (rect.top + rect.height / 3);
    return {
      faceX: Math.max(-15, Math.min(15, dx / 20)),
      faceY: Math.max(-10, Math.min(10, dy / 30)),
      bodySkew: Math.max(-6, Math.min(6, -dx / 120)),
    };
  };

  const pPos = calcPos(purpleRef);
  const bPos = calcPos(blackRef);
  const yPos = calcPos(yellowRef);
  const oPos = calcPos(orangeRef);

  return (
    <div className="relative hidden lg:block bg-gradient-to-br from-primary/90 via-primary to-primary/80 text-primary-foreground">
      <div className="sticky top-[72px] h-[calc(100vh-72px)] flex flex-col justify-between p-12 overflow-hidden">

        <div className="relative z-20 flex items-end justify-center flex-1 mt-4">
          <div className="relative" style={{ width: "420px", height: "320px" }}>
            {/* Purple */}
            <div ref={purpleRef} className="absolute bottom-0 transition-all duration-700" style={{ left: "50px", width: "140px", height: hiding ? '340px' : "320px", backgroundColor: "#6C3FF5", borderRadius: "10px 10px 0 0", zIndex: 1, transform: hiding ? `skewX(-5deg)` : `skewX(${pPos.bodySkew}deg)`, transformOrigin: "bottom center" }}>
              <div className="absolute flex gap-6 transition-all duration-200" style={{ left: hiding ? '20px' : `${35 + pPos.faceX}px`, top: hiding ? '28px' : `${32 + pPos.faceY}px` }}>
                <EyeBall size={16} pupilSize={6} maxDistance={5} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isPurpleBlinking} forceLookX={hiding ? -5 : undefined} forceLookY={hiding ? -3 : undefined} />
                <EyeBall size={16} pupilSize={6} maxDistance={5} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isPurpleBlinking} forceLookX={hiding ? -5 : undefined} forceLookY={hiding ? -3 : undefined} />
              </div>
            </div>
            {/* Black */}
            <div ref={blackRef} className="absolute bottom-0 transition-all duration-700" style={{ left: "180px", width: "90px", height: "260px", backgroundColor: "#2D2D2D", borderRadius: "8px 8px 0 0", zIndex: 2, transform: hiding ? `skewX(-3deg)` : `skewX(${bPos.bodySkew}deg)`, transformOrigin: "bottom center" }}>
              <div className="absolute flex gap-4 transition-all duration-200" style={{ left: hiding ? '12px' : `${20 + bPos.faceX}px`, top: hiding ? '22px' : `${26 + bPos.faceY}px` }}>
                <EyeBall size={14} pupilSize={5} maxDistance={4} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isBlackBlinking} forceLookX={hiding ? -4 : undefined} forceLookY={hiding ? -3 : undefined} />
                <EyeBall size={14} pupilSize={5} maxDistance={4} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isBlackBlinking} forceLookX={hiding ? -4 : undefined} forceLookY={hiding ? -3 : undefined} />
              </div>
            </div>
            {/* Orange */}
            <div ref={orangeRef} className="absolute bottom-0 transition-all duration-700" style={{ left: "0px", width: "180px", height: "160px", zIndex: 3, backgroundColor: "#FF9B6B", borderRadius: "100px 100px 0 0", transform: hiding ? `skewX(-4deg)` : `skewX(${oPos.bodySkew}deg)`, transformOrigin: "bottom center" }}>
              <div className="absolute flex gap-6 transition-all duration-200" style={{ left: hiding ? '48px' : `${62 + oPos.faceX}px`, top: hiding ? '68px' : `${72 + oPos.faceY}px` }}>
                <Pupil size={10} maxDistance={4} pupilColor="#2D2D2D" forceLookX={hiding ? -5 : undefined} forceLookY={hiding ? -3 : undefined} />
                <Pupil size={10} maxDistance={4} pupilColor="#2D2D2D" forceLookX={hiding ? -5 : undefined} forceLookY={hiding ? -3 : undefined} />
              </div>
            </div>
            {/* Yellow */}
            <div ref={yellowRef} className="absolute bottom-0 transition-all duration-700" style={{ left: "240px", width: "110px", height: "200px", backgroundColor: "#E8D754", borderRadius: "60px 60px 0 0", zIndex: 4, transform: hiding ? `skewX(-4deg)` : `skewX(${yPos.bodySkew}deg)`, transformOrigin: "bottom center" }}>
              <div className="absolute flex gap-4 transition-all duration-200" style={{ left: hiding ? '28px' : `${40 + yPos.faceX}px`, top: hiding ? '30px' : `${34 + yPos.faceY}px` }}>
                <Pupil size={10} maxDistance={4} pupilColor="#2D2D2D" forceLookX={hiding ? -5 : undefined} forceLookY={hiding ? -3 : undefined} />
                <Pupil size={10} maxDistance={4} pupilColor="#2D2D2D" forceLookX={hiding ? -5 : undefined} forceLookY={hiding ? -3 : undefined} />
              </div>
              <div className="absolute w-14 h-[3px] bg-[#2D2D2D] rounded-full transition-all duration-200" style={{ left: hiding ? '20px' : `${32 + yPos.faceX}px`, top: hiding ? '68px' : `${72 + yPos.faceY}px` }} />
            </div>
          </div>
        </div>

        <div className="relative z-20 flex items-center gap-8 text-sm text-primary-foreground/60">
          <a href="/privacy" className="hover:text-primary-foreground transition-colors">Privacy Policy</a>
          <a href="/terms" className="hover:text-primary-foreground transition-colors">Terms of Service</a>
          <a href="/contact" className="hover:text-primary-foreground transition-colors">Contact</a>
        </div>

        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="absolute top-1/4 right-1/4 size-64 bg-primary-foreground/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 size-96 bg-primary-foreground/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
}

/* ─── Main Page ─── */

const STEPS = ["Connect", "Register", "Verify", "Published"];

const DeveloperOnboarding = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { register, linkWallet, isAuthenticated, walletAddress } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [agentForm, setAgentForm] = useState({
    name: "", description: "", endpoint: "", price: "0.05", category: "medical",
    capabilities: "",
    serviceType: "ai-agent",
    inputSchema: '{\n  "input": "base64_encoded_data"\n}',
    outputSchema: '{\n  "result": "string",\n  "confidence": 0.96\n}'
  });
  const [checks, setChecks] = useState<boolean[]>([false, false, false, false]);
  const [testing, setTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [createdServiceId, setCreatedServiceId] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [walletRegistering, setWalletRegistering] = useState(false);
  const walletRegisteredRef = useRef(false);

  useSEO({ title: "List Your AI Agent — Stoa Developer Onboarding", description: "Register as a developer, create a wallet, and list your AI agent on Stoa." });

  useEffect(() => {
    if (step !== 2) return;
    const timers = checks.map((_, i) =>
      setTimeout(() => setChecks((prev) => { const n = [...prev]; n[i] = true; return n; }), (i + 1) * 600)
    );
    const advance = setTimeout(() => setStep(3), 3000);
    return () => { timers.forEach(clearTimeout); clearTimeout(advance); };
  }, [step]);

  // When wallet connects: auto-register with wallet address and skip to Register Agent
  useEffect(() => {
    if (!walletAddress || walletRegisteredRef.current || isAuthenticated) return;
    walletRegisteredRef.current = true;
    setWalletRegistering(true);
    const addr = walletAddress;
    const walletEmail = `${addr.slice(0, 8).toLowerCase()}@wallet.stoa.dev`;
    const walletPassword = `wallet_${addr.slice(0, 16)}`;
    (async () => {
      try {
        const result = await register(walletEmail, walletPassword, addr.slice(0, 10));
        setApiKey(result.apiKey || "");
        await linkWallet(addr).catch(() => { });
        setStep(1); // Go straight to Register Agent
      } catch {
        // Already registered — try login
        try {
          const { login } = await import("@/lib/api");
          const loginResult = await login(walletEmail, walletPassword);
          localStorage.setItem("stoa_token", loginResult.token);
          await linkWallet(addr).catch(() => { });
          setStep(1);
        } catch {
          // Couldn't auto-register, user can do it manually
          setSubmitError("Wallet connected. Please fill in account details to continue.");
        }
      } finally {
        setWalletRegistering(false);
      }
    })();
  }, [walletAddress, isAuthenticated, register, linkWallet]);

  // If already authenticated and wallet connected, jump to Register Agent
  useEffect(() => {
    if (isAuthenticated && step === 0) {
      setStep(1);
    }
  }, [isAuthenticated, step]);

  const isFormValid = form.name && form.email && form.password.length >= 8 && form.password === form.confirm;
  const isAgentValid = agentForm.name && agentForm.description && agentForm.endpoint && agentForm.price;

  const handleAccountSubmit = async () => {
    setSubmitError("");
    try {
      const result = await register(form.email, form.password, form.name);
      setApiKey(result.apiKey || "");
      if (walletAddress) {
        await linkWallet(walletAddress).catch(() => { });
      }
      setStep(1); // Go to Register Agent
    } catch (err: any) {
      setSubmitError(err.message || "Registration failed");
    }
  };

  const handleAgentSubmit = async () => {
    setSubmitError("");
    try {
      let parsedInput: Record<string, any> = { input: "string" };
      let parsedOutput: Record<string, any> = { result: "string" };
      try { parsedInput = JSON.parse(agentForm.inputSchema); } catch { /* keep default */ }
      try { parsedOutput = JSON.parse(agentForm.outputSchema); } catch { /* keep default */ }

      // Build capabilities array from comma-separated string, default if empty
      const rawCaps = agentForm.capabilities
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      const capabilities = rawCaps.length > 0 ? rawCaps : ["AI processing", "API access"];

      // Ensure description meets 10-char minimum
      const description = agentForm.description.length >= 10
        ? agentForm.description
        : agentForm.description + " — AI-powered service on Stoa";

      // Get owner wallet address
      const ownerAddress = walletAddress || "0x0000000000000000000000000000000000000000";

      const result = await api.createService({
        name: agentForm.name,
        description,
        endpointUrl: agentForm.endpoint,
        priceUsdcPerCall: parseFloat(agentForm.price) || 0.05,
        category: agentForm.category,
        serviceType: agentForm.serviceType,
        ownerAddress,
        capabilities,
        inputSchema: parsedInput,
        outputSchema: parsedOutput,
      });
      setCreatedServiceId(result.service?._id || result.service?.id || "");
      setStep(2);
      // Invalidate services cache so Explore page shows the new agent
      queryClient.invalidateQueries({ queryKey: ["services"] });
      // Auto-verify
      if (result.service?._id || result.service?.id) {
        api.verifyService(result.service._id || result.service.id).catch(() => { });
      }
    } catch (err: any) {
      setSubmitError(err.message || "Failed to create service");
    }
  };

  const handleTest = () => {
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      toast({ title: "Connection successful", description: "Agent endpoint is reachable." });
    }, 1500);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 pt-[72px]">
      {/* Left: Animated Characters */}
      <AnimatedCharactersPanel hiding={showPassword && form.password.length > 0} />

      {/* Right: Form Content */}
      <div className="flex items-start justify-center p-6 md:p-12 bg-background pt-8">
        <div className="w-full max-w-lg">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-heading-md font-bold">STOA</span>
          </div>

          {/* Progress Bar */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-3">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-caption font-medium ${i < step ? "bg-primary text-primary-foreground" : i === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                    {i < step ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className="hidden md:inline font-body text-caption text-muted-foreground">{s}</span>
                </div>
              ))}
            </div>
            <div className="h-1 bg-muted rounded-full">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* Step 0: Connect — wallet-first or email */}
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-6">
                <h2 className="font-display text-heading-lg font-bold">Get Started</h2>
                <p className="font-body text-body-md text-muted-foreground">Connect your wallet to skip straight to listing your agent.</p>

                {/* Wallet connect — primary path */}
                <div className="rounded-2xl border border-primary/30 bg-primary/[0.03] p-6 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="h-5 w-5 text-primary" />
                    <span className="font-body text-body-md font-semibold">Connect Wallet</span>
                  </div>
                  {walletRegistering ? (
                    <div className="flex items-center justify-center gap-3 py-4">
                      <Spinner size="sm" />
                      <span className="font-body text-body-sm text-muted-foreground">Setting up your account...</span>
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <ConnectWalletButton label="Connect Wallet to Continue" className="w-full h-12" />
                    </div>
                  )}
                </div>

                <div className="relative flex items-center gap-4 py-1">
                  <div className="flex-1 h-px bg-border" />
                  <span className="font-body text-caption text-muted-foreground">or use email</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <Input placeholder="Display name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} placeholder="Password (min 8 chars)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Input type={showPassword ? "text" : "password"} placeholder="Confirm password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
                {submitError && <p className="text-destructive text-body-sm">{submitError}</p>}
                <Button variant="default" disabled={!isFormValid} onClick={handleAccountSubmit} className="w-full">Continue with Email</Button>
              </motion.div>
            )}

            {/* Step 1: Register Agent */}
            {step === 1 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-6">
                <h2 className="font-display text-heading-lg font-bold">Register Your Agent</h2>
                <Input placeholder="Agent name" value={agentForm.name} onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })} />
                <textarea
                  placeholder="Description (min 10 characters)"
                  value={agentForm.description}
                  onChange={(e) => setAgentForm({ ...agentForm, description: e.target.value })}
                  className="flex w-full rounded-xl border border-input bg-background px-4 py-3 text-body-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[100px] resize-y font-body"
                />
                <Input placeholder="API endpoint URL (https://...)" value={agentForm.endpoint} onChange={(e) => setAgentForm({ ...agentForm, endpoint: e.target.value })} />
                <Input placeholder="Capabilities (comma-separated, e.g. Image analysis, Fast response)" value={agentForm.capabilities} onChange={(e) => setAgentForm({ ...agentForm, capabilities: e.target.value })} />
                <div className="flex gap-3">
                  <Input placeholder="Price per call" type="number" step="0.01" value={agentForm.price} onChange={(e) => setAgentForm({ ...agentForm, price: e.target.value })} className="w-32" />
                  <select
                    value={agentForm.category}
                    onChange={(e) => setAgentForm({ ...agentForm, category: e.target.value })}
                    className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-body-sm font-body"
                  >
                    {[
                      { value: "medical", label: "Medical" },
                      { value: "finance", label: "Finance" },
                      { value: "legal", label: "Legal" },
                      { value: "code", label: "Code" },
                      { value: "data", label: "Data" },
                      { value: "creative", label: "Creative" },
                      { value: "research", label: "Research" },
                      { value: "security", label: "Security" },
                      { value: "agriculture", label: "Agriculture" },
                      { value: "other", label: "Other" },
                    ].map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <select
                    value={agentForm.serviceType}
                    onChange={(e) => setAgentForm({ ...agentForm, serviceType: e.target.value })}
                    className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-body-sm font-body"
                  >
                    {[
                      { value: "ai-agent", label: "AI Agent" },
                      { value: "ml-model", label: "ML Model" },
                      { value: "api-tool", label: "API Tool" },
                      { value: "data-feed", label: "Data Feed" },
                      { value: "workflow", label: "Workflow" },
                    ].map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {/* I/O Schema */}
                <div className="space-y-2">
                  <label className="font-body text-body-sm font-medium text-foreground">Input Schema (JSON)</label>
                  <textarea
                    placeholder='{"input": "base64_encoded_data"}'
                    value={agentForm.inputSchema}
                    onChange={(e) => setAgentForm({ ...agentForm, inputSchema: e.target.value })}
                    className="flex w-full rounded-xl border border-input bg-ink text-white font-mono px-4 py-3 text-caption ring-offset-background placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px] resize-y"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-body text-body-sm font-medium text-foreground">Output Schema (JSON)</label>
                  <textarea
                    placeholder='{"result": "string", "confidence": 0.96}'
                    value={agentForm.outputSchema}
                    onChange={(e) => setAgentForm({ ...agentForm, outputSchema: e.target.value })}
                    className="flex w-full rounded-xl border border-input bg-ink text-white font-mono px-4 py-3 text-caption ring-offset-background placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px] resize-y"
                  />
                </div>
                <Button variant="outline" onClick={handleTest} disabled={testing}>
                  {testing ? <Spinner size="sm" /> : "Test Connection"}
                </Button>
                {submitError && <p className="text-destructive text-body-sm">{submitError}</p>}
                {apiKey && (
                  <div className="rounded-xl bg-muted p-3">
                    <p className="font-body text-caption text-muted-foreground mb-1">Your API Key (save it now):</p>
                    <div className="flex items-center gap-2 font-mono text-body-sm">
                      <span className="truncate">{apiKey}</span>
                      <CopyButton text={apiKey} />
                    </div>
                  </div>
                )}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(0)}>Back</Button>
                  <Button variant="default" disabled={!isAgentValid} onClick={handleAgentSubmit} className="flex-1">Continue</Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Verification */}
            {step === 2 && (
              <motion.div key="s4" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-6">
                <h2 className="font-display text-heading-lg font-bold">Verifying...</h2>
                <div className="space-y-4">
                  {["Agent endpoint reachable", "Response schema valid", "Pricing configured", "Ready to publish"].map((item, i) => (
                    <div key={item} className="flex items-center gap-3 font-body text-body-md">
                      {checks[i] ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                          <Check className="h-5 w-5 text-primary" />
                        </motion.div>
                      ) : (
                        <Spinner size="sm" />
                      )}
                      <span className={checks[i] ? "text-foreground" : "text-muted-foreground"}>{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Published */}
            {step === 3 && (
              <motion.div key="s5" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }} className="flex items-center justify-center">
                  <CheckCircle2 className="h-16 w-16 text-primary" strokeWidth={1.5} />
                </motion.div>
                <h2 className="font-display text-display-sm font-bold">Published!</h2>
                <AgentCard
                  agent={{
                    id: "custom",
                    name: agentForm.name || "Your Agent",
                    emoji: "🤖",
                    category: agentForm.category,
                    description: agentForm.description || "Your amazing AI agent.",
                    pricePerCall: parseFloat(agentForm.price) || 0.05,
                    rating: 5.0,
                    totalCalls: 0,
                    verified: true,
                    developer: form.name || "Developer",
                  }}
                  className="mx-auto"
                />
                {createdServiceId && (
                  <div className="flex items-center justify-center gap-2 font-mono text-body-sm">
                    <span className="text-muted-foreground">/explore/{createdServiceId}</span>
                    <CopyButton text={`${window.location.origin}/explore/${createdServiceId}`} />
                  </div>
                )}
                <div className="flex flex-wrap gap-4 justify-center">
                  {createdServiceId ? (
                    <Link to={`/explore/${createdServiceId}`}><Button variant="default">View Your Agent</Button></Link>
                  ) : (
                    <Link to="/dashboard"><Button variant="default">Go to Dashboard</Button></Link>
                  )}
                  <Link to="/explore"><Button variant="outline">Browse All Agents</Button></Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!isAuthenticated && (
            <motion.p
              className="text-center font-body text-body-md text-muted-foreground mt-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.6 }}
            >
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Log in
              </Link>
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeveloperOnboarding;
