import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { QueryContext } from "@medusajs/framework/utils";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;
  const { locale, populate, fields } = req.query;

  const query = req.scope.resolve("query");

  const { data } = await query.graph({
    entity: "product_category",
    fields: [...((fields as string) || "").split(","), "cms.*"],
    filters: { id },
    context: {
      cms: QueryContext({
        collection: "category",
        locale,
        populate:
          typeof populate === "string" && populate
            ? JSON.parse(populate)
            : undefined,
      }),
    },
  });

  res.json({ category: data[0] });
};
