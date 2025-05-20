import { ProductDTO } from "@medusajs/framework/types";
import {
    createWorkflow,
    WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { createProductsStrapiStep } from "./steps/create-products-strapi";

type WorkflowInput = {
    product_ids: string[];
};

export const createProductsStrapiWorkflow = createWorkflow(
    { name: "create-products-strapi-workflow" },
    (input: WorkflowInput) => {
        const { data } = useQueryGraphStep({
            entity: "product",
            fields: ["id", "title", "type", "status", "handle", "variants.*"],
            filters: { id: input.product_ids },
        });

        const strapiProducts = createProductsStrapiStep({
            products: data as ProductDTO[],
        });

        return new WorkflowResponse(strapiProducts);
    }
);
