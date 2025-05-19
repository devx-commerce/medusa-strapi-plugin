import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { QueryContext } from "@medusajs/framework/utils";

type CMSBody = {
  populate: string | string[] | Record<string, unknown> | undefined;
};

export const GET = async (req: MedusaRequest<CMSBody>, res: MedusaResponse) => {
  const { id } = req.params;
  const { locale, fields } = req.query;
  const { populate } = req.body;

  const query = req.scope.resolve("query");
  try {
    const { data } = await query.graph({
      entity: "product_collection",
      fields: [
        ...(fields
          ? (fields as string).split(",").map((f) => f.trim())
          : ["*"]),
        "cms.*",
      ],
      filters: { id },
      context: {
        cms: QueryContext({
          entity: "collection",
          locale,
          populate,
        }),
      },
    });

    if (!data.length) {
      return res.status(404).json({ message: "Collection not found" });
    }

    res.json({ collection: data[0] });
  } catch (error) {
    res.status(500).json({
      message: "An error occurred while fetching the collection",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
