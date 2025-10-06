import { ProductVariantDTO } from "@medusajs/framework/types";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { STRAPI_MODULE } from "../../modules/strapi";
import StrapiModuleService from "../../modules/strapi/service";
import { Modules } from "@medusajs/framework/utils";

type EntryProps = {
  documentId: string;
  variantId: string;
};

type StepInput = {
  variants: ProductVariantDTO[];
};

export const upsertProductVariantsStrapiStep = createStep(
  "upsert-product-variants-strapi-step",
  async (input: StepInput, { container }) => {
    const strapiModuleService: StrapiModuleService =
      container.resolve(STRAPI_MODULE);
    const productModuleService = container.resolve(Modules.PRODUCT);

    const variants: EntryProps[] = [];
    const originalMetadata: Record<string, any> = {};

    try {
      for (const variant of input.variants) {
        // Store original metadata for compensation
        originalMetadata[variant.id] = variant.metadata;

        const entry = await strapiModuleService.upsertProductVariant(variant);
        if (entry) {
          await productModuleService.updateProductVariants(variant.id, {
            metadata: {
              ...variant.metadata,
              strapiId: entry.documentId,
              strapiSyncedAt: new Date().valueOf(),
            },
          });
          variants.push({
            documentId: entry.documentId,
            variantId: variant.id,
          });
        }
      }
    } catch (e) {
      return StepResponse.permanentFailure(
        `Error creating variants in Strapi: ${e.message}`,
        { variants, originalMetadata },
      );
    }

    return new StepResponse(variants, { variants, originalMetadata });
  },
  async (compensateInput, { container }) => {
    if (!compensateInput) return;

    const { variants, originalMetadata } = compensateInput;
    const strapiModuleService: StrapiModuleService =
      container.resolve(STRAPI_MODULE);
    const productModuleService = container.resolve(Modules.PRODUCT);

    // Revert metadata changes and delete created entries
    for (const variant of variants) {
      try {
        // Revert metadata to original state
        if (originalMetadata[variant.variantId]) {
          await productModuleService.updateProductVariants(variant.variantId, {
            metadata: originalMetadata[variant.variantId],
          });
        }

        // Delete the Strapi entry if it was created
        await strapiModuleService.deleteProductVariant(variant.variantId);
      } catch (error) {
        console.error(
          `Failed to compensate variant ${variant.variantId}:`,
          error,
        );
      }
    }
  },
);
