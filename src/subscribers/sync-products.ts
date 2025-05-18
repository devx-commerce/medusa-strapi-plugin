import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createProductsStrapiWorkflow } from "../workflows/create-products-strapi";

export default async function syncProductsHandler({
  container,
}: SubscriberArgs<Record<string, unknown>>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const logger = container.resolve("logger");

  const batchSize = 100;
  let hasMore = true;
  let offset = 0;
  let totalCount = 0;

  while (hasMore) {
    const { data: products, metadata: { count } = {} } = await query.graph({
      entity: "product",
      fields: ["id"],
      pagination: {
        skip: offset,
        take: batchSize,
      },
    });

    if (products.length) {
      await createProductsStrapiWorkflow(container).run({
        input: {
          product_ids: products.map((product) => product.id),
        },
      });
    }

    hasMore = products.length === batchSize;
    offset += batchSize;
    totalCount = count ?? 0;
  }

  logger.log(`Synced ${totalCount} products to Strapi`);
}

export const config: SubscriberConfig = {
  event: "strapi.sync",
};
