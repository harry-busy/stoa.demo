import { Wallet, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export function MetaMaskButton({
  label = "Connect Wallet",
  className,
  style,
  fullWidth = false,
}: {
  label?: string;
  className?: string;
  style?: React.CSSProperties;
  fullWidth?: boolean;
}) {
  const { walletAddress, walletConnecting, connectWallet, disconnectWallet } = useAuth();

  if (walletAddress) {
    return (
      <div className={`flex items-center gap-2 ${className || ""}`} style={style}>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="font-mono text-caption text-foreground">
            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={disconnectWallet}
          className="h-8 w-8 p-0"
          title="Disconnect wallet"
        >
          <LogOut className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="default"
      className={`${fullWidth ? "w-full" : ""} ${className || ""}`}
      style={style}
      onClick={() => connectWallet().catch(() => {})}
      disabled={walletConnecting}
    >
      <Wallet className="h-4 w-4 mr-2" />
      {walletConnecting ? "Connecting..." : label}
    </Button>
  );
}
