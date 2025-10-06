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

  // Validate that required content types exist with correct structure
  await validateContentTypes(options, logger, systemIdKey);

  logger.info("Connected to Strapi");
}

async function validateContentTypes(
  options: ModuleOptions,
  logger: any,
  systemIdKey: string,
) {
  const requiredContentTypes = [
    {
      name: "products",
      requiredFields: ["title", systemIdKey, "handle", "productType"],
      relations: { variants: { fields: ["title", systemIdKey, "sku"] } },
    },
    {
      name: "product-variants",
      requiredFields: ["title", systemIdKey, "sku"],
      relations: { product: {} },
    },
    {
      name: "categories",
      requiredFields: ["title", systemIdKey, "handle"],
    },
    {
      name: "collections",
      requiredFields: ["title", systemIdKey, "handle"],
    },
  ];

  for (const contentType of requiredContentTypes) {
    await validateContentType(options, logger, contentType, systemIdKey);
  }
}

async function validateContentType(
  options: ModuleOptions,
  logger: any,
  contentType: any,
  systemIdKey: string,
) {
  logger.debug(`Validating content type: ${contentType.name}`);

  const params = qs.stringify({
    fields: contentType.requiredFields,
    populate: contentType.relations || {},
    pagination: { limit: 1 },
  });

  const response = await fetch(
    `${options.base_url}/${contentType.name}?${params}`,
    {
      headers: {
        Authorization: `Bearer ${options.api_key}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    let errorDetails = `HTTP ${response.status} ${response.statusText}`;
    let errorMessage = `Content type '${contentType.name}' validation failed: ${errorDetails}`;

    try {
      const errorResponse = await response.json();
      if (errorResponse.error) {
        errorDetails += ` - ${JSON.stringify(errorResponse.error)}`;
        logger.error(
          `Strapi content type validation failed for '${contentType.name}':`,
          errorResponse,
        );

        if (response.status === 404) {
          errorMessage = `Content type '${contentType.name}' does not exist in Strapi. Please create it using the schema files provided in the 'strapi-schemas' directory.`;
        }
      }
    } catch (parseError) {
      logger.error("Failed to parse error response from Strapi", parseError);
    }

    throw new MedusaError(MedusaError.Types.INVALID_DATA, errorMessage);
  }

  const responseData = await response.json();
  const { error } = responseData;

  if (error) {
    logger.error(
      `Strapi returned an error for content type '${contentType.name}':`,
      error,
    );
    logger.error("Full response:", responseData);

    let errorMessage = `Content type '${contentType.name}' validation failed: ${
      error.message || JSON.stringify(error)
    }`;

    // Check if it's a field-related error
    if (error.message && error.message.includes("field")) {
      errorMessage += `\n\nRequired fields for '${
        contentType.name
      }': ${contentType.requiredFields.join(", ")}`;
      errorMessage += `\nPlease ensure all required fields exist in your Strapi content type.`;
      errorMessage += `\nRefer to the schema files in the 'strapi-schemas' directory for the correct structure.`;
    }

    throw new MedusaError(MedusaError.Types.INVALID_DATA, errorMessage);
  }

  logger.debug(`Content type '${contentType.name}' validation passed`);
}
