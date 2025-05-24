import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { STRAPI_MODULE } from "../../modules/strapi";
import StrapiModuleService from "../../modules/strapi/service";

type StepInput = {
  collection_ids: string[];
};

export const deleteCollectionsStrapiStep = createStep(
  "delete-collections-strapi-step",
  async (input: StepInput, { container }) => {
    const strapiModuleService: StrapiModuleService =
      container.resolve(STRAPI_MODULE);

    const collections: (string | null)[] = [];

    try {
      for (const collection_id of input.collection_ids) {
        collections.push(
          await strapiModuleService.deleteCollection(collection_id),
        );
      }
    } catch (e) {
      return StepResponse.permanentFailure(
        `Error deleting collections in Strapi: ${e.message}`,
      );
    }

    return new StepResponse(collections, collections);
  },
);
