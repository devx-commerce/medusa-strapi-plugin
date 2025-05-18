import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { deleteProductsStrapiStep } from "./steps/delete-products-strapi";

type WorkflowInput = {
  product_ids: string[];
};

export const deleteProductsStrapiWorkflow = createWorkflow(
  { name: "delete-products-strapi-workflow" },
  (input: WorkflowInput) => {
    const strapiProducts = deleteProductsStrapiStep({
      product_ids: input.product_ids,
    });

    return new WorkflowResponse(strapiProducts);
  },
);
