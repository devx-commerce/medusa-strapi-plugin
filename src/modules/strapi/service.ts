import {
  Logger,
  ProductDTO,
  ProductVariantDTO,
  ProductCollectionDTO,
  ProductCategoryDTO,
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
const CATEGORY_COLLECTION_NAME = "categories";
const COLLECTION_COLLECTION_NAME = "collections";

export default class StrapiModuleService {
  private strapiClient: StrapiClient;
  private options: ModuleOptions;
  protected logger: Logger;

  constructor(
    { strapiClient, logger }: InjectedDependencies,
    options: ModuleOptions,
  ) {
    this.strapiClient = strapiClient;
    this.logger = logger;
    this.options = {
      ...options,
      default_locale: options.default_locale || "en",
    };
  }

  async list(filter: {
    productId: string | string[];
    context?: {
      entity?: "collection" | "product" | "category";
      locale?: string;
      populate?: string;
    };
  }) {
    this.logger.debug(JSON.stringify(filter));

    let collectionName = PRODUCT_COLLECTION_NAME;
    if (filter.context?.entity === "collection") {
      collectionName = COLLECTION_COLLECTION_NAME;
    }
    if (filter.context?.entity === "category") {
      collectionName = CATEGORY_COLLECTION_NAME;
    }

    const systemIdFilter = Array.isArray(filter.productId)
      ? filter.productId
      : [filter.productId];

    const collection = this.strapiClient.collection(collectionName);

    const { data: entries } = await collection.find({
      filters: {
        systemId: { $in: systemIdFilter },
      },
      locale: filter.context?.locale || this.options.default_locale,
      populate: filter.context?.populate,
    });

    return entries;
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
        systemId: product.id,
      },
      status: "draft",
    });

    if (!productEntry) {
      ({ data: productEntry } = await productsCollection.create(
        {
          systemId: product.id,
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
        filters: { systemId: productId },
        populate: "variants",
        status: "draft",
      });

      if (!productEntry) {
        this.logger.log("No product found in Strapi");
        return;
      }

      await productsCollection.delete(productEntry.documentId);

      // Delete the product variant entries
      await Promise.all(
        productEntry.variants.map((v: EntryProps) =>
          productVariantsCollection.delete(v.documentId),
        ),
      );
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
          systemId: variant.id,
        },
        status: "draft",
      });

      if (!productVariantEntry) {
        await productVariantsCollection.create(
          {
            systemId: variant.id,
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
        filters: { systemId: variantId },
        status: "draft",
      });

      if (!productVariantEntry) {
        this.logger.log("No product variant found in Strapi");
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

  async createCollection(collection: ProductCollectionDTO) {
    const collectionCollection = this.strapiClient.collection(
      COLLECTION_COLLECTION_NAME,
    );

    // check if collection already exists
    let {
      data: [collectionEntry],
    } = await collectionCollection.find({
      filters: {
        systemId: collection.id,
      },
      status: "draft",
    });

    if (!collectionEntry) {
      const { data: newCollectionEntry } = await collectionCollection.create(
        {
          systemId: collection.id,
          title: collection.title || "",
          handle: collection.handle || "",
        },
        {
          locale: this.options.default_locale,
          status: "draft",
        },
      );

      return newCollectionEntry;
    }

    return collectionEntry;
  }

  async deleteCollection(collectionId: string) {
    const collectionCollection = this.strapiClient.collection(
      COLLECTION_COLLECTION_NAME,
    );

    try {
      const {
        data: [collectionEntry],
      } = await collectionCollection.find({
        filters: { systemId: collectionId },
        status: "draft",
      });

      if (!collectionEntry) {
        this.logger.log("No collection found in Strapi");
        return;
      }

      await collectionCollection.delete(collectionEntry.documentId);
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Failed to delete collection from Strapi: ${error.message}`,
      );
    }
  }

  async createCategory(category: ProductCategoryDTO) {
    const categoryCollection = this.strapiClient.collection(
      CATEGORY_COLLECTION_NAME,
    );

    // check if category already exists
    const {
      data: [categoryEntry],
    } = await categoryCollection.find({
      filters: {
        systemId: category.id,
      },
      status: "draft",
    });

    if (!categoryEntry) {
      const { data: newCategoryEntry } = await categoryCollection.create(
        {
          systemId: category.id,
          title: category.name || "",
          handle: category.handle || "",
        },
        {
          locale: this.options.default_locale,
          status: "draft",
        },
      );

      return newCategoryEntry;
    }

    return categoryEntry;
  }

  async deleteCategory(categoryId: string) {
    const categoryCollection = this.strapiClient.collection(
      CATEGORY_COLLECTION_NAME,
    );

    try {
      const {
        data: [categoryEntry],
      } = await categoryCollection.find({
        filters: { systemId: categoryId },
        status: "draft",
      });

      if (!categoryEntry) {
        this.logger.log("No category found in Strapi");
        return;
      }

      await categoryCollection.delete(categoryEntry.documentId);
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Failed to delete category from Strapi: ${error.message}`,
      );
    }
  }
}
