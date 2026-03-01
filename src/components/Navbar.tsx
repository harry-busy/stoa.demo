import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Sun, Moon, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MagneticElement } from "@/components/animations/MagneticElement";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth-context";
import { ConnectWalletButton } from "@/components/WalletModal";
import { client, chain, hasThirdweb } from "@/lib/thirdweb";
import { ConnectButton } from "thirdweb/react";

const NAV_LINKS = [
  { label: "Explore", to: "/explore" },
  { label: "Connect", to: "/connect" },
  { label: "Docs", to: "/docs" },
  { label: "Dashboard", to: "/dashboard" },
] as const;

function NavAuthButton({ mobile }: { mobile?: boolean }) {
  const { isAuthenticated, user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (isAuthenticated) {
    return (
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={cn(
            "flex items-center gap-2 rounded-full border border-border px-3 py-2 transition-colors hover:bg-muted",
            mobile && "text-white border-white/20 hover:bg-white/10"
          )}
        >
          <User className="h-4 w-4" />
          <span className="font-body text-body-sm font-medium max-w-[120px] truncate">
            {user?.name || user?.email || "Account"}
          </span>
        </button>
        {dropdownOpen && (
          <div className={cn(
            "absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-card shadow-lg py-2 z-50",
            mobile && "bg-ink border-white/10"
          )}>
            <Link
              to="/dashboard"
              onClick={() => setDropdownOpen(false)}
              className="block px-4 py-2 font-body text-body-sm hover:bg-muted transition-colors"
            >
              Dashboard
            </Link>
            <button
              onClick={() => { logout(); setDropdownOpen(false); }}
              className="w-full text-left px-4 py-2 font-body text-body-sm hover:bg-muted transition-colors text-destructive"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {hasThirdweb && client ? (
        <ConnectButton
          client={client}
          chain={chain}
          connectModal={{
            size: "wide",
            showThirdwebBranding: false,
          }}
        />
      ) : (
        <ConnectWalletButton label="Connect Wallet" />
      )}
      <Link to="/login">
        <Button variant="ghost" size="sm" className={mobile ? "text-white" : ""}>
          Log in
        </Button>
      </Link>
    </div>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Escape key handler for mobile menu
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  // Focus management for mobile menu
  useEffect(() => {
    if (mobileOpen) {
      lastFocusedRef.current = document.activeElement as HTMLElement;
      setTimeout(() => closeButtonRef.current?.focus(), 100);
    } else if (lastFocusedRef.current) {
      lastFocusedRef.current.focus();
      lastFocusedRef.current = null;
    }
  }, [mobileOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const isSplitLayoutPage = ["/login", "/connect/developer", "/connect/user"].some(
    (path) => location.pathname === path
  );

  return (
    <>
      <nav
        role="navigation"
        aria-label="Main navigation"
        className={cn(
          "fixed top-0 left-0 right-0 z-[var(--z-sticky)] flex h-[72px] items-center justify-between px-6 md:px-12 transition-all duration-300",
          isSplitLayoutPage
            ? "bg-background/95 backdrop-blur-xl border-b border-border/50"
            : scrolled
              ? "bg-background/80 backdrop-blur-xl border-b border-border/50"
              : "bg-transparent"
        )}
      >
        {/* Wordmark */}
        <Link to="/" className="font-display text-2xl font-bold text-foreground" aria-label="STOA home">
          STOA
        </Link>

        {/* Center Nav (Desktop) */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <MagneticElement key={link.to} strength={0.1}>
              <Link
                to={link.to}
                aria-current={location.pathname.startsWith(link.to) ? "page" : undefined}
                className={cn(
                  "relative font-body text-body-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                  location.pathname.startsWith(link.to) && "text-foreground"
                )}
              >
                {link.label}
                {location.pathname.startsWith(link.to) && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary"
                  />
                )}
              </Link>
            </MagneticElement>
          ))}
        </div>

        {/* Right */}
        <div className="hidden md:flex items-center gap-3">
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="inline-flex items-center justify-center h-10 w-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            >
              {theme === "dark" ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
            </button>
          )}
          <NavAuthButton />
        </div>

        {/* Mobile Hamburger */}
        <div className="flex md:hidden items-center gap-2">
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="inline-flex items-center justify-center h-10 w-10 rounded-full text-foreground hover:bg-muted transition-colors"
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            >
              {theme === "dark" ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
            </button>
          )}
          <button
            onClick={() => setMobileOpen(true)}
            className="text-foreground"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[var(--z-overlay)] bg-ink flex flex-col items-center justify-center gap-8"
          >
            <button
              ref={closeButtonRef}
              onClick={() => setMobileOpen(false)}
              className="absolute top-6 right-6 text-white"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>

            {NAV_LINKS.map((link, i) => (
              <motion.div
                key={link.to}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  to={link.to}
                  className="font-display text-4xl font-bold text-white hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <NavAuthButton mobile />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
