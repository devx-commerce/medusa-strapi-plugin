import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { STRAPI_MODULE } from "../../modules/strapi";
import StrapiModuleService from "../../modules/strapi/service";

type StepInput = {
  product_ids: string[];
};

export const deleteProductsStrapiStep = createStep(
  "delete-products-strapi-step",
  async (input: StepInput, { container }) => {
    const strapiModuleService: StrapiModuleService =
      container.resolve(STRAPI_MODULE);

    const products: (string | null)[] = [];

    try {
      for (const product_id of input.product_ids) {
        products.push(await strapiModuleService.deleteProduct(product_id));
      }
    } catch (e) {
      return StepResponse.permanentFailure(
        `Error deleting products in Strapi: ${e.message}`,
      );
    }

    return new StepResponse(products, products);
  },
);
