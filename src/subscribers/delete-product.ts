import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework";
import { deleteProductsStrapiWorkflow } from "../workflows/delete-products-strapi";

export default async function handleProductDelete({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger");
  await deleteProductsStrapiWorkflow(container).run({
    input: {
      product_ids: [data.id],
    },
  });

  logger.log("Product deleted in Strapi");
}

export const config: SubscriberConfig = {
  event: "product.deleted",
};
