import { LoaderOptions } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils";
import qs from "qs";

export type ModuleOptions = {
  base_url: string;
  api_key: string;
  default_locale?: string;
  system_id_key?: string;
};

export default async function syncContentModelsLoader({
  container,
  options,
}: LoaderOptions<ModuleOptions>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

  if (!options?.base_url || !options?.api_key) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Strapi api key and base URL are required",
    );
  }

  const systemIdKey = options.system_id_key || "systemId";

  logger.debug(`Strapi baseURL: ${options.base_url}`);

  const params = qs.stringify({
    fields: ["title", systemIdKey, "handle", "productType"],
    populate: { variants: { fields: ["title", systemIdKey, "sku"] } },
    pagination: { limit: 1 },
  });

  const response = await fetch(`${options.base_url}/products?${params}`, {
    headers: {
      Authorization: `Bearer ${options.api_key}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Failed to connect to Strapi: HTTP ${response.status} ${response.statusText}`,
    );
  }

  const { error } = await response.json();

  if (error) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Failed to connect to Strapi: ${error.message}`,
    );
  }

  logger.info("Connected to Strapi");
}
