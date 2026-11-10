import { buildReceipt, type Letterhead } from '@/lib/export/pdf';
import { saveBlob, shareFile } from '@/lib/export/download';
import { rupees } from '@/lib/format';

export interface ImpsReceipt {
  transactionId: number | string | null;
  dateTime: string;
  status: string;
  utr: string | null;
  senderName: string;
  senderMobile: string;
  accountHolderName: string;
  accountNumber: string;
  ifsc: string;
  bankName: string;
  bankLogoUrl: string | null;
  amount: number;
}

async function pdfFor(r: ImpsReceipt, head: Letterhead) {
  return buildReceipt(
    {
      title: 'IMPS transfer receipt',
      status: r.status || 'SUCCESS',
      fileName: `imps-receipt-${r.transactionId ?? 'transfer'}.pdf`,
      bankLogoUrl: r.bankLogoUrl,
      rows: [
        ['Transaction ID', r.transactionId ?? '—'],
        ['Date & time', r.dateTime],
        ['Sender', `${r.senderName} (${r.senderMobile})`],
        ['Beneficiary', r.accountHolderName],
        ['Account number', r.accountNumber],
        ['IFSC', r.ifsc],
        ['Bank', r.bankName || '—'],
        ['Amount', rupees(r.amount)],
        ['UTR', r.utr || String(r.transactionId ?? '—')],
      ],
    },
    head,
  );
}

const fileName = (r: ImpsReceipt) => `imps-receipt-${r.transactionId ?? 'transfer'}.pdf`;

export async function downloadImpsReceipt(r: ImpsReceipt, head: Letterhead) {
  const doc = await pdfFor(r, head);
  saveBlob(doc.output('blob'), fileName(r));
}

export async function shareImpsReceipt(r: ImpsReceipt, head: Letterhead) {
  const doc = await pdfFor(r, head);
  return shareFile(doc.output('blob'), fileName(r), 'IMPS transfer receipt', `IMPS transfer of ${rupees(r.amount)} to ${r.accountHolderName}`);
}
