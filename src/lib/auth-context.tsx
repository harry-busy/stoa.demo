import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import * as api from "@/lib/api";

const BASE_SEPOLIA_CHAIN_ID = "0x14a34"; // 84532

interface AuthState {
  user: any | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<{ apiKey: string }>;
  logout: () => void;
  linkWallet: (address: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  // MetaMask wallet
  walletAddress: string | null;
  walletConnecting: boolean;
  connectWallet: () => Promise<string>;
  disconnectWallet: () => void;
  // External wallet sync (e.g. from thirdweb)
  setWalletExternal: (address: string | null) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("stoa_token"));
  const [isLoading, setIsLoading] = useState(true);

  // MetaMask state
  const [walletAddress, setWalletAddress] = useState<string | null>(
    () => localStorage.getItem("stoa_wallet")
  );
  const [walletConnecting, setWalletConnecting] = useState(false);

  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem("stoa_token");
    if (!currentToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }
    try {
      const data = await api.getMe();
      setUser(data.user);
      setToken(currentToken);
    } catch {
      localStorage.removeItem("stoa_token");
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Listen for MetaMask account changes
  useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setWalletAddress(null);
        localStorage.removeItem("stoa_wallet");
      } else {
        setWalletAddress(accounts[0]);
        localStorage.setItem("stoa_wallet", accounts[0]);
      }
    };

    eth.on("accountsChanged", handleAccountsChanged);
    return () => eth.removeListener("accountsChanged", handleAccountsChanged);
  }, []);

  // Auto-reconnect if previously connected
  useEffect(() => {
    const saved = localStorage.getItem("stoa_wallet");
    if (!saved) return;
    const eth = (window as any).ethereum;
    if (!eth) return;

    eth.request({ method: "eth_accounts" }).then((accounts: string[]) => {
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
      } else {
        localStorage.removeItem("stoa_wallet");
        setWalletAddress(null);
      }
    }).catch(() => { });
  }, []);

  const connectWallet = useCallback(async (): Promise<string> => {
    // Use the selected provider (set by WalletModal) or fall back to window.ethereum
    const eth = (window as any)._selectedProvider || (window as any).ethereum;
    if (!eth) {
      throw new Error("No wallet detected. Please install MetaMask.");
    }

    setWalletConnecting(true);
    try {
      const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
      const addr = accounts[0];

      // Switch to Base Sepolia
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
            // Wallet doesn't support addEthereumChain — continue anyway
          }
        }
        // Other errors (4200 = unsupported method) — ignore silently
      }

      setWalletAddress(addr);
      localStorage.setItem("stoa_wallet", addr);
      return addr;
    } finally {
      setWalletConnecting(false);
      // Clean up the selected provider
      delete (window as any)._selectedProvider;
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setWalletAddress(null);
    localStorage.removeItem("stoa_wallet");
  }, []);

  const setWalletExternal = useCallback((address: string | null) => {
    if (address) {
      setWalletAddress(address);
      localStorage.setItem("stoa_wallet", address);
    } else {
      setWalletAddress(null);
      localStorage.removeItem("stoa_wallet");
    }
  }, []);

  const loginFn = useCallback(async (email: string, password: string) => {
    const data = await api.login(email, password);
    localStorage.setItem("stoa_token", data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const registerFn = useCallback(async (email: string, password: string, name?: string) => {
    const data = await api.register(email, password, name);
    localStorage.setItem("stoa_token", data.token);
    setToken(data.token);
    setUser(data.user);
    return { apiKey: data.apiKey };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("stoa_token");
    setUser(null);
    setToken(null);
  }, []);

  const linkWalletFn = useCallback(async (address: string) => {
    await api.linkWallet(address);
    await refreshUser();
  }, [refreshUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login: loginFn,
        register: registerFn,
        logout,
        linkWallet: linkWalletFn,
        refreshUser,
        walletAddress,
        walletConnecting,
        connectWallet,
        disconnectWallet,
        setWalletExternal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
