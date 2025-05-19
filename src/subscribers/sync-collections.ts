import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createCollectionsStrapiWorkflow } from "../workflows/create-collections-strapi";

export default async function syncCollectionsHandler({
  container,
}: SubscriberArgs<Record<string, unknown>>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const logger = container.resolve("logger");

  const batchSize = 100;
  let hasMore = true;
  let offset = 0;
  let totalCount = 0;

  while (hasMore) {
    const { data: collections, metadata: { count } = {} } = await query.graph({
      entity: "product_collection",
      fields: ["id"],
      pagination: {
        skip: offset,
        take: batchSize,
      },
    });

    if (collections.length) {
      await createCollectionsStrapiWorkflow(container).run({
        input: {
          collection_ids: collections.map((collection) => collection.id),
        },
      });
    }

    hasMore = collections.length === batchSize;
    offset += batchSize;
    totalCount = count ?? 0;
  }

  logger.log(`Synced ${totalCount} collections to Strapi`);
}

export const config: SubscriberConfig = {
  event: "strapi-collections.sync",
};
