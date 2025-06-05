import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { upsertCollectionsStrapiWorkflow } from "../workflows/upsert-collections-strapi";

export default async function handleCollectionUpdate({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

  await upsertCollectionsStrapiWorkflow(container).run({
    input: {
      collection_ids: [data.id],
    },
  });

  logger.log("Collection updated in Strapi");
}

export const config: SubscriberConfig = {
  event: "product-collection.updated",
};
