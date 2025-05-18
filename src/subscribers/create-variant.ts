import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework";
import { createProductsStrapiWorkflow } from "../workflows/create-products-strapi";

export default async function handleProductVariantCreate({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger");
  const product = container.resolve("product");

  const [productVariant] = await product.listProductVariants(
    {
      id: data.id,
    },
    {
      select: ["product_id"],
    },
  );

  if (productVariant?.product_id) {
    await createProductsStrapiWorkflow(container).run({
      input: {
        product_ids: [productVariant.product_id],
      },
    });
  }

  logger.log("Product Variant created in Strapi");
}

export const config: SubscriberConfig = {
  event: "product-variant.created",
};
