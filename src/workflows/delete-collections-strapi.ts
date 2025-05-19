import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { deleteCollectionsStrapiStep } from "./steps/delete-collections-strapi";

type WorkflowInput = {
  collection_ids: string[];
};

export const deleteCollectionsStrapiWorkflow = createWorkflow(
  { name: "delete-collections-strapi-workflow" },
  (input: WorkflowInput) => {
    const strapiCollections = deleteCollectionsStrapiStep({
      collection_ids: input.collection_ids,
    });

    return new WorkflowResponse(strapiCollections);
  },
);
