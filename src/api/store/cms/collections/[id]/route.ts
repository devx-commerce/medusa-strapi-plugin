import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { QueryContext } from "@medusajs/framework/utils";

type CMSBody = {
  populate: string | string[] | Record<string, unknown> | undefined;
};

export const POST = async (
  req: MedusaRequest<CMSBody>,
  res: MedusaResponse,
) => {
  const { id } = req.params;
  const { locale, fields } = req.query;
  const { populate } = req.body;

  const query = req.scope.resolve("query");

  const { data } = await query.graph({
    entity: "product_collection",
    fields: [...((fields as string) || "").split(","), "cms.*"],
    filters: { id },
    context: {
      cms: QueryContext({
        entity: "collection",
        locale,
        populate,
      }),
    },
  });

  res.json({ collection: data[0] });
};
