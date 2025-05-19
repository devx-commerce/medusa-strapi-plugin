import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { deleteCategoriesStrapiStep } from "./steps/delete-categories-strapi";

type WorkflowInput = {
  category_ids: string[];
};

export const deleteCategoriesStrapiWorkflow = createWorkflow(
  { name: "delete-categories-strapi-workflow" },
  (input: WorkflowInput) => {
    const strapiCategories = deleteCategoriesStrapiStep({
      category_ids: input.category_ids,
    });

    return new WorkflowResponse(strapiCategories);
  },
);
