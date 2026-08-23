"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAccount, useChainId, useConnect, useDisconnect, useSignMessage, useSwitchChain } from "wagmi";
import { targetBaseChain } from "@/base/config";
import { messageFor } from "@/lib/messages";

export type Fan = { id: string; handle: string; walletAddress: string; points: number; authProvider?: string | null };

type Ctx = {
  fan: Fan | null;
  address: string | null;
  isAdmin: boolean;
  ready: boolean;
  connecting: boolean;
  error: string;
  needsInstall: boolean;
  connect: () => Promise<void>;
  authenticate: (address: string) => Promise<boolean>;
  disconnect: () => void;
  refresh: () => Promise<void>;
  clearError: () => void;
};

const C = createContext<Ctx | null>(null);
const ADMIN = (process.env.NEXT_PUBLIC_ADMIN_WALLETS ?? "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [fan, setFan] = useState<Fan | null>(null);
  const [ready, setReady] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");

  const { address: connectedAddress, isConnected } = useAccount();
  const connectedChainId = useChainId();
  const { connectors, connectAsync } = useConnect();
  const { disconnect: disconnectWallet } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const { switchChainAsync } = useSwitchChain();

  async function signInWithAddress(rawAddress: string): Promise<boolean> {
    const walletAddress = rawAddress.trim();
    if (fan?.walletAddress?.toLowerCase() === walletAddress.toLowerCase()) return true;

    let message: string;
    try {
      const challenge = await fetch("/api/fans/challenge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address: walletAddress }),
      });
      if (!challenge.ok) {
        setError("Could not start Base wallet sign-in. Try again.");
        return false;
      }
      message = (await challenge.json()).message;
    } catch {
      setError("Could not reach the server. Is the dev server running?");
      return false;
    }

    let signature: `0x${string}`;
    try {
      signature = await signMessageAsync({
        account: walletAddress as `0x${string}`,
        message,
      });
    } catch {
      setError("Base wallet signature was cancelled.");
      return false;
    }

    let response: Response;
    try {
      response = await fetch("/api/fans/connect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ walletAddress, message, signature }),
      });
    } catch {
      setError("Could not reach the server. Is the dev server running?");
      return false;
    }

    if (response.ok) {
      const connectedFan = await response.json();
      setFan(connectedFan);
      setAddress(connectedFan.walletAddress);
      localStorage.setItem("crownfi.addr", connectedFan.walletAddress);
      return true;
    }

    const body = await response.json().catch(() => ({}));
    setError(messageFor(body?.error, "We couldn’t sign you in with Base. Please try again."));
    return false;
  }

  async function authenticate(walletAddress: string): Promise<boolean> {
    setConnecting(true);
    setError("");
    try {
      if (connectedChainId !== targetBaseChain.id) {
        await switchChainAsync({ chainId: targetBaseChain.id });
      }
      return await signInWithAddress(walletAddress);
    } catch {
      setError(`Switch your wallet to ${targetBaseChain.name}, then try again.`);
      return false;
    } finally {
      setConnecting(false);
    }
  }

  async function connect() {
    setConnecting(true);
    setError("");
    try {
      if (isConnected && connectedAddress) {
        if (connectedChainId !== targetBaseChain.id) {
          await switchChainAsync({ chainId: targetBaseChain.id });
        }
        await signInWithAddress(connectedAddress);
        return;
      }

      const connector = connectors.find((item) => item.id.toLowerCase().includes("metamask")) ?? connectors[0];
      if (!connector) {
        setError("No Base-compatible wallet was found. Install MetaMask or use Base Account.");
        return;
      }
      const result = await connectAsync({ connector, chainId: targetBaseChain.id });
      const walletAddress = result.accounts[0];
      if (walletAddress) await signInWithAddress(walletAddress);
    } catch {
      setError("Base wallet connection was cancelled or unavailable.");
    } finally {
      setConnecting(false);
    }
  }

  useEffect(() => {
    try {
      const cached = localStorage.getItem("crownfi.addr");
      if (cached) setAddress(cached);
    } catch {
      // Local storage can be unavailable in privacy-restricted contexts.
    }

    (async () => {
      try {
        const response = await fetch("/api/fans/me");
        if (response.ok) {
          const connectedFan = await response.json();
          setFan(connectedFan);
          setAddress(connectedFan.walletAddress);
          localStorage.setItem("crownfi.addr", connectedFan.walletAddress);
        } else {
          setFan(null);
          setAddress(null);
          localStorage.removeItem("crownfi.addr");
        }
      } catch {
        // Keep the cached address while offline.
      }
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== "crownfi.addr") return;
      if (event.newValue) refresh();
      else {
        setFan(null);
        setAddress(null);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!fan || !isConnected || !connectedAddress) return;
    if (fan.walletAddress.toLowerCase() === connectedAddress.toLowerCase()) return;
    fetch("/api/fans/logout", { method: "POST" }).catch(() => {});
    localStorage.removeItem("crownfi.addr");
    setFan(null);
    setAddress(null);
    setError("Base wallet account changed. Sign the new account in to continue.");
  }, [connectedAddress, fan, isConnected]);

  function disconnect() {
    fetch("/api/fans/logout", { method: "POST" }).catch(() => {});
    disconnectWallet();
    setFan(null);
    setAddress(null);
    setError("");
    localStorage.removeItem("crownfi.addr");
  }

  async function refresh() {
    try {
      const response = await fetch("/api/fans/me");
      if (response.ok) {
        const connectedFan = await response.json();
        setFan(connectedFan);
        setAddress(connectedFan.walletAddress);
      }
    } catch {
      // Leave the current session intact when temporarily offline.
    }
  }

  function clearError() {
    setError("");
  }

  const isAdmin = !!address && ADMIN.includes(address.toLowerCase());

  return (
    <C.Provider value={{ fan, address, isAdmin, ready, connecting, error, needsInstall: false, connect, authenticate, disconnect, refresh, clearError }}>
      {children}
    </C.Provider>
  );
}

export function useSession() {
  const context = useContext(C);
  if (!context) throw new Error("useSession must be used within SessionProvider");
  return context;
}
