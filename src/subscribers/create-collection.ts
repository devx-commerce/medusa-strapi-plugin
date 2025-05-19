import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework";
import { createCollectionsStrapiWorkflow } from "../workflows/create-collections-strapi";

export default async function handleCollectionCreate({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger");
  await createCollectionsStrapiWorkflow(container).run({
    input: {
      collection_ids: [data.id],
    },
  });

  logger.log("Collection created in Strapi");
}

export const config: SubscriberConfig = {
  event: "product-collection.created",
};
