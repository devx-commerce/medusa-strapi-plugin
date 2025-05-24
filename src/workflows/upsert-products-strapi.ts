import { ProductDTO } from "@medusajs/framework/types";
import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { upsertProductsStrapiStep } from "./steps/upsert-products-strapi";

type WorkflowInput = {
  product_ids: string[];
};

export const upsertProductsStrapiWorkflow = createWorkflow(
  { name: "upsert-products-strapi-workflow" },
  (input: WorkflowInput) => {
    const { data } = useQueryGraphStep({
      entity: "product",
      fields: [
        "id",
        "title",
        "type.value",
        "status",
        "handle",
        "variants.*",
        "metadata",
      ],
      filters: { id: input.product_ids },
    });

    const strapiProducts = upsertProductsStrapiStep({
      products: data as ProductDTO[],
    });

    return new WorkflowResponse(strapiProducts);
  },
);
