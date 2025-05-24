import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { upsertCategoriesStrapiWorkflow } from "../workflows/upsert-categories-strapi";

export default async function handleCategoryCreate({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

  await upsertCategoriesStrapiWorkflow(container).run({
    input: {
      category_ids: [data.id],
    },
  });

  logger.log("Category created in Strapi");
}

export const config: SubscriberConfig = {
  event: "product-category.created",
};
