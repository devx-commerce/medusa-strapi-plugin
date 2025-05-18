import { ProductDTO } from "@medusajs/framework/types";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { STRAPI_MODULE } from "../../modules/strapi";
import StrapiModuleService from "../../modules/strapi/service";

type EntryProps = {
  documentId: string;
  productId: string;
};

type StepInput = {
  products: ProductDTO[];
};

export const createProductsStrapiStep = createStep(
  "create-products-strapi-step",
  async (input: StepInput, { container }) => {
    const strapiModuleService: StrapiModuleService =
      container.resolve(STRAPI_MODULE);

    const products: EntryProps[] = [];

    try {
      for (const product of input.products) {
        products.push(
          (await strapiModuleService.createProduct(
            product,
          )) as unknown as EntryProps,
        );
      }
    } catch (e) {
      return StepResponse.permanentFailure(
        `Error creating products in Strapi: ${e.message}`,
        products,
      );
    }

    return new StepResponse(products, products);
  },
  async (products, { container }) => {
    if (!products) {
      return;
    }

    const strapiModuleService: StrapiModuleService =
      container.resolve(STRAPI_MODULE);

    for (const product of products) {
      await strapiModuleService.deleteProduct(product.productId);
    }
  },
);
