import { ProductCategoryDTO } from "@medusajs/framework/types";
import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { createCategoriesStrapiStep } from "./steps/create-categories-strapi";

type WorkflowInput = {
  category_ids: string[];
};

export const createCategoriesStrapiWorkflow = createWorkflow(
  { name: "create-categories-strapi-workflow" },
  (input: WorkflowInput) => {
    // @ts-ignore
    const { data } = useQueryGraphStep({
      entity: "product_category",
      fields: ["id", "name", "handle", "parent_category_id"],
      filters: {
        id: input.category_ids,
      },
    });

    const strapiCategories = createCategoriesStrapiStep({
      categories: data as ProductCategoryDTO[],
    });

    return new WorkflowResponse(strapiCategories);
  },
);
