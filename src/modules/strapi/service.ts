import {
  Logger,
  ProductCategoryDTO,
  ProductCollectionDTO,
  ProductDTO,
  ProductVariantDTO,
} from "@medusajs/framework/types";
import { MedusaError } from "@medusajs/framework/utils";
import qs from "qs";
import { ModuleOptions } from "./loader/create-content-models";

type InjectedDependencies = {
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
  private options: ModuleOptions;
  protected logger: Logger;
  private systemIdKey: string;

  constructor({ logger }: InjectedDependencies, options: ModuleOptions) {
    this.logger = logger;
    this.options = {
      ...options,
      default_locale: options.default_locale || "en",
      system_id_key: options.system_id_key || "systemId",
    };

    this.systemIdKey = this.options.system_id_key || "systemId";
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
   * Makes an API request to Strapi.
   */
  private async makeRequest<T>(
    endpoint: string,
    options: Omit<RequestInit, "headers"> = {},
  ): Promise<T> {
    const url = `${this.options.base_url}/${endpoint}`;
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.options.api_key}`,
          "Content-Type": "application/json",
        },
        ...options,
      });

      const { data, error } = await response.json();

      if (error) {
        console.log(
          "Strapi API error:",
          options.method || "GET",
          url,
          JSON.stringify(options),
        );
        console.log("Strapi API error:", error);
        throw new Error(error.message || "Unknown error");
      }

      return data as T;
    } catch (error) {
      this.logger.error(`API request failed: ${url}`, error);
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `API request failed: ${error.message || error}`,
      );
    }
  }

  /**
   * Fetches an entity by its system ID.
   */
  private async getEntityBySystemId<T = Pick<EntryProps, "documentId">>(
    entity: StrapiEntity,
    systemId: string,
    options?: Record<string, unknown>,
  ): Promise<T | undefined> {
    this.logger.debug(`Fetching entity ${entity} with systemId: ${systemId}`);

    try {
      const params = qs.stringify({
        filters: { [this.systemIdKey]: { $eq: systemId } },
        fields: ["documentId"],
        status: "draft",
        ...options,
      });

      const result = await this.makeRequest<EntryProps[]>(
        `${entity}?${params}`,
      );

      return result?.[0] as T;
    } catch (error) {
      this.logger.error(
        `Failed to fetch ${entity} with systemId: ${systemId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Creates a new entry in the specified Strapi entity.
   */
  private async createEntry(
    entity: StrapiEntity,
    payload: Record<string, string | undefined>,
  ): Promise<EntryProps> {
    this.logger.debug(`Creating ${entity} in Strapi`);

    try {
      const params = qs.stringify({ status: "draft" });

      return await this.makeRequest<EntryProps>(`${entity}?${params}`, {
        method: "POST",
        body: JSON.stringify({
          data: {
            ...payload,
            // locale: this.options.default_locale
          },
        }),
      });
    } catch (error) {
      this.logger.error(`Failed to create ${entity} in Strapi`, error);
      throw error;
    }
  }

  /**
   * Updates an existing entry in the specified Strapi entity.
   */
  private async updateEntry(
    entity: StrapiEntity,
    documentId: string,
    payload: Record<string, string | undefined>,
  ): Promise<EntryProps> {
    this.logger.debug(`Updating ${entity} with documentId: ${documentId}`);

    try {
      return await this.makeRequest<EntryProps>(`${entity}/${documentId}`, {
        method: "PUT",
        body: JSON.stringify({ data: payload }),
      });
    } catch (error) {
      this.logger.error(`Failed to update ${entity} in Strapi`, error);
      throw error;
    }
  }

  /**
   * Deletes an entry in the specified Strapi entity.
   */
  private async deleteEntry(entity: StrapiEntity, documentId: string) {
    try {
      return await this.makeRequest(`${entity}/${documentId}`, {
        method: "DELETE",
      });
    } catch (error) {
      this.logger.error(`Failed to delete ${entity} in Strapi`, error);
      throw error;
    }
  }

  /**
   * Generic method to upsert an entity
   */
  private async upsertEntity(
    entity: StrapiEntity,
    systemId: string,
    createPayload: Record<string, string | undefined>,
    updatePayload: Record<string, string | undefined>,
  ): Promise<EntryProps> {
    const entry = await this.getEntityBySystemId(entity, systemId);

    if (!entry) {
      this.logger.debug(`No ${entity} found with ID: ${systemId}, creating it`);
      return await this.createEntry(entity, createPayload);
    }

    this.logger.debug(`Updating ${entity} with ID: ${systemId}`);
    return await this.updateEntry(entity, entry.documentId, updatePayload);
  }

  /**
   * Lists entities based on the provided filter.
   */
  async list(filter: {
    productId?: string | string[];
    collectionId?: string | string[];
    categoryId?: string | string[];
    variantId?: string | string[];
    context?: {
      locale?: string;
    };
  }) {
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

    if (filter.variantId) {
      entity = StrapiEntity.VARIANT;
      systemKey = "variantId";
      systemId = filter.variantId;
    }

    const systemIdFilter = Array.isArray(systemId) ? systemId : [systemId];
    this.logger.debug(`Fetching entity ${entity} with ID: ${systemIdFilter}`);

    const params = qs.stringify({
      filters: { [this.systemIdKey]: { $in: systemIdFilter } },
      // locale: filter.context?.locale || this.options.default_locale,
    });

    const entries = await this.makeRequest<any[]>(`${entity}?${params}`);

    return entries.map(({ [this.systemIdKey]: systemId, ...rest }) => ({
      ...rest,
      [systemKey]: systemId,
    }));
  }

  /**
   * Upserts a product in Strapi.
   */
  async upsertProduct(product: ProductDTO) {
    const createPayload = {
      [this.systemIdKey]: product.id,
      title: product.title || "",
      handle: product.handle || "",
      productType: product.type?.value || "",
    };

    const updatePayload = {
      handle: product.handle || "",
      productType: product.type?.value || "",
    };

    const entry = await this.upsertEntity(
      StrapiEntity.PRODUCT,
      product.id,
      createPayload,
      updatePayload,
    );

    // Create variants if they exist
    if (product.variants?.length) {
      await this.upsertProductVariants(product.variants, entry);
    }

    return entry;
  }

  /**
   * Deletes a product in Strapi.
   */
  async deleteProduct(productId: string) {
    const productEntry = await this.getEntityBySystemId<EntryProps>(
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
      // Delete variants in parallel
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
   */
  private async upsertProductVariants(
    variants: ProductVariantDTO[],
    productEntry: EntryProps,
  ) {
    // Process variants in parallel
    await Promise.all(
      variants.map(async (variant) => {
        const createPayload = {
          [this.systemIdKey]: variant.id,
          title: variant.title || "",
          product: productEntry.documentId,
          sku: variant.sku || "",
        };

        const updatePayload = {
          product: productEntry.documentId,
          sku: variant.sku || "",
        };

        await this.upsertEntity(
          StrapiEntity.VARIANT,
          variant.id,
          createPayload,
          updatePayload,
        );
      }),
    );
  }

  /**
   * Upserts a product variant in Strapi.
   */
  async upsertProductVariant(variant: ProductVariantDTO) {
    const entry = await this.getEntityBySystemId(
      StrapiEntity.VARIANT,
      variant.id,
    );

    if (!entry) {
      const productEntry = await this.getEntityBySystemId(
        StrapiEntity.PRODUCT,
        variant.product_id as string,
      );

      if (!productEntry) return null;

      return await this.createEntry(StrapiEntity.VARIANT, {
        [this.systemIdKey]: variant.id,
        title: variant.title || "",
        product: productEntry.documentId,
        sku: variant.sku || "",
      });
    }

    return await this.updateEntry(StrapiEntity.VARIANT, entry.documentId, {
      sku: variant.sku || "",
    });
  }

  /**
   * Deletes a product variant in Strapi.
   */
  async deleteProductVariant(variantId: string) {
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
   */
  async upsertCollection(collection: ProductCollectionDTO) {
    return await this.upsertEntity(
      StrapiEntity.COLLECTION,
      collection.id,
      {
        [this.systemIdKey]: collection.id,
        title: collection.title || "",
        handle: collection.handle || "",
      },
      {
        handle: collection.handle || "",
      },
    );
  }

  /**
   * Deletes a collection in Strapi.
   */
  async deleteCollection(collectionId: string) {
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
   */
  async upsertCategory(category: ProductCategoryDTO) {
    return await this.upsertEntity(
      StrapiEntity.CATEGORY,
      category.id,
      {
        [this.systemIdKey]: category.id,
        title: category.name || "",
        handle: category.handle || "",
      },
      {
        handle: category.handle || "",
      },
    );
  }

  /**
   * Deletes a product category in Strapi.
   */
  async deleteCategory(categoryId: string) {
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
