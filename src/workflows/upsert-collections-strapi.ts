import { ProductCollectionDTO } from "@medusajs/framework/types";
import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { upsertCollectionStrapiStep } from "./steps/upsert-collections-strapi";

type WorkflowInput = {
  collection_ids: string[];
};

export const upsertCollectionsStrapiWorkflow = createWorkflow(
  { name: "upsert-collection-strapi-workflow" },
  (input: WorkflowInput) => {
    const { data } = useQueryGraphStep({
      entity: "product_collection",
      fields: ["id", "title", "handle", "metadata"],
      filters: {
        id: input.collection_ids,
      },
    });

    const strapiCollections = upsertCollectionStrapiStep({
      collections: data as ProductCollectionDTO[],
    });

    return new WorkflowResponse(strapiCollections);
  },
);
