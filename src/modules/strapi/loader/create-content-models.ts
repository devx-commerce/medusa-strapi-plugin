import { LoaderOptions } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils";
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

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

  logger.debug(`Strapi baseURL: ${options.base_url}`);

  try {
    const client = strapi({
      baseURL: options.base_url,
      // auth: options.api_key,
      headers: {
        Authorization: `Bearer ${options.api_key}`,
      },
    });

    const products = client.collection("products");
    await products.find({
      fields: ["title", "systemId", "handle", "productType"],
      populate: {
        variants: {
          fields: ["title", "systemId", "sku"],
        },
      },
      pagination: {
        limit: 1,
        withCount: true,
      },
    });

    container.register({ client: asValue(client) });
    logger.info("Connected to Strapi");
  } catch (error) {
    logger.error(`Failed to connect to Strapi: ${error}`);
    throw error;
  }
}
