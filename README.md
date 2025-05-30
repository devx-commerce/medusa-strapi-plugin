<p align="center">
  <a href="https://www.medusajs.com">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/59018053/229103275-b5e482bb-4601-46e6-8142-244f531cebdb.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
    <img alt="Medusa logo" src="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
    </picture>
  </a>
</p>
<h1 align="center">
  Medusa Plugin - Strapi
</h1>

<h4 align="center">
  <a href="https://docs.medusajs.com">Documentation</a> |
  <a href="https://www.medusajs.com">Website</a>
</h4>

<p align="center">
  A plugin for implementing Strapi as CMS for Medusa
</p>

## Features

- 🔄 Seamless integration between Medusa and Strapi
- 📝 Flexible content management for your e-commerce store
- 🖼️ Rich media management for product images and assets
- 🚀 Extend product information with custom fields and content
- 📱 Headless architecture for omnichannel commerce
- 🔄 Automatic synchronization between Medusa and Strapi

## Requirements

This plugin requires:

- [Medusa](https://docs.medusajs.com/) version >= 2.8.0
- [Strapi v5](https://strapi.io/documentation/developer-docs/latest/getting-started/introduction.html)

## Installation

1. Install the plugin:

```bash
npm install @devx-commerce/strapi @strapi/client
# or
yarn add @devx-commerce/strapi @strapi/client
```

2. Add the plugin to your `medusa-config.js`:

```js
module.exports = defineConfig({
  // ... other config
  plugins: [
    // ... other plugins,
    {
      resolve: "@devx-commerce/strapi",
      options: {
        base_url: process.env.STRAPI_URL,
        api_key: process.env.STRAPI_API_KEY,
      }
    }
  ],
});
```

## Setup

### Setting up Strapi

1. Install Strapi if you haven't already:

```bash
npx create-strapi-app@latest my-strapi-cms
```

2. Start your Strapi server:

```bash
cd my-strapi-cms
npm run develop
```

3. Create an API token in Strapi:
   - Go to Settings > API Tokens
   - Create a new full access token
   - Copy the token to use in your Medusa configuration

4. Create Product and Variant collections in Strapi:
   - In your Strapi admin panel, go to Content-Type Builder
   - Create a new collection type called "Product"
     - Add a "title" field (Text type)
     - Add a "systemId" field (Text type, Unique)
   - Create another collection type called "Variant"
     - Add a "title" field (Text type)
     - Add a "systemId" field (Text type, Unique)
   - Save and publish your new collection types

5. Configure environment variables for your Medusa backend:

    ```
    STRAPI_URL=http://localhost:1337
    STRAPI_API_KEY=your-api-token-here
    ```

### Synchronizing data

After installation and setup, the plugin will automatically:

- Create and update products, collection & categories in Strapi when they are modified in Medusa
- Sync product, collection & categories metadata between Medusa and Strapi
- Allow extending product data with Strapi's content types

## Usage

Once the plugin is set up, you can use Strapi's admin panel to add rich content to your products and use the Strapi API to fetch this content for your storefront.

Example of fetching product content from Strapi:

```js
// In your storefront
async function getProductContent(productId) {
  const response = await fetch(`${MEDUSA_BASE_URL}/store/products/${productId}?fields=cms_product.*`, {
    header: {
      "x-publishable-api-key": ${STOREFRONT_PUBLISHABLE_API_KEY}
    }
  });
  const data = await response.json();
  return data.data[0];
}
```
