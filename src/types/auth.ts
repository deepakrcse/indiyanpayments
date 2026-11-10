/** What the portal knows about whoever is signed in. Lives in the signed session cookie. */
export type Role = 'admin' | 'retailer' | 'distributor' | 'other';

export interface SessionUser {
  customerId: number;
  walletId: number;
  fullName: string;
  storeName: string;
  mobileNumber: string;
  email: string;
  username: string;
  roleId: number | null;
  roleName: string;
  role: Role;
  payoutCharges: number;
  /** Wallet balance at sign-in. The live figure comes from GET /api/me/wallet. */
  balanceAtLogin: number;
}

export interface LoginInput {
  username: string;
  password: string;
}
