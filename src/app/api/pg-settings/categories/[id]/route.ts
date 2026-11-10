import { adminRoute, positiveId, readBody } from '@/server/http/route';
import { deleteCategory, listCategories, updateCategory } from '@/server/services/pg-settings.service';
import { pgCategorySchema } from '@/lib/validation/schemas';

export const PUT = adminRoute(async ({ req, params }) => {
  await updateCategory(positiveId(params.id, 'category'), await readBody(req, pgCategorySchema));
  return listCategories();
});

export const DELETE = adminRoute(async ({ params }) => {
  await deleteCategory(positiveId(params.id, 'category'));
});
