import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const eventService = req.scope.resolve("event_bus");

  const entityTypes = ["products", "collections", "categories"];

  try {
    await Promise.all(
      entityTypes.map((type) =>
        eventService.emit({
          name: `strapi-${type}.sync`,
          data: {},
        }),
      ),
    );

    res.status(200).json({
      message: "Strapi sync triggered successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: `Failed to trigger Strapi sync: ${error.message}`,
    });
  }
};
