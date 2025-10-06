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
    const originalMetadata: Record<string, any> = {};

    try {
      for (const product of input.products) {
        // Store original metadata for compensation
        originalMetadata[product.id] = product.metadata;

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
        { products, originalMetadata },
      );
    }

    return new StepResponse(products, { products, originalMetadata });
  },
  async (compensateInput, { container }) => {
    if (!compensateInput) return;

    const { products, originalMetadata } = compensateInput;
    const strapiModuleService: StrapiModuleService =
      container.resolve(STRAPI_MODULE);
    const productModuleService = container.resolve(Modules.PRODUCT);

    // Revert metadata changes and delete created entries
    for (const product of products) {
      try {
        // Revert metadata to original state
        if (originalMetadata[product.productId]) {
          await productModuleService.updateProducts(product.productId, {
            metadata: originalMetadata[product.productId],
          });
        }

        // Delete the Strapi entry if it was created
        await strapiModuleService.deleteProduct(product.productId);
      } catch (error) {
        console.error(
          `Failed to compensate product ${product.productId}:`,
          error,
        );
      }
    }
  },
);
