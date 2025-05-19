import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework";
import { deleteCollectionsStrapiWorkflow } from "../workflows/delete-collections-strapi";

export default async function handleCollectionDelete({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger");
  await deleteCollectionsStrapiWorkflow(container).run({
    input: {
      collection_ids: [data.id],
    },
  });

  logger.log("Collection deleted in Strapi");
}

export const config: SubscriberConfig = {
  event: "product-collection.deleted",
};
