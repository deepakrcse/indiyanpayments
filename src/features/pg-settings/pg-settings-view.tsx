'use client';

import { useState } from 'react';
import { CreditCard, FolderTree, Layers } from 'lucide-react';
import { qk } from '@/lib/api/query-keys';
import { routes } from '@/config/routes';
import { PageHeader } from '@/components/ui/page-header';
import { SegmentedTabs } from '@/components/ui/tabs';
import { CatalogSection } from './catalog-section';
import { GatewaysSection } from './gateways-section';

type Section = 'gateways' | 'groups' | 'categories';

/** Admin › PG settings: Groups → Categories → Payment gateways → Settlements. */
export function PgSettingsView() {
  const [section, setSection] = useState<Section>('gateways');
  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="PG settings"
        description="Define what retailers see under Card collection, and what each option charges."
        back={routes.admin}
        actions={
          <SegmentedTabs<Section>
            label="Section"
            value={section}
            onChange={setSection}
            items={[
              { value: 'gateways', label: <span className="inline-flex items-center gap-1.5"><CreditCard className="size-3.5" /> Gateways</span> },
              { value: 'groups', label: <span className="inline-flex items-center gap-1.5"><Layers className="size-3.5" /> Groups</span> },
              { value: 'categories', label: <span className="inline-flex items-center gap-1.5"><FolderTree className="size-3.5" /> Categories</span> },
            ]}
          />
        }
      />
      {section === 'gateways' && <GatewaysSection />}
      {section === 'groups' && <CatalogSection resource="groups" queryKey={qk.pgGroups} nameField="groupName" itemLabel="PG group" itemLabelPlural="PG groups" icon={Layers} hasLogoUrl example="Retail Group" />}
      {section === 'categories' && <CatalogSection resource="categories" queryKey={qk.pgCategories} nameField="categoryName" itemLabel="PG category" itemLabelPlural="PG categories" icon={FolderTree} example="Education" />}
    </>
  );
}
