import 'server-only';
import { masterClientId } from '@/server/config/env';
import { badGateway } from '@/server/http/errors';
import { rowsOf } from '@/server/http/fields';
import { remotePost } from '@/server/http/remote-api';
import { toDashboardExplain, toDashboardLogRow, toDashboardSummary } from '@/server/mappers/admin.mapper';
import type { DashboardExplain, DashboardLogRow, DashboardSummary } from '@/types/admin';

export async function dashboardSummary(): Promise<DashboardSummary> {
  const result = await remotePost('Dashboard/Get', { client_ID: masterClientId() });
  if (!result.ok || !result.data) throw badGateway(result.message, 'Could not load the dashboard.');
  return toDashboardSummary(result.data);
}

/** The dashboard's snapshots over a date range (both included): pipe balance vs. wallets, and the difference. */
export async function dashboardLog(fromDate: string, toDate: string): Promise<DashboardLogRow[]> {
  const result = await remotePost('Dashboard/Log', { client_ID: masterClientId(), fromDate, toDate });
  if (!result.ok) throw badGateway(result.message);
  return rowsOf(result.data).map(toDashboardLogRow);
}

/** Why the wallet total and the pipe balance differ: the totals plus what moved today. */
export async function dashboardExplain(): Promise<DashboardExplain> {
  const result = await remotePost('Dashboard/Explain', { client_ID: masterClientId() });
  if (!result.ok || !result.data || typeof result.data !== 'object') throw badGateway(result.message, 'Could not load the explanation.');
  return toDashboardExplain(result.data);
}
