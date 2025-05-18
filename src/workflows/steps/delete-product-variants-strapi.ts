import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { STRAPI_MODULE } from "../../modules/strapi";
import StrapiModuleService from "../../modules/strapi/service";

type StepInput = {
  variant_ids: string[];
};

export const deleteProductVariantsStrapiStep = createStep(
  "delete-product-variants-strapi-step",
  async (input: StepInput, { container }) => {
    const strapiModuleService: StrapiModuleService =
      container.resolve(STRAPI_MODULE);

    const variants: void[] = [];

    try {
      for (const variant_id of input.variant_ids) {
        variants.push(
          await strapiModuleService.deleteProductVariant(variant_id),
        );
      }
    } catch (e) {
      return StepResponse.permanentFailure(
        `Error deleting product variants in Strapi: ${e.message}`,
      );
    }

    return new StepResponse(variants, variants);
  },
);
