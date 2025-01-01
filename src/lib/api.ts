// In dev, requests go through Vite's proxy (empty string = same origin).
// In production on Vercel, vercel.json rewrites /api/* and /v1/* to Railway.
const API_URL = "";

function getToken(): string | null {
  return localStorage.getItem("stoa_token");
}

// Custom error for 402 Payment Required responses
export class PaymentRequiredError extends Error {
  public payTo: string;
  public price: number;
  public network: string;
  public accepts: any[];
  public fullBody: any;

  constructor(body: any) {
    super("Payment required");
    this.name = "PaymentRequiredError";
    this.fullBody = body;
    this.accepts = body.accepts || [];
    // Extract payment details from the first accepted payment method
    const first = this.accepts[0] || {};
    this.payTo = first.payTo || "";
    this.price = typeof first.maxAmountRequired === "string"
      ? parseFloat(first.maxAmountRequired) / 1e6  // USDC has 6 decimals
      : (first.price ?? 0);
    this.network = first.network || "eip155:84532";
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 402) {
      throw new PaymentRequiredError(body);
    }
    throw new Error(body.error || body.message || `Request failed: ${res.status}`);
  }

  return res.json();
}

// --- Auth ---

export async function register(email: string, password: string, name?: string) {
  return request<{ token: string; apiKey: string; user: any }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
}

export async function login(email: string, password: string) {
  return request<{ token: string; user: any }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

/** Register a new account, or login if the email already exists (409). */
export async function registerOrLogin(email: string, password: string, name?: string) {
  try {
    const data = await register(email, password, name);
    return { ...data, isNew: true };
  } catch (err: any) {
    // If email already registered, try login instead
    if (err.message?.includes("already registered") || err.message?.includes("409")) {
      const data = await login(email, password);
      return { ...data, apiKey: "", isNew: false };
    }
    throw err;
  }
}

export async function getMe() {
  return request<{ user: any }>("/api/auth/me");
}

// --- Services ---

export async function getServices(params?: { category?: string; search?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.set("category", params.category);
  if (params?.search) searchParams.set("search", params.search);
  const qs = searchParams.toString();
  return request<{ services: any[] }>(`/api/services${qs ? `?${qs}` : ""}`);
}

export async function getServiceById(id: string) {
  return request<{ service: any }>(`/api/services/${id}`);
}

export async function createService(data: {
  name: string;
  description: string;
  endpointUrl: string;
  priceUsdcPerCall: number;
  ownerAddress: string;
  capabilities: string[];
  category?: string;
  serviceType?: string;
  inputSchema?: object;
  outputSchema?: object;
}) {
  return request<{ service: any }>("/api/services", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function verifyService(id: string) {
  return request<{ service: any }>(`/api/services/${id}/verify`, {
    method: "POST",
  });
}

export async function searchServices(query: string) {
  return request<{ services: any[] }>("/api/services/search", {
    method: "POST",
    body: JSON.stringify({ query }),
  });
}

// --- Wallet ---

export async function getWalletBalance() {
  return request<{ balance: number; address?: string }>("/api/wallet/balance");
}

export async function getWalletTransactions() {
  return request<{ transactions: any[] }>("/api/wallet/transactions");
}

export async function getWalletUsage() {
  return request<{ usage: any[] }>("/api/wallet/usage");
}

export async function linkWallet(address: string) {
  return request<{ success: boolean }>("/api/wallet/link", {
    method: "POST",
    body: JSON.stringify({ address }),
  });
}

// --- Activity ---

export async function getActivity() {
  return request<{ activity: any[] }>("/api/activity");
}

// --- Providers ---

export async function getProviderStats(userId: string) {
  return request<{ stats: any }>(`/api/providers/${userId}`);
}

// --- Service Call ---

export async function callService(serviceId: string, input: any) {
  return request<any>(`/v1/call/${serviceId}`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
