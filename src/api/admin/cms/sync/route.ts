import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const eventService = req.scope.resolve("event_bus");

  const entityTypes = ["products", "collections", "categories"];

  for (const type of entityTypes) {
    await eventService.emit({
      name: `strapi-${type}.sync`,
      data: {},
    });
  }

  res.status(200).json({
    message: "Strapi sync triggered successfully",
  });
};
