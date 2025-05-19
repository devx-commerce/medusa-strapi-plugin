import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework";
import { createCategoriesStrapiWorkflow } from "../workflows/create-categories-strapi";

export default async function handleCategoryCreate({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger");
  await createCategoriesStrapiWorkflow(container).run({
    input: {
      category_ids: [data.id],
    },
  });

  logger.log("Category created in Strapi");
}

export const config: SubscriberConfig = {
  event: "product-category.created",
};
