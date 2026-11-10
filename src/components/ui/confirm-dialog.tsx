'use client';

import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './button';
import { Dialog } from './dialog';

/** Asks before something that moves money or can't be undone. Nothing happens until confirmed. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  children,
  confirmLabel = 'Confirm',
  tone = 'danger',
  busy = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: ReactNode;
  children?: ReactNode;
  confirmLabel?: string;
  tone?: 'danger' | 'primary';
  busy?: boolean;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      dismissible={!busy}
      icon={<AlertTriangle />}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children && <div className="text-[13.5px] leading-relaxed text-slate-600">{children}</div>}
    </Dialog>
  );
}
