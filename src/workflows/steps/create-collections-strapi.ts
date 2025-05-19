import { ProductCollectionDTO } from "@medusajs/framework/types";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { STRAPI_MODULE } from "../../modules/strapi";
import StrapiModuleService from "../../modules/strapi/service";

type EntryProps = {
  documentId: string;
  collectionId: string;
};

type StepInput = {
  collections: ProductCollectionDTO[];
};

export const createCollectionStrapiStep = createStep(
  "create-collections-strapi-step",
  async (input: StepInput, { container }) => {
    const strapiModuleService: StrapiModuleService =
      container.resolve(STRAPI_MODULE);

    const collections: EntryProps[] = [];

    try {
      for (const collection of input.collections) {
        collections.push(
          (await strapiModuleService.createCollection(
            collection,
          )) as unknown as EntryProps,
        );
      }
    } catch (e) {
      return StepResponse.permanentFailure(
        `Error creating collections in Strapi: ${e.message}`,
        collections,
      );
    }

    return new StepResponse(collections, collections);
  },
  async (collections, { container }) => {
    if (!collections) {
      return;
    }

    const strapiModuleService: StrapiModuleService =
      container.resolve(STRAPI_MODULE);

    for (const collection of collections) {
      await strapiModuleService.deleteCollection(collection.collectionId);
    }
  },
);
