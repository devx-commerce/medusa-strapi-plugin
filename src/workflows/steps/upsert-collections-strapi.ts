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
    const originalMetadata: Record<string, any> = {};

    try {
      for (const collection of input.collections) {
        // Store original metadata for compensation
        originalMetadata[collection.id] = collection.metadata;

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
        { collections, originalMetadata },
      );
    }

    return new StepResponse(collections, { collections, originalMetadata });
  },
  async (compensateInput, { container }) => {
    if (!compensateInput) return;

    const { collections, originalMetadata } = compensateInput;
    const strapiModuleService: StrapiModuleService =
      container.resolve(STRAPI_MODULE);
    const productModuleService = container.resolve(Modules.PRODUCT);

    // Revert metadata changes and delete created entries
    for (const collection of collections) {
      try {
        // Revert metadata to original state
        if (originalMetadata[collection.collectionId]) {
          await productModuleService.updateProductCollections(
            collection.collectionId,
            {
              metadata: originalMetadata[collection.collectionId],
            },
          );
        }

        // Delete the Strapi entry if it was created
        await strapiModuleService.deleteCollection(collection.collectionId);
      } catch (error) {
        console.error(
          `Failed to compensate collection ${collection.collectionId}:`,
          error,
        );
      }
    }
  },
);
