import { ProductCollectionDTO } from "@medusajs/framework/types";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { STRAPI_MODULE } from "../../modules/strapi";
import StrapiModuleService from "../../modules/strapi/service";
import { Modules } from "@medusajs/framework/utils";

type EntryProps = {
  documentId: string;
  collectionId: string;
};

type StepInput = {
  collections: ProductCollectionDTO[];
};

export const upsertCollectionStrapiStep = createStep(
  "upsert-collections-strapi-step",
  async (input: StepInput, { container }) => {
    const strapiModuleService: StrapiModuleService =
      container.resolve(STRAPI_MODULE);
    const productModuleService = container.resolve(Modules.PRODUCT);

    const collections: EntryProps[] = [];

    try {
      for (const collection of input.collections) {
        const entry = await strapiModuleService.upsertCollection(collection);
        await productModuleService.updateProductCollections(collection.id, {
          metadata: {
            ...collection.metadata,
            strapiId: entry.documentId,
            strapiSyncedAt: new Date().valueOf(),
          },
        });
        collections.push({
          documentId: entry.documentId,
          collectionId: collection.id,
        });
      }
    } catch (e) {
      return StepResponse.permanentFailure(
        `Error creating collections in Strapi: ${e.message}`,
        collections,
      );
    }

    return new StepResponse(collections, collections);
  },
);
