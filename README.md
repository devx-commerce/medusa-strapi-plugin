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

## What You'll Achieve

After completing this setup, you'll have:

- ✅ **Automatic sync** between Medusa and Strapi
- ✅ **Rich content management** for products in Strapi
- ✅ **Extended product data** with custom fields and media
- ✅ **Unified API** to query products with CMS content
- ✅ **Scalable architecture** for omnichannel commerce

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
- [Strapi v5](https://docs.strapi.io/) (latest stable)
- Node.js >= 18.x
- A running Medusa application
- A running Strapi application

## Prerequisites

Before starting, make sure you have:

1. **A Medusa application** set up and running
   - If you don't have one, follow the [Medusa quickstart guide](https://docs.medusajs.com/create-medusa-app)
2. **A Strapi application** set up and running
   - If you don't have one, create it with: `npx create-strapi-app@latest my-strapi-cms`
3. **Basic knowledge** of:
   - Medusa concepts (products, variants, collections, categories)
   - Strapi content types and API tokens
   - Environment variables

## Quick Start Guide

> **⏱️ Estimated time:** 15-30 minutes  
> **🎯 Difficulty:** Beginner to Intermediate  
> **📋 You'll need:** Medusa app, Strapi app, and basic terminal knowledge

### Step 1: Install the Plugin

```bash
npm install @devx-commerce/strapi @strapi/client
# or
yarn add @devx-commerce/strapi @strapi/client
```

### Step 2: Configure Medusa

Add the plugin to your `medusa-config.js`:

```js
const { defineConfig } = require("@medusajs/medusa"); // or "@medusajs/framework/utils"

module.exports = defineConfig({
  // ... other config
  plugins: [
    // ... other plugins,
    {
      resolve: "@devx-commerce/strapi",
      options: {
        base_url: process.env.STRAPI_URL,
        api_key: process.env.STRAPI_API_KEY,
      },
    },
  ],
});
```

### Step 3: Set Up Strapi

#### 3.1 Create or Configure Your Strapi Project

1. Install Strapi if you haven't already:

```bash
npx create-strapi-app@latest my-strapi-cms
```

2. Start your Strapi server:

```bash
cd my-strapi-cms
npm run develop
```

#### 3.2 Create an API Token

- Go to **Settings > API Tokens**
- Create a new full access token
- Copy the token to use in your Medusa configuration

#### 3.3 Create Content Types

You have two options to create the content types:

### Option A: Using Schema Files (Recommended)

This method is less error-prone and ensures exact field matching:

- Copy the schema files from the `strapi-schemas/` directory in this plugin to your Strapi project
- Place them in `src/api/[content-type-name]/content-types/[content-type-name]/schema.json`

**Required content types and their locations:**

- **Product**: `src/api/product/content-types/product/schema.json`
- **Product Variant**: `src/api/product-variant/content-types/product-variant/schema.json`
- **Category**: `src/api/category/content-types/category/schema.json`
- **Collection**: `src/api/collection/content-types/collection/schema.json`

After adding the schema files, restart your Strapi server to apply the changes.

### Option B: Using Strapi Admin Panel (Manual)

If you prefer to create content types manually through the Strapi admin interface:

1.  **Start your Strapi server**: `npm run develop` or `yarn develop`
2.  **Access Strapi Admin**: Go to `http://localhost:1337/admin`
3.  **Navigate to Content-Type Builder** in the sidebar

#### Create Product Content Type:

1.  Click **"Create new collection type"**
2.  **Display name**: "Product"
3.  **API ID (singular)**: "product"
4.  **Add these fields**:
    - `title` (Text, Required)
    - `systemId` (Text, Required, Unique)
    - `handle` (Text)
    - `productType` (Text)
5.  **Save** the content type

#### Create Product Variant Content Type:

1.  Click **"Create new collection type"**
2.  **Display name**: "Product Variant"
3.  **API ID (singular)**: "product-variant" ⚠️ **Important: Use hyphen, not underscore**
4.  **Add these fields**:
    - `title` (Text, Required)
    - `systemId` (Text, Required, Unique)
    - `sku` (Text)
5.  **Add relation field**:
    - **Field name**: "product"
    - **Relation type**: Many-to-One
    - **Target**: Product
6.  **Save** the content type

#### Create Category Content Type:

1.  Click **"Create new collection type"**
2.  **Display name**: "Category"
3.  **API ID (singular)**: "category"
4.  **Add these fields**:
    - `title` (Text, Required)
    - `systemId` (Text, Required, Unique)
    - `handle` (Text)
5.  **Save** the content type

#### Create Collection Content Type:

1.  Click **"Create new collection type"**
2.  **Display name**: "Collection"
3.  **API ID (singular)**: "collection"
4.  **Add these fields**:
    - `title` (Text, Required)
    - `systemId` (Text, Required, Unique)
    - `handle` (Text)
5.  **Save** the content type

#### Complete Product Relations:

After creating Product Variant, go back to the **Product** content type and add:

- **Field name**: "variants"
- **Relation type**: One-to-Many
- **Target**: Product Variant

**⚠️ Critical Notes for Manual Creation:**

- Content type names must be exact: `product`, `product-variant`, `category`, `collection`
- Field names must match exactly: `title`, `systemId`, `handle`, `productType`, `sku`
- `systemId` field must be set as **Required** and **Unique**
- Relations must be properly configured between Product and Product Variant

**Required fields summary:**

- **Product**: `title`, `systemId` (unique), `handle`, `productType`, `variants` (relation)
- **Product Variant**: `title`, `systemId` (unique), `sku`, `product` (relation)
- **Category**: `title`, `systemId` (unique), `handle`
- **Collection**: `title`, `systemId` (unique), `handle`

### Step 4: Configure Environment Variables

Add these variables to your Medusa `.env` file:

```
STRAPI_URL=http://localhost:1337/api
STRAPI_API_KEY=your-api-token-here
```

### Step 5: Start Your Applications

1. **Start Strapi**: `npm run develop` (in your Strapi directory)
2. **Start Medusa**: `npm run dev` (in your Medusa directory)
3. **Check the logs** for "Connected to Strapi" message

### Step 6: Test the Integration

1. **Create a test product** in Medusa Admin (`http://localhost:9000/app`)
2. **Check Strapi Admin** (`http://localhost:1337/admin`) to see if the product appears
3. **Add rich content** to the product in Strapi
4. **Query the product** from your storefront to see the combined data

## How It Works

After installation and setup, the plugin will automatically:

- Create and update products, collections & categories in Strapi when they are modified in Medusa
- Sync product, collection & category metadata between Medusa and Strapi
- Allow extending product data with Strapi's content types

## Usage

Once the plugin is set up, you can use Strapi's admin panel to add rich content to your products and use the Strapi API to fetch this content for your storefront.

Example of fetching product content from Medusa (with Strapi fields):

```js
// In your storefront using the Medusa JS SDK
import { sdk } from "@medusajs/js-sdk";

const medusa = sdk({
  baseUrl: MEDUSA_BASE_URL,
  publishableApiKey: STOREFRONT_PUBLISHABLE_API_KEY,
});

async function getProductContent(productId) {
  const { product } = await medusa.store.product.retrieve(productId, {
    fields: "cms_product.*",
  });
  return product;
}

// Alternative: Fetch product with Strapi content using query parameters
async function getProductWithStrapiContent(productId) {
  const { product } = await medusa.store.product.retrieve(productId, {
    fields: "+metadata.strapiId,+metadata.strapiSyncedAt",
  });

  // If you need to fetch additional Strapi content directly
  if (product.metadata?.strapiId) {
    // Use Strapi's API directly for rich content
    const strapiResponse = await fetch(
      `${STRAPI_BASE_URL}/products/${product.metadata.strapiId}`,
      {
        headers: {
          Authorization: `Bearer ${STRAPI_API_KEY}`,
        },
      },
    );
    const strapiContent = await strapiResponse.json();
    return { ...product, strapiContent: strapiContent.data };
  }

  return product;
}
```

## Troubleshooting

### Common Issues

**1. Content Type Validation Errors**
If you see errors about missing content types or fields, ensure you've:

- Copied all schema files from `strapi-schemas/` to the correct locations in your Strapi project
- Restarted your Strapi server after adding the schema files
- Used the exact field names specified in the schemas

**2. HTTP 400/404 Errors**
The plugin now provides detailed error logging. Check your Medusa logs for:

- Full Strapi error responses
- Specific field validation errors
- Content type existence issues

**3. Product Variant Naming**
Ensure your Strapi content type is named `product-variant` (with hyphen), not just `Variant`.

**4. Missing Fields**
The plugin expects these exact field names:

- Products: `title`, `systemId`, `handle`, `productType`
- Product Variants: `title`, `systemId`, `sku`
- Categories: `title`, `systemId`, `handle`
- Collections: `title`, `systemId`, `handle`

## Documentation

- [Medusa Documentation](https://docs.medusajs.com)
- [Strapi Documentation](https://docs.strapi.io)
- [Plugin Guide](./src/)

---
