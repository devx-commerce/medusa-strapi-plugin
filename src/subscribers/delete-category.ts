import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { deleteCategoriesStrapiWorkflow } from "../workflows/delete-categories-strapi";

export default async function handleCategoryDelete({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

  await deleteCategoriesStrapiWorkflow(container).run({
    input: {
      category_ids: [data.id],
    },
  });

  logger.log("Category deleted in Strapi");
}

export const config: SubscriberConfig = {
  event: "product-category.deleted",
};
