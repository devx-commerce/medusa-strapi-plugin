import { ProductVariantDTO } from "@medusajs/framework/types";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { STRAPI_MODULE } from "../../modules/strapi";
import StrapiModuleService from "../../modules/strapi/service";

type EntryProps = {
  documentId: string;
  systemId: string;
};

type StepInput = {
  variants: ProductVariantDTO[];
};

export const createProductVariantsStrapiStep = createStep(
  "create-product-variants-strapi-step",
  async (input: StepInput, { container }) => {
    const strapiModuleService: StrapiModuleService =
      container.resolve(STRAPI_MODULE);

    const variants: EntryProps[] = [];

    try {
      for (const variant of input.variants) {
        if (variant.product_id) {
          const product = await strapiModuleService.getProductBySystemId(
            variant.product_id,
          );
          variants.push(
            (await strapiModuleService.createProductVariant(
              [variant],
              product,
            )) as unknown as EntryProps,
          );
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
  async (variants, { container }) => {
    if (!variants) {
      return;
    }

    const strapiModuleService: StrapiModuleService =
      container.resolve(STRAPI_MODULE);

    for (const variant of variants) {
      await strapiModuleService.deleteProductVariant(variant.systemId);
    }
  },
);
