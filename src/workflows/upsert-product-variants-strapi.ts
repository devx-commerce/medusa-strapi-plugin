import { ProductVariantDTO } from "@medusajs/framework/types";
import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { upsertProductVariantsStrapiStep } from "./steps/upsert-product-variants-strapi";

type WorkflowInput = {
  variant_ids: string[];
};

export const upsertProductVariantsStrapiWorkflow = createWorkflow(
  { name: "upsert-product-variants-strapi-workflow" },
  (input: WorkflowInput) => {
    const { data } = useQueryGraphStep({
      entity: "product_variant",
      fields: ["id", "title", "sku", "product_id", "metadata"],
      filters: {
        id: input.variant_ids,
      },
    });

    const strapiVariants = upsertProductVariantsStrapiStep({
      variants: data as ProductVariantDTO[],
    });

    return new WorkflowResponse(strapiVariants);
  },
);
