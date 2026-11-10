'use client';

import { SearchSelect } from '@/components/ui/search-select';
import type { Bank } from '@/types/imps';

/** A bank picker you can type into — matches any part of the name or the bank code. */
export function BankCombobox({ banks, value, onSelect, id, invalid }: { banks: Bank[]; value: string; onSelect: (bank: Bank | null) => void; id?: string; invalid?: boolean }) {
  return (
    <SearchSelect
      id={id}
      invalid={invalid}
      options={banks.map((b) => ({ value: b.bankName, label: b.bankName, hint: b.bankCode }))}
      value={value}
      onChange={(name) => onSelect(banks.find((b) => b.bankName === name) ?? null)}
      placeholder="Type to search banks…"
      emptyText="No bank matches."
      loading={banks.length === 0}
    />
  );
}
