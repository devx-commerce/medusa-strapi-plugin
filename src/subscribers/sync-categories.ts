import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { upsertCategoriesStrapiWorkflow } from "../workflows/upsert-categories-strapi";

export default async function syncCategoriesHandler({
  container,
}: SubscriberArgs<Record<string, unknown>>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

  const batchSize = 100;
  let hasMore = true;
  let offset = 0;
  let totalCount = 0;

  while (hasMore) {
    const { data: categories, metadata: { count } = {} } = await query.graph({
      entity: "product_category",
      fields: ["id"],
      pagination: {
        skip: offset,
        take: batchSize,
      },
    });

    if (categories.length) {
      await upsertCategoriesStrapiWorkflow(container).run({
        input: {
          category_ids: categories.map((category) => category.id),
        },
      });
    }

    hasMore = categories.length === batchSize;
    offset += batchSize;
    totalCount = count ?? 0;
  }

  logger.log(`Synced ${totalCount} categories to Strapi`);
}

export const config: SubscriberConfig = {
  event: "strapi-categories.sync",
};
