import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { STRAPI_MODULE } from "../../modules/strapi";
import StrapiModuleService from "../../modules/strapi/service";

type StepInput = {
  category_ids: string[];
};

export const deleteCategoriesStrapiStep = createStep(
  "delete-categories-strapi-step",
  async (input: StepInput, { container }) => {
    const strapiModuleService: StrapiModuleService =
      container.resolve(STRAPI_MODULE);

    const categories: void[] = [];

    try {
      for (const category_id of input.category_ids) {
        categories.push(await strapiModuleService.deleteCategory(category_id));
      }
    } catch (e) {
      return StepResponse.permanentFailure(
        `Error deleting categories in Strapi: ${e.message}`,
      );
    }

    return new StepResponse(categories, categories);
  },
);
