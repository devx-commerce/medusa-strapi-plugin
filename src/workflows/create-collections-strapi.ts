import { ProductCollectionDTO } from "@medusajs/framework/types";
import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { createCollectionStrapiStep } from "./steps/create-collections-strapi";

type WorkflowInput = {
  collection_ids: string[];
};

export const createCollectionsStrapiWorkflow = createWorkflow(
  { name: "create-collection-strapi-workflow" },
  (input: WorkflowInput) => {
    const { data } = useQueryGraphStep({
      entity: "product_collection",
      fields: ["id", "title", "handle"],
      filters: {
        id: input.collection_ids,
      },
    });

    const strapiCollections = createCollectionStrapiStep({
      collections: data as ProductCollectionDTO[],
    });

    return new WorkflowResponse(strapiCollections);
  },
);
