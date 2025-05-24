import { ProductCategoryDTO } from "@medusajs/framework/types";
import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { upsertCategoriesStrapiStep } from "./steps/upsert-categories-strapi";

type WorkflowInput = {
  category_ids: string[];
};

export const upsertCategoriesStrapiWorkflow = createWorkflow(
  { name: "upsert-categories-strapi-workflow" },
  (input: WorkflowInput) => {
    const { data } = useQueryGraphStep({
      entity: "product_category",
      fields: ["id", "name", "handle", "metadata"],
      filters: {
        id: input.category_ids,
      },
    });

    const strapiCategories = upsertCategoriesStrapiStep({
      categories: data as ProductCategoryDTO[],
    });

    return new WorkflowResponse(strapiCategories);
  },
);
