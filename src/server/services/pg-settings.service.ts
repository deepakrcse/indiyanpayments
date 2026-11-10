import 'server-only';
import { masterClientId } from '@/server/config/env';
import { badGateway } from '@/server/http/errors';
import { rowsOf } from '@/server/http/fields';
import { remotePost } from '@/server/http/remote-api';
import { toPaymentGateway, toPgCategory, toPgGroup } from '@/server/mappers/pg.mapper';
import type {
  PaymentGateway,
  PaymentGatewayInput,
  PgCategory,
  PgCategoryInput,
  PgGroup,
  PgGroupInput,
  PgSettlementInput,
} from '@/types/pg';

/**
 * Admin CRUD for the PG tree: Groups → Categories → Payment Gateways → Settlements.
 * Insert/Update answer only an id or a row count, so every write is followed by a re-read.
 */
async function call(path: string, body: Record<string, unknown>, failure: string) {
  const result = await remotePost(path, { client_ID: masterClientId(), ...body });
  if (!result.ok) throw badGateway(result.message, failure);
  return result;
}

// ── Groups ────────────────────────────────────────────────────────────────
export async function listGroups(): Promise<PgGroup[]> {
  return rowsOf((await call('PgSettings/Group/SelectAll', {}, 'Could not load the PG groups.')).data).map(toPgGroup);
}

export async function createGroup(input: PgGroupInput) {
  await call('PgSettings/Group/Insert', { groupName: input.groupName, logoUrl: input.logoUrl ?? '', displayOrder: input.displayOrder }, 'The group could not be saved.');
}

export async function updateGroup(id: number, input: PgGroupInput) {
  await call(
    'PgSettings/Group/Update',
    { id, groupName: input.groupName, logoUrl: input.logoUrl ?? '', displayOrder: input.displayOrder, isActive: input.isActive },
    'The group could not be updated.',
  );
}

export async function deleteGroup(id: number) {
  await call('PgSettings/Group/Delete', { id }, 'The group could not be deleted.');
}

// ── Categories ────────────────────────────────────────────────────────────
export async function listCategories(): Promise<PgCategory[]> {
  return rowsOf((await call('PgSettings/Category/SelectAll', {}, 'Could not load the PG categories.')).data).map(toPgCategory);
}

export async function createCategory(input: PgCategoryInput) {
  await call('PgSettings/Category/Insert', { categoryName: input.categoryName, displayOrder: input.displayOrder }, 'The category could not be saved.');
}

export async function updateCategory(id: number, input: PgCategoryInput) {
  await call(
    'PgSettings/Category/Update',
    { id, categoryName: input.categoryName, displayOrder: input.displayOrder, isActive: input.isActive },
    'The category could not be updated.',
  );
}

export async function deleteCategory(id: number) {
  await call('PgSettings/Category/Delete', { id }, 'The category could not be deleted.');
}

// ── Payment gateways (settlements arrive nested in each one) ─────────────
export async function listGateways(): Promise<PaymentGateway[]> {
  return rowsOf((await call('PgSettings/Pg/SelectAll', {}, 'Could not load the payment gateways.')).data).map(toPaymentGateway);
}

export async function createGateway(input: PaymentGatewayInput) {
  await call(
    'PgSettings/Pg/Insert',
    { groupId: input.groupId, categoryId: input.categoryId, pgName: input.pgName, description: input.description ?? '', displayOrder: input.displayOrder },
    'The payment gateway could not be saved.',
  );
}

export async function updateGateway(id: number, input: PaymentGatewayInput) {
  await call(
    'PgSettings/Pg/Update',
    {
      id,
      groupId: input.groupId,
      categoryId: input.categoryId,
      pgName: input.pgName,
      description: input.description ?? '',
      displayOrder: input.displayOrder,
      isActive: input.isActive,
    },
    'The payment gateway could not be updated.',
  );
}

export async function deleteGateway(id: number) {
  await call('PgSettings/Pg/Delete', { id }, 'The payment gateway could not be deleted.');
}

// ── Settlements ───────────────────────────────────────────────────────────
const settlementBody = (s: PgSettlementInput) => ({
  settlementName: s.settlementName,
  settlementDays: s.settlementDays,
  pgKey: s.pgKey ?? '',
  partnerChargeType: s.partnerChargeType,
  partnerChargeValue: s.partnerChargeValue,
  partnerMinCharge: s.partnerMinCharge,
  chargeType: s.chargeType,
  chargeValue: s.chargeValue,
  minCharge: s.minCharge,
});

export async function createSettlement(input: PgSettlementInput) {
  await call('PgSettings/Settlement/Insert', { pgId: input.pgId, ...settlementBody(input) }, 'The settlement could not be saved.');
}

/** Update identifies the row by id alone; the PG it belongs to does not change. */
export async function updateSettlement(id: number, input: PgSettlementInput) {
  await call('PgSettings/Settlement/Update', { id, ...settlementBody(input), isActive: input.isActive }, 'The settlement could not be updated.');
}

export async function deleteSettlement(id: number) {
  await call('PgSettings/Settlement/Delete', { id }, 'The settlement could not be deleted.');
}

// ── Pushing the setup out to wallets ──────────────────────────────────────
/** Pushes the current Group/Category/PG/Settlement setup to every retailer wallet ("Apply to all"). */
export async function syncToAllRetailers() {
  const result = await call('PgSettings/WalletMapping/SyncToRetailers', {}, 'The setup could not be applied.');
  return { message: result.message || 'Applied to every retailer.' };
}

/** The same, for one retailer's wallet ("Apply to one retailer"). */
export async function applyToWallet(walletId: number) {
  const result = await call('PgSettings/WalletMapping/ApplyToWallet', { walletId }, 'The setup could not be applied.');
  return { message: result.message || 'Applied to that retailer.' };
}
