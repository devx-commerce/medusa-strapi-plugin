import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import { STRAPI_MODULE } from "../modules/strapi";

export default defineLink(
  {
    linkable: ProductModule.linkable.productCategory,
    field: "id",
  },
  {
    linkable: {
      serviceName: STRAPI_MODULE,
      alias: "cms_category",
      primaryKey: "categoryId",
    },
  },
  {
    readOnly: true,
  },
);
