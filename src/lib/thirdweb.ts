import { createThirdwebClient } from "thirdweb";
import { baseSepolia } from "thirdweb/chains";

const clientId = import.meta.env.VITE_THIRDWEB_CLIENT_ID || "";

export const client = clientId
    ? createThirdwebClient({ clientId })
    : null;

export const chain = baseSepolia;

export const hasThirdweb = !!client;
