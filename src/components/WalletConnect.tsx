import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet } from "lucide-react";

/**
 * Simple wallet address input component.
 * Accepts a wallet address and calls onConnect.
 */
export function WalletConnect({
  onConnect,
  label = "Connect Wallet",
  className,
}: {
  onConnect: (address: string) => void;
  label?: string;
  className?: string;
}) {
  const [address, setAddress] = useState("");

  const isValid = address.startsWith("0x") && address.length >= 42;

  return (
    <div className={`space-y-3 ${className || ""}`}>
      <div className="flex gap-2">
        <Input
          placeholder="Wallet address (0x...)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="flex-1 font-mono text-body-sm"
        />
        <Button
          variant="default"
          disabled={!isValid}
          onClick={() => onConnect(address)}
        >
          <Wallet className="h-4 w-4 mr-2" />
          {label}
        </Button>
      </div>
    </div>
  );
}
