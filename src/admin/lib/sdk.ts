import Medusa from "@medusajs/js-sdk";

export const sdk = new Medusa({
  // @ts-ignore
  baseUrl: __BACKEND_URL__ || "/",
  auth: {
    type: "session",
  },
});
