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

  static validateOptions(options: ModuleOptions) {
    if (!options.base_url || !options.api_key) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Strapi base URL and API key are required",
      );
    }
  }

  /**
   * Fetches an entity by its system ID.
   * @param entity - The Strapi entity to fetch.
   * @param systemId - The system ID of the entity.
   * @param options - Additional options for the query.
   * @returns The entry if found, otherwise undefined.
   */
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

  /**
   * Creates a new entry in the specified Strapi entity.
   * @param entity - The Strapi entity to create an entry in.
   * @param data - The data to create the entry with.
   * @returns The created entry.
   */
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

  /**
   * Updates an existing entry in the specified Strapi entity.
   * @param entity - The Strapi entity to update an entry in.
   * @param documentId - The document ID of the entry to update.
   * @param data - The data to update the entry with.
   * @returns The updated entry.
   */
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

  /**
   * Deletes an entry in the specified Strapi entity.
   * @param entity - The Strapi entity to delete an entry from.
   * @param documentId - The document ID of the entry to delete.
   * @returns The result of the deletion operation.
   */
  private async deleteEntry(entity: StrapiEntity, documentId: string) {
    const collection = this.client.collection(entity);

    try {
      return await collection.delete(documentId);
    } catch (error) {
      this.logger.error(`Failed to delete ${entity} in Strapi`, error);
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Failed to delete ${entity} in Strapi: ${error.message}`,
      );
    }
  }

  /**
   * Lists entities based on the provided filter.
   * @param filter - The filter criteria for listing entities.
   * @returns A list of entries matching the filter criteria.
   */
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

  /**
   * Upserts a product in Strapi.
   * If the product does not exist, it creates a new entry.
   * If it exists, it updates the existing entry.
   * @param product - The product data to upsert.
   * @returns The created or updated product entry.
   */
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

  /**
   * Deletes a product in Strapi.
   * It also deletes all associated product variants.
   * @param productId - The ID of the product to delete.
   * @returns The ID of the deleted product or null if not found.
   */
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

  /**
   * Upserts product variants for a given product entry.
   * If the variant does not exist, it creates a new entry.
   * If it exists, it updates the existing entry.
   * @param variants - The product variants to upsert.
   * @param productEntry - The product entry to associate the variants with.
   */
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

  /**
   * Upserts a product variant in Strapi.
   * If the variant does not exist, it creates a new entry.
   * If it exists, it updates the existing entry.
   * @param variant - The product variant data to upsert.
   * @returns The created or updated product variant entry.
   */
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

  /**
   * Deletes a product variant in Strapi.
   * @param variantId - The ID of the product variant to delete.
   * @returns The ID of the deleted product variant or null if not found.
   */
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

  /**
   * Upserts a collection in Strapi.
   * If the collection does not exist, it creates a new entry.
   * If it exists, it updates the existing entry.
   * @param collection - The collection data to upsert.
   * @returns The created or updated collection entry.
   */
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

  /**
   * Deletes a collection in Strapi.
   * @param collectionId - The ID of the collection to delete.
   * @returns The ID of the deleted collection or null if not found.
   */
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

  /**
   * Upserts a product category in Strapi.
   * If the category does not exist, it creates a new entry.
   * If it exists, it updates the existing entry.
   * @param category - The product category data to upsert.
   * @returns The created or updated product category entry.
   */
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

  /**
   * Deletes a product category in Strapi.
   * @param categoryId - The ID of the product category to delete.
   * @returns The ID of the deleted product category or null if not found.
   */
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
