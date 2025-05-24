import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { deleteProductVariantsStrapiWorkflow } from "../workflows/delete-product-variants-strapi";

export default async function handleProductVariantDelete({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

  await deleteProductVariantsStrapiWorkflow(container).run({
    input: {
      variant_ids: [data.id],
    },
  });

  logger.log("Product variant deleted in Strapi");
}

export const config: SubscriberConfig = {
  event: "product-variant.deleted",
};
