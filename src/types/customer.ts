export interface Customer {
  id: number;
  clientId: number;
  fullName: string;
  pan: string;
  aadhaar: string;
  /** YYYY-MM-DD */
  dateOfBirth: string;
  residentialAddress: string;
  storeName: string;
  storeAddress: string;
  gst: string;
  mobileNumber: string;
  email: string;
  /** Set once a wallet has been provisioned. */
  username: string | null;
  hasWallet: boolean;
  lastBalance: number;
  isActive: boolean | null;
  roleId: number | null;
  roleName: string;
}

export interface CustomerWithWallet extends Customer {
  wallet: import('./wallet').Wallet | null;
}

export interface CustomerInput {
  fullName: string;
  pan: string;
  aadhaar: string;
  dateOfBirth: string;
  mobileNumber: string;
  email: string;
  gst?: string | null;
  residentialAddress: string;
  storeName: string;
  storeAddress: string;
  roleId?: number | null;
}

export interface RoleOption {
  id: number;
  roleName: string;
}

export interface ClientInfo {
  id: number;
  clientName: string;
  clientCity: string | null;
  firmName: string | null;
}

/** A customer with a wallet, as the retailer pickers list them. */
export interface RetailerOption {
  customerId: number;
  walletId: number;
  fullName: string;
  storeName: string;
  roleName: string;
}

export interface MappedRetailer {
  id: number;
  retailerWalletId: number;
  distributorWalletId: number;
  pgCommissionPercent: number | null;
  fullName: string;
  mobileNumber: string;
  storeName: string;
  username: string;
  currentBalance: number;
}
