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

    try {
      for (const category of input.categories) {
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
        categories,
      );
    }

    return new StepResponse(categories, categories);
  },
);
