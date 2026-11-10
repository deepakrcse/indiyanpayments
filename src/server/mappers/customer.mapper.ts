import 'server-only';
import { dateOnly, fields } from '@/server/http/fields';
import type { ClientInfo, Customer, MappedRetailer, RoleOption } from '@/types/customer';

export function toCustomer(raw: unknown): Customer {
  const f = fields(raw);
  const username = f.str('username');
  return {
    id: f.int('Id'),
    clientId: f.int('Client_ID'),
    fullName: f.text('FULL_NAME'),
    pan: f.text('PAN'),
    aadhaar: f.text('ADHAAR'),
    dateOfBirth: dateOnly(f.str('DATE_OF_BIRTH')),
    residentialAddress: f.text('RESIDENTIAL_ADDRESS'),
    storeName: f.text('STORE_NAME'),
    storeAddress: f.text('STORE_ADDRESS'),
    gst: f.text('GST'),
    mobileNumber: f.text('MOBILE_NUMBER'),
    email: f.text('EMAIL_ID'),
    username,
    hasWallet: username !== null,
    lastBalance: f.amount('lastBalance'),
    isActive: f.bool('isActive'),
    roleId: f.num('roleId'),
    roleName: (f.str('roleName') ?? '').trim(),
  };
}

export const toRole = (raw: unknown): RoleOption => {
  const f = fields(raw);
  return { id: f.int('Id'), roleName: f.text('RoleName') };
};

export const toClient = (raw: unknown): ClientInfo => {
  const f = fields(raw);
  return { id: f.int('Id'), clientName: f.text('ClientName'), clientCity: f.str('ClientCity'), firmName: f.str('FirmName') };
};

export function toMappedRetailer(raw: unknown): MappedRetailer {
  const f = fields(raw);
  return {
    id: f.int('Id'),
    retailerWalletId: f.int('retailerWalletId'),
    distributorWalletId: f.int('distributorWalletId'),
    pgCommissionPercent: f.num('pgCommissionPercent'),
    fullName: f.text('FULL_NAME'),
    mobileNumber: f.text('MOBILE_NUMBER'),
    storeName: f.text('STORE_NAME'),
    username: f.text('username'),
    currentBalance: f.amount('currentBalance'),
  };
}
