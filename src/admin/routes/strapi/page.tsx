import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Button, Container, Heading, toast } from "@medusajs/ui";
import { useMutation } from "@tanstack/react-query";
import { sdk } from "../../lib/sdk";

const StrapiSettingsPage = () => {
  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      sdk.client.fetch("/admin/strapi/sync", {
        method: "POST",
      }),
    onSuccess: () => {
      toast.success("Sync to Strapi triggered successfully");
    },
  });

  return (
    <Container className="p-6">
      <div className="flex flex-col gap-y-4">
        <div>
          <Heading level="h1">Strapi Settings</Heading>
        </div>
        <div>
          <Button
            variant="primary"
            onClick={() => mutate()}
            isLoading={isPending}
          >
            Sync to Strapi
          </Button>
        </div>
      </div>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Strapi",
});

export default StrapiSettingsPage;
