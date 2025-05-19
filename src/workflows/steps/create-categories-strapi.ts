import { ProductCategoryDTO } from "@medusajs/framework/types";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { STRAPI_MODULE } from "../../modules/strapi";
import StrapiModuleService from "../../modules/strapi/service";

type EntryProps = {
  documentId: string;
  categoryId: string;
};

type StepInput = {
  categories: ProductCategoryDTO[];
};

export const createCategoriesStrapiStep = createStep(
  "create-categories-strapi-step",
  async (input: StepInput, { container }) => {
    const strapiModuleService: StrapiModuleService =
      container.resolve(STRAPI_MODULE);

    const categories: EntryProps[] = [];

    try {
      for (const category of input.categories) {
        categories.push(
          (await strapiModuleService.createCategory(
            category,
          )) as unknown as EntryProps,
        );
      }
    } catch (e) {
      return StepResponse.permanentFailure(
        `Error creating categories in Strapi: ${e.message}`,
        categories,
      );
    }

    return new StepResponse(categories, categories);
  },
  async (categories, { container }) => {
    if (!categories) {
      return;
    }

    const strapiModuleService: StrapiModuleService =
      container.resolve(STRAPI_MODULE);

    for (const category of categories) {
      await strapiModuleService.deleteCategory(category.categoryId);
    }
  },
);
