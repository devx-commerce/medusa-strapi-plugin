import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { upsertProductVariantsStrapiWorkflow } from "../workflows/upsert-product-variants-strapi";

export default async function handleProductVariantCreate({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

  await upsertProductVariantsStrapiWorkflow(container).run({
    input: {
      variant_ids: [data.id],
    },
  });

  logger.log("Product Variant updated in Strapi");
}

export const config: SubscriberConfig = {
  event: "product-variant.updated",
};
