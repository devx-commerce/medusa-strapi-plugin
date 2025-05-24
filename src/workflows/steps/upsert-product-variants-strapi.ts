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

    try {
      for (const variant of input.variants) {
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
        variants,
      );
    }

    return new StepResponse(variants, variants);
  },
);
