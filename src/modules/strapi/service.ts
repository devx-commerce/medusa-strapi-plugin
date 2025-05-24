import {
  Logger,
  ProductCategoryDTO,
  ProductCollectionDTO,
  ProductDTO,
  ProductVariantDTO,
} from "@medusajs/framework/types";
import { MedusaError } from "@medusajs/framework/utils";
import { StrapiClient } from "@strapi/client";
import { ModuleOptions } from "./loader/create-content-models";

type InjectedDependencies = {
  client: StrapiClient;
  logger: Logger;
};

type EntryProps = {
  documentId: string;
  [key: string]: unknown;
};

enum StrapiEntity {
  PRODUCT = "products",
  VARIANT = "product-variants",
  CATEGORY = "categories",
  COLLECTION = "collections",
}

export default class StrapiModuleService {
  private client: StrapiClient;
  private options: ModuleOptions;
  protected logger: Logger;

  constructor(
    { client, logger }: InjectedDependencies,
    options: ModuleOptions,
  ) {
    this.client = client;
    this.logger = logger;
    this.options = {
      ...options,
      default_locale: options.default_locale || "en",
    };
  }

  private async getEntityBySystemId(
    entity: StrapiEntity,
    systemId: string,
    options?: Record<string, unknown>,
  ): Promise<EntryProps | undefined> {
    const collection = this.client.collection(entity);

    const defaultOption: Record<string, unknown> = {
      fields: ["documentId"],
      status: "draft",
      ...options,
    };

    const entry = await collection
      .find({ ...defaultOption, filters: { systemId } })
      .then((resp) => resp.data[0]);

    return entry;
  }

  private async createEntry(
    entity: StrapiEntity,
    data: Record<string, string | undefined>,
  ) {
    const collection = this.client.collection(entity);

    try {
      const entry = await collection
        .create(data, {
          locale: this.options.default_locale,
          status: "draft",
        })
        .then((resp) => resp.data);

      return entry;
    } catch (error) {
      this.logger.error(`Failed to create ${entity} in Strapi`, error);
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Failed to create ${entity} in Strapi: ${error.message}`,
      );
    }
  }

  private async updateEntry(
    entity: StrapiEntity,
    documentId: string,
    data: Record<string, string | undefined>,
  ) {
    const collection = this.client.collection(entity);

    try {
      const entry = await collection
        .update(documentId, data, {
          locale: this.options.default_locale,
          status: "draft",
        })
        .then((resp) => resp.data);

      return entry;
    } catch (error) {
      this.logger.error(`Failed to update ${entity} in Strapi`, error);
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Failed to update ${entity} in Strapi: ${error.message}`,
      );
    }
  }

  private async deleteEntry(entity: StrapiEntity, documentId: string) {
    const collection = this.client.collection(entity);

    try {
      return await collection.delete(documentId);
    } catch (error) {
      this.logger.error(`Failed to update ${entity} in Strapi`, error);
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Failed to update ${entity} in Strapi: ${error.message}`,
      );
    }
  }

  async list(filter: {
    productId?: string | string[];
    collectionId?: string | string[];
    categoryId?: string | string[];
    context?: {
      locale?: string;
    };
  }) {
    this.logger.debug(`Fetching cms data `);

    let entity = StrapiEntity.PRODUCT;
    let systemKey = "productId";
    let systemId = filter.productId;

    if (filter.collectionId) {
      entity = StrapiEntity.COLLECTION;
      systemKey = "collectionId";
      systemId = filter.collectionId;
    }
    if (filter.categoryId) {
      entity = StrapiEntity.CATEGORY;
      systemKey = "categoryId";
      systemId = filter.categoryId;
    }

    const systemIdFilter = Array.isArray(systemId) ? systemId : [systemId];
    this.logger.debug(`Fetching entity ${entity} with ID: ${systemIdFilter}`);

    const collection = this.client.collection(entity);

    const entries = await collection
      .find({
        filters: { systemId: { $in: systemIdFilter } },
        locale: filter.context?.locale || this.options.default_locale,
      })
      .then((resp) => resp.data);

    const listEntries = entries.map(({ systemId, ...rest }) => {
      return {
        ...rest,
        [systemKey]: systemId,
      };
    });

    return listEntries;
  }

  async upsertProduct(product: ProductDTO) {
    this.logger.debug(`Creating product in Strapi ${product.id}`);

    // check if product already exists
    this.logger.debug(`Checking product in Strapi ${product.id}`);
    const productEntry = await this.getEntityBySystemId(
      StrapiEntity.PRODUCT,
      product.id,
    );

    let entry = productEntry;
    if (!entry) {
      this.logger.debug(
        `No product in Strapi with ID: ${product.id}, creating it`,
      );
      entry = await this.createEntry(StrapiEntity.PRODUCT, {
        systemId: product.id,
        title: product.title || "",
        handle: product.handle || "",
        productType: product.type?.value || "",
      });
    } else {
      this.logger.debug(`Updating product in Strapi with ID: ${product.id}`);
      entry = await this.updateEntry(StrapiEntity.PRODUCT, entry.documentId, {
        title: product.title || "",
        handle: product.handle || "",
        productType: product.type?.value || "",
      });
    }

    // Create variants if they exist
    if (product.variants?.length) {
      this.logger.debug(`Creating product variants in Strapi ${product.id}`);
      await this.upsertProductVariants(product.variants, entry);
    }

    return entry;
  }

  async deleteProduct(productId: string) {
    this.logger.debug(`Deleting product in Strapi ${productId}`);

    const productEntry = await this.getEntityBySystemId(
      StrapiEntity.PRODUCT,
      productId,
      { populate: "variants", fields: ["*"] },
    );

    if (!productEntry) {
      this.logger.log(`No product found in Strapi ${productId}`);
      return null;
    }

    await this.deleteEntry(StrapiEntity.PRODUCT, productEntry.documentId);

    if (Array.isArray(productEntry.variants)) {
      // Delete the product variant entries
      this.logger.debug(`Deleting product variants in Strapi ${productId}`);
      await Promise.all(
        productEntry.variants.map((v: EntryProps) =>
          this.deleteEntry(StrapiEntity.VARIANT, v.documentId),
        ),
      );
    }

    return productId;
  }

  private async upsertProductVariants(
    variants: ProductVariantDTO[],
    productEntry: EntryProps,
  ) {
    for (const variant of variants) {
      this.logger.debug(`Fetching product variants in Strapi ${variant.id}`);

      // check if product variant already exists
      const entry = await this.getEntityBySystemId(
        StrapiEntity.VARIANT,
        variant.id,
      );

      if (!entry) {
        this.logger.debug(
          `No product variant found in Strapi with ID: ${variant.id}, creating it.`,
        );

        await this.createEntry(StrapiEntity.VARIANT, {
          systemId: variant.id,
          title: variant.title || "",
          product: productEntry.documentId,
          sku: variant.sku || "",
        });
      } else {
        this.logger.debug(
          `Updating product variant found in Strapi with ID: ${variant.id}`,
        );
        await this.updateEntry(StrapiEntity.VARIANT, entry.documentId, {
          title: variant.title || "",
          product: productEntry.documentId,
          sku: variant.sku || "",
        });
      }
    }
  }

  async upsertProductVariant(variant: ProductVariantDTO) {
    this.logger.debug(`Fetching product variants in Strapi ${variant.id}`);

    // check if product variant exists
    const entry = await this.getEntityBySystemId(
      StrapiEntity.VARIANT,
      variant.id,
    );

    if (!entry) {
      this.logger.log(
        `No product variant found in Strapi with ID: ${variant.id}, creating it`,
      );

      const productEntry = await this.getEntityBySystemId(
        StrapiEntity.PRODUCT,
        variant.product_id as string,
      );

      if (productEntry) {
        return await this.createEntry(StrapiEntity.VARIANT, {
          systemId: variant.id,
          title: variant.title || "",
          product: productEntry.documentId,
          sku: variant.sku || "",
        });
      }

      return null;
    }

    this.logger.debug(
      `Updating product variant found in Strapi with ID: ${variant.id}`,
    );

    return await this.updateEntry(StrapiEntity.VARIANT, entry.documentId, {
      title: variant.title || "",
      sku: variant.sku || "",
    });
  }

  async deleteProductVariant(variantId: string) {
    this.logger.debug(`Deleting product variant in Strapi ${variantId}`);

    const entry = await this.getEntityBySystemId(
      StrapiEntity.VARIANT,
      variantId,
    );

    if (!entry) {
      this.logger.log(`No product variant found in Strapi ${variantId}`);
      return null;
    }

    await this.deleteEntry(StrapiEntity.VARIANT, entry.documentId);
    return variantId;
  }

  async upsertCollection(collection: ProductCollectionDTO) {
    this.logger.debug(`Fetching collection in Strapi ${collection.id}`);

    const entry = await this.getEntityBySystemId(
      StrapiEntity.COLLECTION,
      collection.id,
    );

    if (!entry) {
      this.logger.log(
        `No collection found in Strapi with ID: ${collection.id}, creating it`,
      );

      return await this.createEntry(StrapiEntity.COLLECTION, {
        systemId: collection.id,
        title: collection.title || "",
        handle: collection.handle || "",
      });
    }

    this.logger.debug(
      `Updating collection found in Strapi with ID: ${collection.id}`,
    );

    return await this.updateEntry(StrapiEntity.COLLECTION, entry.documentId, {
      title: collection.title || "",
      handle: collection.handle || "",
    });
  }

  async deleteCollection(collectionId: string) {
    this.logger.debug(`Deleting collection in Strapi ${collectionId}`);

    const entry = await this.getEntityBySystemId(
      StrapiEntity.COLLECTION,
      collectionId,
    );

    if (!entry) {
      this.logger.log(`No collection found in Strapi ${collectionId}`);
      return null;
    }

    await this.deleteEntry(StrapiEntity.COLLECTION, entry.documentId);
    return collectionId;
  }

  async upsertCategory(category: ProductCategoryDTO) {
    this.logger.debug(`Fetching category in Strapi ${category.id}`);

    const entry = await this.getEntityBySystemId(
      StrapiEntity.CATEGORY,
      category.id,
    );

    if (!entry) {
      this.logger.log(
        `No category found in Strapi with ID: ${category.id}, creating it`,
      );

      return await this.createEntry(StrapiEntity.CATEGORY, {
        systemId: category.id,
        title: category.name || "",
        handle: category.handle || "",
      });
    }

    this.logger.debug(
      `Updating category found in Strapi with ID: ${category.id}`,
    );

    return await this.updateEntry(StrapiEntity.CATEGORY, entry.documentId, {
      title: category.name || "",
      handle: category.handle || "",
    });
  }

  async deleteCategory(categoryId: string) {
    this.logger.debug(`Deleting category in Strapi ${categoryId}`);

    const entry = await this.getEntityBySystemId(
      StrapiEntity.CATEGORY,
      categoryId,
    );

    if (!entry) {
      this.logger.log(`No category found in Strapi ${categoryId}`);
      return null;
    }

    await this.deleteEntry(StrapiEntity.CATEGORY, entry.documentId);
    return categoryId;
  }
}
