import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { upsertProductsStrapiWorkflow } from "../workflows/upsert-products-strapi";

export default async function handleProductCreate({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

  await upsertProductsStrapiWorkflow(container).run({
    input: {
      product_ids: [data.id],
    },
  });

  logger.log("Product created in Strapi");
}

export const config: SubscriberConfig = {
  event: "product.created",
};
