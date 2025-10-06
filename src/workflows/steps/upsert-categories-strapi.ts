import { ProductCategoryDTO } from "@medusajs/framework/types";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { STRAPI_MODULE } from "../../modules/strapi";
import StrapiModuleService from "../../modules/strapi/service";
import { Modules } from "@medusajs/framework/utils";

type EntryProps = {
  documentId: string;
  categoryId: string;
};

type StepInput = {
  categories: ProductCategoryDTO[];
};

export const upsertCategoriesStrapiStep = createStep(
  "upsert-categories-strapi-step",
  async (input: StepInput, { container }) => {
    const strapiModuleService: StrapiModuleService =
      container.resolve(STRAPI_MODULE);
    const productModuleService = container.resolve(Modules.PRODUCT);

    const categories: EntryProps[] = [];
    const originalMetadata: Record<string, any> = {};

    try {
      for (const category of input.categories) {
        // Store original metadata for compensation
        originalMetadata[category.id] = category.metadata;

        const entry = await strapiModuleService.upsertCategory(category);
        await productModuleService.updateProductCategories(category.id, {
          metadata: {
            ...category.metadata,
            strapiId: entry.documentId,
            strapiSyncedAt: new Date().valueOf(),
          },
        });
        categories.push({
          documentId: entry.documentId,
          categoryId: category.id,
        });
      }
    } catch (e) {
      return StepResponse.permanentFailure(
        `Error creating categories in Strapi: ${e.message}`,
        { categories, originalMetadata },
      );
    }

    return new StepResponse(categories, { categories, originalMetadata });
  },
  async (compensateInput, { container }) => {
    if (!compensateInput) return;

    const { categories, originalMetadata } = compensateInput;
    const strapiModuleService: StrapiModuleService =
      container.resolve(STRAPI_MODULE);
    const productModuleService = container.resolve(Modules.PRODUCT);

    // Revert metadata changes and delete created entries
    for (const category of categories) {
      try {
        // Revert metadata to original state
        if (originalMetadata[category.categoryId]) {
          await productModuleService.updateProductCategories(
            category.categoryId,
            {
              metadata: originalMetadata[category.categoryId],
            },
          );
        }

        // Delete the Strapi entry if it was created
        await strapiModuleService.deleteCategory(category.categoryId);
      } catch (error) {
        console.error(
          `Failed to compensate category ${category.categoryId}:`,
          error,
        );
      }
    }
  },
);
