import { Module } from "@medusajs/framework/utils";
import createContentModelsLoader from "./loader/create-content-models";
import StrapiModuleService from "./service";

export const STRAPI_MODULE = "strapi";

export default Module(STRAPI_MODULE, {
  service: StrapiModuleService,
  loaders: [createContentModelsLoader],
});
