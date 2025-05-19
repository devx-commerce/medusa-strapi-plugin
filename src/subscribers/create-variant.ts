import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework";
import { createProductVariantsStrapiWorkflow } from "../workflows/create-product-variants-strapi";

export default async function handleProductVariantCreate({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger");

  await createProductVariantsStrapiWorkflow(container).run({
    input: {
      variant_ids: [data.id],
    },
  });

  logger.log("Product Variant created in Strapi");
}

export const config: SubscriberConfig = {
  event: "product-variant.created",
};
