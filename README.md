# Indiyana Payments

The payments counter for retailers, distributors and admins: card collections through payment-gateway links, static UPI QR, IMPS payouts, credit card bill payments, wallet ledgers and client-wide reports.

One Next.js application — pages, API and session in a single codebase. There is no local database: every API route validates input, scopes it to this portal's client, and forwards it to the remote payments API (and the BBPS bill service), reshaping the answers into clean types for the UI.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Route Handlers, `proxy.ts`), React 19, TypeScript (strict) |
| Styling | Tailwind CSS v4 (design tokens in `src/app/globals.css`), lucide icons |
| Data | TanStack Query on the client; server services over `fetch` |
| Validation | Zod — the same schemas run in the forms and in the API |
| Auth | Signed, httpOnly session cookie (JWT via `jose`), expires at midnight |
| Exports | `jspdf` (receipts, report PDFs), a built-in `.xlsx` writer (`fflate`), `qrcode` |

## Getting started

```bash
npm install
cp .env.example .env.local      # then fill in MASTER_CLIENT_ID and SESSION_SECRET
npm run dev                     # http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / serve it |
| `npm run lint` | ESLint (Next.js + React Compiler rules) |
| `npm run typecheck` | `tsc --noEmit` |

### Environment

See `.env.example` for every variable. The two you must set:

- **`MASTER_CLIENT_ID`** — the one client (tenant) this portal serves on the shared remote API. It is fixed on the server and never taken from the browser; every upstream call is scoped to it.
- **`SESSION_SECRET`** — 32+ random characters for signing the session cookie.

Set **`PG_REDIRECT_BASE_URL`** in production (e.g. `https://pay.example.com`) so the gateway always returns payers to your real host.

## Project structure

```
src/
├─ app/                         Routes only — thin files that compose features
│  ├─ (auth)/login/             Sign-in
│  ├─ (public)/payment-status/  The payer's result page (no sign-in)
│  ├─ (portal)/                 Signed-in pages; layout verifies the session
│  │  ├─ collect/gateway/       Card collection (PG links)
│  │  ├─ payout/imps/           IMPS transfers
│  │  ├─ payout/card-bills/     Credit card bills (BBPS)
│  │  ├─ wallet/                Balance, settlement accounts, ledger
│  │  ├─ reports/[report]/      Every report, by slug
│  │  ├─ my-retailers/          A distributor's mapped retailers
│  │  ├─ profile/               Password and PIN
│  │  └─ admin/                 Admin-only (layout + proxy + API all enforce it)
│  ├─ api/                      Route handlers (the backend)
│  ├─ layout.tsx, providers.tsx, globals.css, not-found.tsx, error.tsx
├─ server/                      Server-only code (never bundled for the browser)
│  ├─ config/env.ts             Validated environment
│  ├─ auth/session.ts           Session cookie: sign, verify, read
│  ├─ http/                     Remote client, case-insensitive field reader, errors, route wrapper
│  ├─ mappers/                  Remote wire formats → clean types
│  ├─ services/                 One module per domain (customers, wallet, imps, pg, qr, bbps, admin…)
│  ├─ cache/                    In-process TTL cache and in-flight locks
│  └─ storage/                  Small file store (retailer QR remarks)
├─ features/                    UI by domain: views, dialogs, hooks
├─ components/                  ui/ (design-system primitives), layout/ (shell), brand/
├─ lib/                         api client, query keys, formatting, dates, validation, exports
├─ config/                      routes, navigation, feature switches, site
├─ types/                       Shared request/response types
└─ proxy.ts                     Request gate (sign-in and role redirects)
```

## How requests are secured

- **Sessions** — `POST /api/auth/login` checks credentials against the remote, resolves the user's wallet once, and sets an httpOnly cookie signed with `SESSION_SECRET`. It expires at the next midnight in `APP_TIMEZONE`; open tabs notice and return to the login screen.
- **Three layers of authorisation** — `proxy.ts` redirects page requests, the `(portal)` and `admin` layouts verify the session on the server, and every API route is wrapped in `publicRoute` / `userRoute` / `adminRoute`.
- **Wallets come from the session** — payments, links, bill fetch/pay, verification and the retailer's own reports use the signed-in wallet; a wallet id in the request is honoured only for admins. A missing wallet stops the request instead of travelling upstream as `0` ("every wallet").
- **Tenant isolation** — reads by id (`customer/SelectById`, payment status) are checked against `MASTER_CLIENT_ID`, so another tenant's records are reported as not found.
- **Money moves once** — bill payments, refunds and pullbacks are guarded by in-flight locks; a fetched bill can only be paid by the wallet that fetched it, once, within its limits.
- **Margins stay private** — partner charges and profit are stripped from PG reports for non-admins on the server.

## Deployment

```bash
npm ci
npm run build
npm start               # or run .next/standalone/server.js (output: 'standalone')
```

Run **one** Node.js instance. Fetched bills, payment-return tokens and the wallet-owner directory live in process memory (as in the previous single-process deployment). To scale out, swap `src/server/cache/memory-cache.ts` for a shared store such as Redis.

`STORAGE_PATH` holds the retailer QR remarks file — point it outside the deploy folder so redeploys keep it.

Old TamilPay addresses (`/wallet-settlement`, `/pg`, `/imps`, `/customers/…` …) permanently redirect to their new paths, so payment links issued before the move still bring payers back correctly.

## Remote API notes

Every remote action is a `POST` returning `{ status, statusCode, message, data }`. Known quirks handled in `src/server`:

- Field names follow no convention and casing varies; all reads go through a case-insensitive reader (`server/http/fields.ts`).
- `customer/SelectById`, `wallet/Login` and `Qr/GetNext` return a single-element array.
- `customer/Delete` and `Customer/AssignRole` report failure even on success — results are confirmed by re-reading. Insert/Update ignore `RoleId`; `AssignRole` sets it.
- `GST` and sender columns are `NOT NULL` — blanks are sent as `""`.
- Bank accounts come back once per bank sharing an IFSC; one row per account is kept.
- `Announcement/Select` ignores its `isActive` filter — filtering and de-duplication happen here.
- `Qr/Request/Insert` drops the retailer's note — it is kept in `STORAGE_PATH/qr-remarks.json`.
- `Dashboard/Explain` answers with a boolean `Status` / `Data` envelope.

See `docs/api.md` for the full list of routes.

## Third-party art

The 3D service illustrations in `public/services/` are from
[Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji), MIT License,
© Microsoft Corporation. Icons with a "$" sign were left out on purpose.

The brand marks in `public/logos/` (IMPS, UPI, Bharat BillPay) are trademarks of NPCI and its
subsidiaries, from Wikimedia Commons, shown to identify the payment rails each service uses.
