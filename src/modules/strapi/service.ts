import {
  Logger,
  ProductDTO,
  ProductVariantDTO,
} from "@medusajs/framework/types";
import { MedusaError } from "@medusajs/framework/utils";
import { StrapiClient } from "@strapi/client";
import { ModuleOptions } from "./loader/create-content-models";

type InjectedDependencies = {
  strapiClient: StrapiClient;
  logger: Logger;
};

type EntryProps = {
  documentId: string;
};

const PRODUCT_COLLECTION_NAME = "products";
const VARIANT_COLLECTION_NAME = "product-variants";

export default class StrapiModuleService {
  private strapiClient: StrapiClient;
  private options: ModuleOptions;
  protected logger_: Logger;

  constructor(
    { strapiClient, logger }: InjectedDependencies,
    options: ModuleOptions,
  ) {
    this.strapiClient = strapiClient;
    this.logger_ = logger;
    this.options = {
      ...options,
      default_locale: options.default_locale || "en",
    };
  }

  async list(filter: {
    productId: string | string[];
    context?: {
      locale?: string;
      populate?: string;
    };
  }) {
    const productIdFilter = Array.isArray(filter.productId)
      ? filter.productId
      : [filter.productId];

    const productsCollection = this.strapiClient.collection(
      PRODUCT_COLLECTION_NAME,
    );

    const { data: products } = await productsCollection.find({
      filters: {
        productId: { $in: productIdFilter },
      },
      locale: filter.context?.locale || this.options.default_locale,
      populate: filter.context?.populate,
    });

    return products;
  }

  // async verifyWebhook(request: CanonicalRequest) {
  //   if (!this.options.webhook_secret) {
  //     throw new MedusaError(
  //       MedusaError.Types.INVALID_DATA,
  //       "Webhook secret is not set",
  //     );
  //   }
  //   return verifyRequest(this.options.webhook_secret, request, 0);
  // }

  // async getLocales() {
  //   return await this.managementClient.locale.getMany({});
  // }

  // async getDefaultLocaleCode() {
  //   return this.options.default_locale;
  // }

  async createProduct(product: ProductDTO) {
    const productsCollection = this.strapiClient.collection(
      PRODUCT_COLLECTION_NAME,
    );

    // check if product already exists
    let {
      data: [productEntry],
    } = await productsCollection.find({
      filters: {
        productId: product.id,
      },
      status: "draft",
    });

    if (!productEntry) {
      ({ data: productEntry } = await productsCollection.create(
        {
          productId: product.id,
          title: product.title || "",
          handle: product.handle || "",
          productType: product.type || "",
        },
        {
          locale: this.options.default_locale,
          status: "draft",
        },
      ));
    }

    // Create variants if they exist
    if (product.variants?.length) {
      await this.createProductVariant(product.variants, productEntry);
    }

    return productEntry;
  }

  async deleteProduct(productId: string) {
    const productsCollection = this.strapiClient.collection(
      PRODUCT_COLLECTION_NAME,
    );

    const productVariantsCollection = this.strapiClient.collection(
      VARIANT_COLLECTION_NAME,
    );

    try {
      const {
        data: [productEntry],
      } = await productsCollection.find({
        filters: { productId },
        populate: "variants",
        status: "draft",
      });

      if (!productEntry) {
        this.logger_.log("No product found in Strapi");
        return;
      }

      await productsCollection.delete(productEntry.documentId);

      // Delete the product variant entries
      for (const variant of productEntry.variants) {
        await productVariantsCollection.delete(variant.documentId);
      }
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Failed to delete product from Strapi: ${error.message}`,
      );
    }
  }

  private async createProductVariant(
    variants: ProductVariantDTO[],
    productEntry: EntryProps,
  ) {
    const productVariantsCollection = this.strapiClient.collection(
      VARIANT_COLLECTION_NAME,
    );

    for (const variant of variants) {
      // check if product variant already exists
      const {
        data: [productVariantEntry],
      } = await productVariantsCollection.find({
        filters: {
          variantId: variant.id,
        },
        status: "draft",
      });

      if (!productVariantEntry) {
        await productVariantsCollection.create(
          {
            variantId: variant.id,
            title: variant.title || "",
            product: productEntry.documentId,
            sku: variant.sku,
          },
          {
            locale: this.options.default_locale,
            status: "draft",
          },
        );
      }
    }
  }

  async deleteProductVariant(variantId: string) {
    const productVariantsCollection = this.strapiClient.collection(
      VARIANT_COLLECTION_NAME,
    );

    try {
      const {
        data: [productVariantEntry],
      } = await productVariantsCollection.find({
        filters: { variantId },
        status: "draft",
      });

      if (!productVariantEntry) {
        this.logger_.log("No product variant found in Strapi");
        return;
      }

      await productVariantsCollection.delete(productVariantEntry.documentId);
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Failed to delete product variant from Strapi: ${error.message}`,
      );
    }
  }
}
