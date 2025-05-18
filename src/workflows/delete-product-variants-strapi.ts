import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { deleteProductVariantsStrapiStep } from "./steps/delete-product-variants-strapi";

type WorkflowInput = {
  variant_ids: string[];
};

export const deleteProductVariantsStrapiWorkflow = createWorkflow(
  { name: "delete-product-variants-strapi-workflow" },
  (input: WorkflowInput) => {
    const strapiProductVariants = deleteProductVariantsStrapiStep({
      variant_ids: input.variant_ids,
    });

    return new WorkflowResponse(strapiProductVariants);
  },
);
