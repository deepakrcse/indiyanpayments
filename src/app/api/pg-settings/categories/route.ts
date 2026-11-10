import { adminRoute, readBody } from '@/server/http/route';
import { createCategory, listCategories } from '@/server/services/pg-settings.service';
import { pgCategorySchema } from '@/lib/validation/schemas';

export const GET = adminRoute(async () => listCategories());

export const POST = adminRoute(async ({ req }) => {
  await createCategory(await readBody(req, pgCategorySchema));
  return listCategories();
});
