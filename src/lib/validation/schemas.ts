import { z } from 'zod';
import { MESSAGES, PATTERNS } from './patterns';

const trimmed = (max: number, required = 'This field is required.') =>
  z.string().trim().min(1, required).max(max, `Keep it under ${max} characters.`);

const optionalText = (max: number) =>
  z.string().trim().max(max, `Keep it under ${max} characters.`).optional().nullable();

const money = z.number({ error: MESSAGES.amount }).finite(MESSAGES.amount);
const positiveMoney = money.positive(MESSAGES.amount);
const isoDate = z.string().regex(PATTERNS.isoDate, 'Choose a valid date.');

// ── Auth & credentials ────────────────────────────────────────────────────
export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Enter your login ID.'),
  password: z.string().min(1, 'Enter your password.'),
});

export const changeCredentialsSchema = z.object({
  oldPassword: z.string().min(1, 'Enter your current password.'),
  oldPasspin: z.string().regex(PATTERNS.pin4, 'The current PIN must be 4 digits.'),
  newPassword: z.string().min(1, 'Enter a new password.').max(50),
  newPasspin: z.string().regex(PATTERNS.pin4, 'The new PIN must be 4 digits.'),
});

export const resetPasswordSchema = z
  .object({
    newPassword: z.string().trim().max(64).optional().nullable(),
    newPin: z.string().trim().optional().nullable(),
  })
  .superRefine((v, ctx) => {
    const password = v.newPassword || null;
    const pin = v.newPin || null;
    if (!password && !pin) ctx.addIssue({ code: 'custom', message: 'Enter a new password, a new PIN, or both.' });
    if (password && password.length < 6) ctx.addIssue({ code: 'custom', path: ['newPassword'], message: 'The password must be at least 6 characters.' });
    if (pin && !PATTERNS.pin4.test(pin)) ctx.addIssue({ code: 'custom', path: ['newPin'], message: 'The PIN must be exactly 4 digits.' });
  });

// ── Customers ─────────────────────────────────────────────────────────────
export const customerSchema = z.object({
  fullName: trimmed(150, 'Full name is required.'),
  pan: z.string().trim().toUpperCase().regex(PATTERNS.pan, MESSAGES.pan),
  aadhaar: z.string().trim().regex(PATTERNS.aadhaar, MESSAGES.aadhaar),
  dateOfBirth: isoDate,
  mobileNumber: z.string().trim().regex(PATTERNS.indianMobile, MESSAGES.indianMobile),
  email: z.email('Enter a valid email address.'),
  gst: z
    .string()
    .trim()
    .toUpperCase()
    .optional()
    .nullable()
    .refine((v) => !v || PATTERNS.gstin.test(v), MESSAGES.gstin),
  residentialAddress: trimmed(400, 'Residential address is required.'),
  storeName: trimmed(150, 'Store name is required.'),
  storeAddress: trimmed(400, 'Store address is required.'),
  roleId: z.number().int().positive().optional().nullable(),
});

export const payoutChargesSchema = z.object({
  payoutCharges: money.min(0, 'Enter a valid payout charge.'),
});

export const amountSchema = z.object({ amount: positiveMoney });

export const walletTransferSchema = z.object({
  toWalletId: z.number().int().positive('Choose a wallet to transfer to.'),
  amount: positiveMoney,
});

export const mappingSchema = z.object({
  retailerWalletId: z.number().int().positive('Choose a retailer.'),
  pgCommissionPercent: money
    .min(0, 'Enter a commission between 0 and 100.')
    .max(100, 'Enter a commission between 0 and 100.')
    .refine((v) => Math.round(v * 10_000) / 10_000 === v, 'Use up to 4 decimals.'),
});

// ── IMPS ──────────────────────────────────────────────────────────────────
export const senderSchema = z.object({
  mobileNumber: z.string().regex(PATTERNS.indianMobile, MESSAGES.indianMobile),
  senderName: trimmed(150, 'Sender name is required.'),
  senderAddress: optionalText(400),
  senderPan: z.string().trim().optional().nullable().refine((v) => !v || PATTERNS.pan.test(v), MESSAGES.pan),
  senderAadhaar: z.string().trim().optional().nullable().refine((v) => !v || PATTERNS.aadhaar.test(v), MESSAGES.aadhaar),
});

export const bankAccountSchema = z.object({
  mobileNumber: z.string().regex(PATTERNS.indianMobile, MESSAGES.indianMobile),
  accountHolderName: trimmed(150, 'Account holder name is required.'),
  accountNumber: z.string().trim().regex(PATTERNS.accountNumber, MESSAGES.accountNumber),
  ifsc: z.string().trim().toUpperCase().regex(PATTERNS.ifsc, MESSAGES.ifsc),
  bankName: trimmed(150, 'Bank name is required.'),
});

export const verifyAccountSchema = z.object({
  accountNumber: z.string().trim().regex(PATTERNS.accountNumber, MESSAGES.accountNumber),
  ifsc: z.string().trim().toUpperCase().regex(PATTERNS.ifsc, MESSAGES.ifsc),
});

export const MAX_IMPS_AMOUNT = 100_000;

export const impsTransferSchema = z.object({
  senderId: z.number().int().positive('Verify the sender first.'),
  bankAccountId: z.number().int().positive('Choose a bank account.'),
  amount: positiveMoney.max(MAX_IMPS_AMOUNT, `Amount cannot exceed ₹${MAX_IMPS_AMOUNT.toLocaleString('en-IN')}.`),
  pin: z.string().regex(PATTERNS.transferPin, 'Enter your 4-6 digit PIN.'),
});

// ── Payment gateway ───────────────────────────────────────────────────────
export const paymentLinkSchema = z.object({
  pgCode: z.string().trim().min(1, 'Choose a payment gateway.'),
  customerName: trimmed(150, 'Enter the customer name.'),
  cardLast4: z.string().regex(/^\d{4}$/, 'Enter the last 4 digits of the card.'),
  amount: positiveMoney,
});

const chargeType = z.enum(['PERCENT', 'VALUE']);

export const pgGroupSchema = z.object({
  groupName: trimmed(150, 'Enter a name.'),
  logoUrl: optionalText(500),
  displayOrder: z.number({ error: 'Enter a display order.' }).int(),
  isActive: z.boolean().default(true),
});

export const pgCategorySchema = z.object({
  categoryName: trimmed(150, 'Enter a name.'),
  displayOrder: z.number({ error: 'Enter a display order.' }).int(),
  isActive: z.boolean().default(true),
});

export const paymentGatewaySchema = z.object({
  groupId: z.number().int().positive('Choose a group.'),
  categoryId: z.number().int().positive('Choose a category.'),
  pgName: trimmed(150, 'Enter a name.'),
  description: optionalText(500),
  displayOrder: z.number({ error: 'Enter a display order.' }).int(),
  isActive: z.boolean().default(true),
});

export const pgSettlementSchema = z.object({
  pgId: z.number().int().nonnegative().default(0),
  settlementName: trimmed(150, 'Enter a settlement name.'),
  settlementDays: z.number({ error: 'Enter the settlement days.' }).int().min(0),
  pgKey: optionalText(100),
  partnerChargeType: chargeType,
  partnerChargeValue: money,
  partnerMinCharge: money,
  chargeType,
  chargeValue: money,
  minCharge: money,
  isActive: z.boolean().default(true),
});

// ── QR ────────────────────────────────────────────────────────────────────
export const qrCodeSchema = z.object({
  qrName: trimmed(100, 'Enter a name.'),
  vpa: z.string().trim().min(3, 'Enter the VPA.'),
  chargeType,
  chargeValue: money.min(0),
  minCharge: money.min(0),
  dailyMaxLimit: money.min(0),
  displayOrder: z.number().int(),
});

export const qrCollectSchema = z.object({
  qrId: z.number().int(),
  vpa: z.string().trim().min(1, 'Select a VPA.'),
  amount: positiveMoney,
  utr: z.string().trim().min(1, 'Enter the UTR.').max(64),
  remarks: z.string().trim().max(200).optional(),
});

export const qrRejectSchema = z.object({
  remarks: z.string().trim().min(1, 'Enter a reason for rejecting this request.').max(200),
});

// ── Bills ─────────────────────────────────────────────────────────────────
export const fetchBillSchema = z.object({
  billerId: z.string().trim().min(1, 'Choose a bank.'),
  values: z.record(z.string(), z.string().max(64)),
});

export const payBillSchema = z.object({
  reference: z.string().trim().min(1, 'This bill has expired. Fetch the bill again to pay.'),
  amount: positiveMoney.refine((v) => Math.round(v * 100) / 100 === v, MESSAGES.amount),
});

// ── Admin ─────────────────────────────────────────────────────────────────
export const refundSchema = z.object({
  id: z.number().int().positive('Choose a transaction to refund.'),
  remarks: z.string().trim().max(200).optional(),
});

export const pullbackSchema = z.object({
  walletId: z.number().int().positive('Choose the retailer.'),
  amount: positiveMoney.refine((v) => Math.round(v * 100) / 100 === v, MESSAGES.amount),
  remarks: z.string().trim().max(200).optional(),
});

export const announcementSchema = z.object({
  title: trimmed(100, 'Enter a title.'),
  message: trimmed(500, 'Enter the message.'),
  isActive: z.boolean().default(true),
});

export const dateRangeSchema = z.object({
  fromDate: isoDate,
  toDate: isoDate,
});

export type CustomerFormValues = z.infer<typeof customerSchema>;
