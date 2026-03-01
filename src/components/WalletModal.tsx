import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

interface DetectedWallet {
  name: string;
  icon: string;
  provider: any;
  id: string;
}

// Well-known wallet icons (inline SVG data URIs so no external fetches)
const WALLET_ICONS: Record<string, string> = {
  metamask:
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHJ4PSIxMiIgZmlsbD0iIzFFMjAyNiIvPjxwYXRoIGQ9Ik0zNy4yNSA5TDI2LjA1IDE3LjVMMjguMDUgMTIuNDVMMzcuMjUgOVoiIGZpbGw9IiNFMjc2MUIiIHN0cm9rZT0iI0UyNzYxQiIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48cGF0aCBkPSJNMTAuNzUgOUwyMS44NSAxNy42TDE5Ljk1IDEyLjQ1TDEwLjc1IDlaIiBmaWxsPSIjRTI3NjFCIiBzdHJva2U9IiNFMjc2MUIiIHN0cm9rZS13aWR0aD0iMC41Ii8+PHBhdGggZD0iTTMzLjE1IDI4LjhMMzAuNDUgMzMuMUwzNi43NSAzNC44NUwzOC42IDI4LjlMMzMuMTUgMjguOFoiIGZpbGw9IiNFMjc2MUIiIHN0cm9rZT0iI0UyNzYxQiIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48cGF0aCBkPSJNOS40NSAyOC45TDExLjI1IDM0Ljg1TDE3LjU1IDMzLjFMMTQuODUgMjguOEw5LjQ1IDI4LjlaIiBmaWxsPSIjRTI3NjFCIiBzdHJva2U9IiNFMjc2MUIiIHN0cm9rZS13aWR0aD0iMC41Ii8+PHBhdGggZD0iTTE3LjI1IDIyLjJMMTUuNDUgMjQuOUwyMS43IDI1LjJMMjEuNDUgMTguNUwxNy4yNSAyMi4yWiIgZmlsbD0iI0UyNzYxQiIgc3Ryb2tlPSIjRTI3NjFCIiBzdHJva2Utd2lkdGg9IjAuNSIvPjxwYXRoIGQ9Ik0zMC43NSAyMi4yTDI2LjUgMTguNEwyNi4zIDI1LjJMMzIuNTUgMjQuOUwzMC43NSAyMi4yWiIgZmlsbD0iI0UyNzYxQiIgc3Ryb2tlPSIjRTI3NjFCIiBzdHJva2Utd2lkdGg9IjAuNSIvPjxwYXRoIGQ9Ik0xNy41NSAzMy4xTDIxLjMgMzEuMTVMMTguMDUgMjguOTVMMTcuNTUgMzMuMVoiIGZpbGw9IiNFMjc2MUIiIHN0cm9rZT0iI0UyNzYxQiIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48cGF0aCBkPSJNMjYuNyAzMS4xNUwzMC40NSAzMy4xTDI5Ljk1IDI4Ljk1TDI2LjcgMzEuMTVaIiBmaWxsPSIjRTI3NjFCIiBzdHJva2U9IiNFMjc2MUIiIHN0cm9rZS13aWR0aD0iMC41Ii8+PC9zdmc+",
  coinbase:
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHJ4PSIxMiIgZmlsbD0iIzAwNTJGRiIvPjxwYXRoIGQ9Ik0yNCAzNmM2LjYyNyAwIDEyLTUuMzczIDEyLTEycy01LjM3My0xMi0xMi0xMi0xMiA1LjM3My0xMiAxMiA1LjM3MyAxMiAxMiAxMnoiIGZpbGw9IiNmZmYiLz48cGF0aCBkPSJNMjEgMjFoNnY2aC02eiIgZmlsbD0iIzAwNTJGRiIvPjwvc3ZnPg==",
  default:
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHJ4PSIxMiIgZmlsbD0iIzY2NiIvPjxwYXRoIGQ9Ik0xNiAyOGgxNk0xNiAyMGgxNiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=",
};

function detectWallets(): DetectedWallet[] {
  const wallets: DetectedWallet[] = [];
  const eth = (window as any).ethereum;
  if (!eth) return wallets;

  // Check for multiple providers (EIP-5749)
  if (eth.providers && Array.isArray(eth.providers)) {
    for (const p of eth.providers) {
      if (p.isMetaMask) {
        wallets.push({ name: "MetaMask", icon: WALLET_ICONS.metamask, provider: p, id: "metamask" });
      } else if (p.isCoinbaseWallet) {
        wallets.push({ name: "Coinbase Wallet", icon: WALLET_ICONS.coinbase, provider: p, id: "coinbase" });
      } else if (p.isBraveWallet) {
        wallets.push({ name: "Brave Wallet", icon: WALLET_ICONS.default, provider: p, id: "brave" });
      } else {
        wallets.push({ name: "Wallet", icon: WALLET_ICONS.default, provider: p, id: "unknown" });
      }
    }
  } else {
    // Single provider
    if (eth.isMetaMask) {
      wallets.push({ name: "MetaMask", icon: WALLET_ICONS.metamask, provider: eth, id: "metamask" });
    } else if (eth.isCoinbaseWallet) {
      wallets.push({ name: "Coinbase Wallet", icon: WALLET_ICONS.coinbase, provider: eth, id: "coinbase" });
    } else if (eth.isBraveWallet) {
      wallets.push({ name: "Brave Wallet", icon: WALLET_ICONS.default, provider: eth, id: "brave" });
    } else {
      wallets.push({ name: "Browser Wallet", icon: WALLET_ICONS.default, provider: eth, id: "browser" });
    }
  }

  // EIP-6963: check for announced providers
  const announced = (window as any).__eip6963Providers;
  if (announced && Array.isArray(announced)) {
    for (const entry of announced) {
      const existing = wallets.find((w) => w.provider === entry.provider);
      if (!existing) {
        wallets.push({
          name: entry.info?.name || "Wallet",
          icon: entry.info?.icon || WALLET_ICONS.default,
          provider: entry.provider,
          id: entry.info?.rdns || "eip6963",
        });
      }
    }
  }

  return wallets;
}

export function WalletModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { connectWallet, walletAddress } = useAuth();
  const [wallets, setWallets] = useState<DetectedWallet[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setWallets(detectWallets());
      setError("");
      setConnecting(null);
    }
  }, [open]);

  // Close on successful connection
  useEffect(() => {
    if (walletAddress && open) {
      onClose();
    }
  }, [walletAddress, open, onClose]);

  const handleConnect = async (wallet: DetectedWallet) => {
    setConnecting(wallet.id);
    setError("");
    try {
      // If multiple providers, temporarily set the selected one
      const eth = (window as any).ethereum;
      if (eth.providers) {
        (window as any)._selectedProvider = wallet.provider;
      }
      await connectWallet();
      onClose();
    } catch (err: any) {
      if (err.code === 4001) {
        setError("Connection rejected.");
      } else {
        setError(err.message || "Failed to connect.");
      }
    } finally {
      setConnecting(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-sm mx-4 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display text-lg font-bold text-foreground">Connect Wallet</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Wallet List */}
        <div className="p-4 space-y-2">
          {wallets.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <div className="text-4xl">🦊</div>
              <p className="font-body text-body-sm text-muted-foreground">
                No wallet detected.
              </p>
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="default" className="mt-2">
                  Install MetaMask
                </Button>
              </a>
            </div>
          ) : (
            wallets.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => handleConnect(wallet)}
                disabled={connecting !== null}
                className="w-full flex items-center gap-4 rounded-xl border border-border px-4 py-3.5 transition-all hover:bg-muted/50 hover:border-primary/30 hover:shadow-sm disabled:opacity-50 group"
              >
                <img
                  src={wallet.icon}
                  alt={wallet.name}
                  className="h-10 w-10 rounded-xl"
                  onError={(e) => { (e.target as HTMLImageElement).src = WALLET_ICONS.default; }}
                />
                <span className="font-body text-body-md font-medium text-foreground group-hover:text-primary transition-colors">
                  {wallet.name}
                </span>
                {connecting === wallet.id && (
                  <div className="ml-auto h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                )}
              </button>
            ))
          )}

          {error && (
            <p className="text-center font-body text-caption text-destructive pt-2">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border bg-muted/30">
          <p className="font-body text-caption text-muted-foreground text-center">
            Connect to Base Sepolia network
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Drop-in button that opens the WalletModal, or shows connected address.
 */
export function ConnectWalletButton({
  label = "Connect Wallet",
  className,
  style,
}: {
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { walletAddress, disconnectWallet } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  if (walletAddress) {
    return (
      <div className={`flex items-center gap-1.5 ${className || ""}`} style={style}>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 hover:bg-muted transition-colors"
        >
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="font-mono text-[13px] text-foreground">
            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </span>
        </button>
        <button
          onClick={disconnectWallet}
          className="rounded-lg px-2 py-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors text-xs font-body"
          title="Disconnect"
        >
          ✕
        </button>
        <WalletModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </div>
    );
  }

  return (
    <>
      <Button
        variant="default"
        className={className}
        style={style}
        onClick={() => setModalOpen(true)}
      >
        {label}
      </Button>
      <WalletModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
