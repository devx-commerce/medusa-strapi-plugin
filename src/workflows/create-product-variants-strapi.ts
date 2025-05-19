import { ProductVariantDTO } from "@medusajs/framework/types";
import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { createProductVariantsStrapiStep } from "./steps/create-product-variants-strapi";

type WorkflowInput = {
  variant_ids: string[];
};

export const createProductVariantsStrapiWorkflow = createWorkflow(
  { name: "create-product-variants-strapi-workflow" },
  (input: WorkflowInput) => {
    const { data } = useQueryGraphStep({
      entity: "product_variant",
      fields: ["id", "title", "sku"],
      filters: {
        id: input.variant_ids,
      },
    });

    const strapiVariants = createProductVariantsStrapiStep({
      variants: data as ProductVariantDTO[],
    });

    return new WorkflowResponse(strapiVariants);
  },
);
