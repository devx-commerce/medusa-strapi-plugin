import { ProductDTO } from "@medusajs/framework/types";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { STRAPI_MODULE } from "../../modules/strapi";
import StrapiModuleService from "../../modules/strapi/service";
import { Modules } from "@medusajs/framework/utils";

type EntryProps = {
  documentId: string;
  productId: string;
};

type StepInput = {
  products: ProductDTO[];
};

export const upsertProductsStrapiStep = createStep(
  "upsert-products-strapi-step",
  async (input: StepInput, { container }) => {
    const strapiModuleService: StrapiModuleService =
      container.resolve(STRAPI_MODULE);
    const productModuleService = container.resolve(Modules.PRODUCT);

    const products: EntryProps[] = [];

    try {
      for (const product of input.products) {
        const entry = await strapiModuleService.upsertProduct(product);
        await productModuleService.updateProducts(product.id, {
          metadata: {
            ...product.metadata,
            strapiId: entry.documentId,
            strapiSyncedAt: new Date().valueOf(),
          },
        });
        products.push({
          documentId: entry.documentId,
          productId: product.id,
        });
      }
    } catch (e) {
      return StepResponse.permanentFailure(
        `Error creating products in Strapi: ${e.message}`,
        products,
      );
    }

    return new StepResponse(products, products);
  },
);
