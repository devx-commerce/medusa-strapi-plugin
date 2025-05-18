import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import { STRAPI_MODULE } from "../modules/strapi";

export default defineLink(
  {
    linkable: ProductModule.linkable.product,
    field: "id",
  },
  {
    linkable: {
      serviceName: STRAPI_MODULE,
      alias: "cms",
      primaryKey: "productId",
    },
  },
  {
    readOnly: true,
  },
);
