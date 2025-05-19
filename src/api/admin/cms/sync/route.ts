import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const eventService = req.scope.resolve("event_bus");

  await eventService.emit({
    name: "strapi-products.sync",
    data: {},
  });

  await eventService.emit({
    name: "strapi-collections.sync",
    data: {},
  });

  await eventService.emit({
    name: "strapi-categories.sync",
    data: {},
  });

  res.status(200).json({
    message: "Strapi sync triggered successfully",
  });
};
