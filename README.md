# Stoa — AI Agent Marketplace

Discover, use, and monetize AI agents. Pay per call with USDC micropayments — no subscriptions.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, shadcn/ui, Radix UI
- **Animations:** Framer Motion, Spline 3D
- **Data:** TanStack React Query
- **Web3:** Thirdweb (wallet connect, USDC payments)
- **Backend:** Node.js API on Railway
- **Deployment:** Vercel

## Getting Started

```sh
# Clone the repo
git clone <YOUR_GIT_URL>
cd stoa-frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

## Deployment (Vercel)

1. Import the repo on [vercel.com](https://vercel.com)
2. Build command: `npm run build`
3. Output directory: `dist`
4. Set env var: `VITE_SITE_URL` = your Vercel domain

The `vercel.json` handles SPA routing and API proxying to the Railway backend.

## Project Structure

```
src/
  components/   # Reusable UI components
  lib/          # Utilities, API client, auth context
  pages/        # Route pages (Index, Explore, Dashboard, etc.)
public/         # Static assets (favicon, sitemap, manifest, OG image)
```

## License

Proprietary. All rights reserved.
