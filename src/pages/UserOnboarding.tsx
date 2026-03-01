import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Sparkles, Eye, EyeOff, Copy, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/Spinner";
import { cn } from "@/lib/utils";
import { useSEO } from "@/lib/seo";
import { useAuth } from "@/lib/auth-context";
import { ConnectWalletButton } from "@/components/WalletModal";

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
    <div className="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-primary/90 via-primary to-primary/80 p-12 pt-[84px] text-primary-foreground z-0">

      <div className="relative z-20 flex items-end justify-center h-[400px] mt-8">
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
  );
}

/* ─── Copyable Prompt Line ─── */

const PROMPT_TEXT = "Help me create the mcp and integrate it with Claude";

function CopyPromptLine() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(PROMPT_TEXT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={handleCopy}
      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors group"
    >
      <p className="font-body text-body-sm text-foreground select-all">{PROMPT_TEXT}</p>
      <button className="flex-shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" title="Copy">
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

/* ─── Claude Desktop Config ─── */

const CLAUDE_CONFIG = JSON.stringify({
  mcpServers: {
    stoa: {
      command: "npx",
      args: ["-y", "stoa-mcp-server"],
      env: {
        STOA_API_KEY: "stoa_your_api_key_here",
        WALLET_PRIVATE_KEY: "0xYourPrivateKeyHere",
      },
    },
  },
}, null, 2);

/* ─── Main Page ─── */

const UserOnboarding = () => {
  const navigate = useNavigate();
  const { register: registerUser, linkWallet, isAuthenticated, walletAddress } = useAuth();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectedTo, setConnectedTo] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [configCopied, setConfigCopied] = useState(false);

  useSEO({ title: "Get Started — Stoa", description: "Create your Stoa account and connect AI agents to Claude or ChatGPT." });

  const isFormValid = name.trim() && email.trim() && password.length >= 8 && password === confirm;

  // Auto-advance to step 1 if already connected/authenticated
  useEffect(() => {
    if ((walletAddress || isAuthenticated) && step === 0) {
      if (walletAddress) linkWallet(walletAddress).catch(() => { });
      setStep(1);
    }
  }, [walletAddress, isAuthenticated, step, linkWallet]);

  const handleSignup = async () => {
    setSubmitError("");
    try {
      await registerUser(email, password, name);
      if (walletAddress) {
        await linkWallet(walletAddress).catch(() => { });
      }
      setStep(1);
    } catch (err: any) {
      setSubmitError(err.message || "Registration failed");
    }
  };

  const handleConnect = async (clientName: string) => {
    if (clientName === "Claude") {
      try {
        await navigator.clipboard.writeText(CLAUDE_CONFIG);
        setConfigCopied(true);
        setTimeout(() => setConfigCopied(false), 3000);
      } catch {
        // Fallback: download as file
        const blob = new Blob([CLAUDE_CONFIG], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "claude_desktop_config.json";
        a.click();
        URL.revokeObjectURL(url);
        setConfigCopied(true);
        setTimeout(() => setConfigCopied(false), 3000);
      }
    }
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setConnectedTo(clientName);
    }, 2000);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: Animated Characters */}
      <AnimatedCharactersPanel hiding={showPassword && password.length > 0} />

      {/* Right: Form Content */}
      <div className="flex items-start justify-center p-6 md:p-12 bg-background pt-[96px]">
        <div className="w-full max-w-lg">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-heading-md font-bold">STOA</span>
          </div>

          {/* Dot Progress */}
          <div className="flex items-center justify-center gap-3 mb-12">
            {[0, 1].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-3 w-3 rounded-full transition-all duration-300",
                  i === step ? "bg-primary scale-125" : i < step ? "bg-primary/50" : "border-2 border-border"
                )}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Signup */}
            {step === 0 && (
              <motion.div key="u1" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-5">
                <h2 className="font-display text-display-sm font-bold text-center">Let's get you set up.</h2>
                <p className="font-body text-body-md text-muted-foreground text-center">Connect your wallet or create an account.</p>

                {/* Wallet-first option */}
                <div className="flex justify-center py-2">
                  <ConnectWalletButton label="Connect Wallet to Get Started" className="w-full h-12" />
                </div>

                <div className="relative flex items-center gap-4 py-2">
                  <div className="flex-1 h-px bg-border" />
                  <span className="font-body text-caption text-muted-foreground">or sign up with email</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
                <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} placeholder="Password (min 8 chars)" value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Input type={showPassword ? "text" : "password"} placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                {password && confirm && password !== confirm && (
                  <p className="font-body text-caption text-destructive">Passwords don't match</p>
                )}
                {submitError && <p className="text-destructive text-body-sm">{submitError}</p>}
                <Button variant="default" className="w-full" disabled={!isFormValid} onClick={handleSignup}>
                  Continue
                </Button>
              </motion.div>
            )}

            {/* Step 2: Connect to Claude or ChatGPT */}
            {step === 1 && !connectedTo && (
              <motion.div key="u2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="text-center space-y-6">
                <h2 className="font-display text-heading-lg font-bold">Connect your AI client</h2>
                <p className="font-body text-body-md text-muted-foreground">
                  Choose which client to connect Stoa agents to.
                </p>

                <div className="grid gap-4">
                  <Button
                    variant="default"
                    size="lg"
                    className="w-full h-14 text-body-md"
                    onClick={() => handleConnect("Claude")}
                    disabled={connecting}
                  >
                    {connecting ? <Spinner size="sm" /> : "Connect to Claude"}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full h-14 text-body-md"
                    onClick={() => handleConnect("ChatGPT")}
                    disabled={connecting}
                  >
                    {connecting ? <Spinner size="sm" /> : "Connect to ChatGPT"}
                  </Button>
                </div>

                {/* Copyable prompt line below buttons */}
                <CopyPromptLine />

                {/* Config copied notification */}
                <AnimatePresence>
                  {configCopied && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center justify-center gap-2 text-green-600 font-medium text-body-sm"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Config copied to clipboard!
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button variant="ghost" size="sm" onClick={() => setStep(0)}>Back</Button>
              </motion.div>
            )}

            {/* Connected */}
            {step === 1 && connectedTo && (
              <motion.div key="u3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 12 }}
                  className="flex items-center justify-center"
                >
                  <CheckCircle2 className="h-16 w-16 text-primary" strokeWidth={1.5} />
                </motion.div>
                <h2 className="font-display text-display-sm font-bold">You're all set!</h2>
                <p className="font-body text-body-md text-muted-foreground">
                  Connected to {connectedTo} successfully.
                </p>
                <Link to="/dashboard">
                  <Button variant="default" size="lg">Go to Dashboard</Button>
                </Link>
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

export default UserOnboarding;
