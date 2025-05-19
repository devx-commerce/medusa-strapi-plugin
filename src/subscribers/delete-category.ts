import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework";
import { deleteCategoriesStrapiWorkflow } from "../workflows/delete-categories-strapi";

export default async function handleCategoryDelete({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger");
  logger.log(`Deleting category ${data.id} in Strapi`);

  try {
    await deleteCategoriesStrapiWorkflow(container).run({
      input: {
        category_ids: [data.id],
      },
    });

    logger.log("Category deleted in Strapi");
  } catch (error) {
    logger.error(`Failed to delete category in Strapi: ${error.message}`);
    throw error;
  }
}

export const config: SubscriberConfig = {
  event: "product-category.deleted",
};
