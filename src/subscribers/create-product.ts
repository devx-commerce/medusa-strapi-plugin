import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework";
import { createProductsStrapiWorkflow } from "../workflows/create-products-strapi";

export default async function handleProductCreate({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger");

  await createProductsStrapiWorkflow(container).run({
    input: {
      product_ids: [data.id],
    },
  });

  logger.log("Product created in Strapi");
}

export const config: SubscriberConfig = {
  event: "product.created",
};
