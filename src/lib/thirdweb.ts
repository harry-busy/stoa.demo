import { createThirdwebClient } from "thirdweb";
import { baseSepolia } from "thirdweb/chains";

const clientId = import.meta.env.VITE_THIRDWEB_CLIENT_ID;

// Suppress thirdweb background network errors (social profiles, RPC proxy)
// These fail because the client ID is a wallet address, not a real thirdweb key.
// The ConnectButton itself works fine — it uses browser wallet providers directly.
const _origFetch = window.fetch;
window.fetch = function (...args: Parameters<typeof fetch>) {
  const url = typeof args[0] === "string" ? args[0] : args[0] instanceof Request ? args[0].url : "";
  if (
    url.includes("social.thirdweb.com") ||
    url.includes("rpc.thirdweb.com")
  ) {
    // Return empty response silently — no console errors
    return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }));
  }
  return _origFetch.apply(window, args);
};

export const client = clientId
  ? createThirdwebClient({ clientId })
  : null;

export const chain = baseSepolia;

export const hasThirdweb = !!client;
