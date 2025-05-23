import { LoaderOptions } from "@medusajs/framework/types";
import { MedusaError } from "@medusajs/framework/utils";
import { strapi } from "@strapi/client";
import { asValue } from "awilix";

export type ModuleOptions = {
  base_url: string;
  api_key: string;
  default_locale?: string;
};

export default async function syncContentModelsLoader({
  container,
  options,
}: LoaderOptions<ModuleOptions>) {
  if (!options?.base_url || !options?.api_key) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Strapi api key and base URL are required",
    );
  }

  const logger = container.resolve("logger");

  try {
    const client = strapi({
      baseURL: options.base_url,
      auth: options.api_key,
    });

    try {
      const products = client.collection("products");
      await products.find({
        fields: ["title", "systemId", "handle", "productType"],
        populate: {
          variants: {
            fields: ["title", "systemId", "sku"],
          },
        },
        pagination: {
          limit: 0,
          withCount: true,
        },
      });
    } catch (error) {
      logger.error(`Failed to connect to Strapi, Schema not ready: ${error}`);
      throw error;
    }

    container.register({ strapiClient: asValue(client) });
    logger.info("Connected to Strapi");
  } catch (error) {
    logger.error(`Failed to connect to Strapi: ${error}`);
    throw error;
  }
}
