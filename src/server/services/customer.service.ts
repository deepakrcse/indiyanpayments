import 'server-only';
import { masterClientId } from '@/server/config/env';
import { badGateway, badRequest, notFound } from '@/server/http/errors';
import { firstOf, rowsOf } from '@/server/http/fields';
import { remotePost } from '@/server/http/remote-api';
import { toClient, toCustomer, toRole } from '@/server/mappers/customer.mapper';
import { toWallet } from '@/server/mappers/wallet.mapper';
import type { ClientInfo, Customer, CustomerInput, CustomerWithWallet, RoleOption } from '@/types/customer';

/**
 * Customers — always the master client's. The unscoped `customer/Select` (every business on
 * the shared remote) is deliberately never called.
 */
export async function listCustomers(): Promise<Customer[]> {
  const result = await remotePost('customer/SelectByClientId', { client_ID: masterClientId() });
  return rowsOf(result.data).map(toCustomer);
}

/**
 * The remote's SelectById is not client-scoped, so a bare id could fetch another tenant's
 * customer. Anything not owned by the master client is reported as missing.
 */
export async function findOwnedCustomer(id: number): Promise<Customer | null> {
  const result = await remotePost('customer/SelectById', { id });
  const row = firstOf(result.data);
  if (!row) return null;
  const customer = toCustomer(row);
  return customer.clientId === masterClientId() ? customer : null;
}

export async function getOwnedCustomer(id: number): Promise<Customer> {
  const customer = await findOwnedCustomer(id);
  if (!customer) throw notFound('This customer no longer exists.');
  return customer;
}

/** The exact wire record customer/Insert and customer/Update take. */
function toRemoteCustomer(id: number, input: CustomerInput) {
  return {
    id,
    Client_ID: masterClientId(),
    PAN: input.pan,
    ADHAAR: input.aadhaar,
    FULL_NAME: input.fullName,
    DATE_OF_BIRTH: input.dateOfBirth,
    RESIDENTIAL_ADDRESS: input.residentialAddress,
    STORE_NAME: input.storeName,
    STORE_ADDRESS: input.storeAddress,
    // The remote GST column is NOT NULL: an empty value travels as "".
    GST: input.gst ?? '',
    MOBILE_NUMBER: input.mobileNumber,
    EMAIL_ID: input.email,
    username: null,
    lastBalance: 0,
    isActive: null,
    payoutCharges: 0,
    walletId: 0,
    roleId: input.roleId ?? null,
    roleName: null,
  };
}

async function assertMasterClientExists() {
  const client = await remotePost('Client/SelectById', { id: masterClientId() });
  if (!firstOf(client.data)) throw badRequest('The portal’s client is not set up on the payments service.');
}

/**
 * customer/Insert and Update silently ignore RoleId; Customer/AssignRole (undocumented) is the
 * only way to set it. Its own status is unreliable, so the caller re-reads the customer.
 */
async function assignRole(id: number, roleId: number) {
  await remotePost('Customer/AssignRole', { id, roleId });
}

export async function createCustomer(input: CustomerInput): Promise<Customer> {
  await assertMasterClientExists();
  const result = await remotePost<number>('customer/Insert', toRemoteCustomer(0, input));
  const newId = typeof result.data === 'number' ? result.data : Number(result.data);
  if (!result.ok || !Number.isInteger(newId) || newId <= 0) throw badGateway(result.message, 'The customer could not be created.');
  if (input.roleId) await assignRole(newId, input.roleId);
  return getOwnedCustomer(newId);
}

export async function updateCustomer(id: number, input: CustomerInput): Promise<Customer> {
  await getOwnedCustomer(id);
  await assertMasterClientExists();
  const result = await remotePost('customer/Update', toRemoteCustomer(id, input));
  if (!result.ok) throw badGateway(result.message, 'The customer could not be updated.');
  if (input.roleId) await assignRole(id, input.roleId);
  return getOwnedCustomer(id);
}

/** customer/Delete's own status reports failure even on success, so the result is confirmed by re-reading. */
export async function deleteCustomer(id: number): Promise<void> {
  await getOwnedCustomer(id);
  await remotePost('customer/Delete', { id });
  if (await findOwnedCustomer(id)) throw badGateway(null, 'The payments service did not delete the customer.');
}

/**
 * Every customer with their live wallet (balance, payout charges) — the wallet lives on its own
 * record, and the customer's lastBalance is only a snapshot. One browser round trip; the per-
 * customer lookups run in parallel here.
 */
export async function listCustomersWithWallets(): Promise<CustomerWithWallet[]> {
  const customers = await listCustomers();
  return Promise.all(
    customers.map(async (c) => {
      if (!c.hasWallet) return { ...c, wallet: null };
      const row = firstOf((await remotePost('wallet/SelectByCustomerId', { client_ID: masterClientId(), customerId: c.id })).data);
      return { ...c, wallet: row ? toWallet(row) : null };
    }),
  );
}

export async function listRoles(): Promise<RoleOption[]> {
  const result = await remotePost('Role/Select', {});
  return rowsOf(result.data).map(toRole);
}

/**
 * Only the master client, read-only. Listing every client would hand the browser other
 * businesses' details, and creating clients is not this portal's business.
 */
export async function getMasterClient(): Promise<ClientInfo | null> {
  const result = await remotePost('Client/SelectById', { id: masterClientId() });
  const row = firstOf(result.data);
  return row ? toClient(row) : null;
}
