# Indiyan Payments — API reference

All routes live under `/api` (Next.js Route Handlers in `src/app/api`). Requests and responses are JSON.

**Access** — `public`: no sign-in. `user`: any signed-in user (session cookie `ip_session`). `admin`: admins only (403 otherwise).

**Errors** — every failure answers `{ "message": string, "fieldErrors"?: Record<string, string> }`:

| Status | Meaning |
| --- | --- |
| 400 | Invalid input (field errors included for validation failures) |
| 401 | Not signed in, or the session ended |
| 403 | Signed in, but not allowed (e.g. not an admin) |
| 404 | Not found — including another tenant's records, and "no wallet linked" |
| 409 | Already done or already in progress (bill paid, refund in flight) |
| 422 | The payments service refused it — its own words are in `message` |
| 502 | The payments service failed or could not be reached |
| 503 | A service is not configured (BBPS URLs unset) |

**Wallet scoping** — for reports (`/api/transfers`, `/api/ledger`, `/api/pg/transfers`, `/api/bbps/payments`, `/api/qr/requests`) a non-admin always reads their own wallet. Admins may pass `walletId` (a customer's wallet, or `0` for every wallet).

## Routes

| Route | Methods | Access |
| --- | --- | --- |
| **Auth & me** | | |
| `/api/auth/login` | POST `{username, password}` → `{user}` | public |
| `/api/auth/logout` | POST | public |
| `/api/auth/session` | GET → `{user \| null}` | public |
| `/api/me/wallet` | GET → Wallet | user |
| `/api/me/profile` | GET → Customer | user |
| `/api/me/credentials` | POST `{oldPassword, oldPasspin, newPassword, newPasspin}` | user |
| `/api/me/retailers` | GET → MappedRetailer[] (distributors) | user |
| **Customers (admin)** | | |
| `/api/customers` | GET (`?include=wallets`), POST | admin |
| `/api/customers/:customerId` | GET, PUT, DELETE | admin |
| `/api/customers/:customerId/wallet` | GET, POST (provision) | admin |
| `/api/customers/:customerId/wallet/credit` | POST `{amount}` | admin |
| `/api/customers/:customerId/wallet/payout-charges` | PUT `{payoutCharges}` | admin |
| `/api/customers/:customerId/wallet/reset-password` | POST `{newPassword?, newPin?}` | admin |
| `/api/customers/:customerId/distributor-retailers` | GET, POST `{retailerWalletId, pgCommissionPercent}` | admin |
| `/api/retailers` | GET → RetailerOption[] | admin |
| `/api/roles` | GET | admin |
| `/api/client` | GET (the master client) | admin |
| `/api/wallet/transfer` | POST `{toWalletId, amount}` (from own wallet) | admin |
| **IMPS** | | |
| `/api/senders` | GET `?mobile=`, POST | user |
| `/api/banks` | GET | user |
| `/api/bank-accounts` | GET `?mobile=`, POST | user |
| `/api/bank-accounts/all` | GET | admin |
| `/api/bank-accounts/verify` | POST `{accountNumber, ifsc}` (charged to own wallet) | user |
| `/api/transfers` | GET `?fromDate&toDate[&walletId]`, POST `{senderId, bankAccountId, amount, pin}` | user |
| `/api/transfers/today` | GET | user |
| `/api/ledger` | GET `?fromDate&toDate[&walletId]` | user |
| **Card collection (PG)** | | |
| `/api/pg/gateways` | GET (mapped to own wallet) | user |
| `/api/pg/links` | POST `{pgCode, customerName, cardLast4, amount}` | user |
| `/api/pg/status` | GET `?token=` or `?referenceId=` | public |
| `/api/pg/transfers` | GET `?fromDate&toDate[&walletId]` | user |
| **PG settings (admin)** | | |
| `/api/pg-settings/groups`, `/:id` | GET, POST / PUT, DELETE | admin |
| `/api/pg-settings/categories`, `/:id` | GET, POST / PUT, DELETE | admin |
| `/api/pg-settings/gateways`, `/:id` | GET, POST / PUT, DELETE | admin |
| `/api/pg-settings/settlements`, `/:id` | POST / PUT, DELETE | admin |
| `/api/pg-settings/sync` | POST (apply to every retailer) | admin |
| `/api/pg-settings/apply-to-wallet` | POST `{walletId}` | admin |
| **QR** | | |
| `/api/qr/next` | POST (pull next static QR) | user |
| `/api/qr/requests` | GET (`?scope=all` admin, `?walletId`), POST `{qrId, vpa, amount, utr, remarks?}` | user |
| `/api/qr/requests/pending` | GET | admin |
| `/api/qr/requests/:id/approve` | POST | admin |
| `/api/qr/requests/:id/reject` | POST `{remarks}` | admin |
| `/api/qr/codes` | GET, POST | admin |
| **Credit card bills (BBPS)** | | |
| `/api/bbps/billers` | GET `?category=credit-card` | user |
| `/api/bbps/bills/fetch` | POST `{billerId, values}` | user |
| `/api/bbps/bills/pay` | POST `{reference, amount}` | user |
| `/api/bbps/payments` | GET `?fromDate&toDate[&status][&walletId]` | user |
| **Admin** | | |
| `/api/admin/dashboard` | GET | admin |
| `/api/admin/dashboard/log` | GET `?fromDate&toDate` | admin |
| `/api/admin/dashboard/explain` | GET | admin |
| `/api/admin/reports/imps` | GET `?fromDate&toDate` | admin |
| `/api/admin/reports/pg` | GET `?fromDate&toDate` | admin |
| `/api/admin/reports/customer-business` | GET `?fromDate&toDate` | admin |
| `/api/admin/refunds` | POST `{id, remarks?}` | admin |
| `/api/admin/pullbacks` | POST `{walletId, amount, remarks?}` (into own wallet) | admin |
| **Announcements** | | |
| `/api/announcements` | GET (`?scope=all` admin), POST | user / admin |
| `/api/announcements/:id` | PUT | admin |

Types for every body and response are in `src/types`; validation rules are in `src/lib/validation/schemas.ts`.
