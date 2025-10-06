# Strapi Content Type Schemas

This directory contains the required Strapi content type schema files for the Medusa Strapi plugin.

## Installation

Copy these schema files to your Strapi project in the following locations:

### 1. Product Schema

Copy `product.json` to:

```
src/api/product/content-types/product/schema.json
```

### 2. Product Variant Schema

Copy `product-variant.json` to:

```
src/api/product-variant/content-types/product-variant/schema.json
```

### 3. Category Schema

Copy `category.json` to:

```
src/api/category/content-types/category/schema.json
```

### 4. Collection Schema

Copy `collection.json` to:

```
src/api/collection/content-types/collection/schema.json
```

## Important Notes

1. **Create directories if they don't exist**: You may need to create the directory structure if it doesn't already exist in your Strapi project.

2. **Restart Strapi**: After copying the schema files, restart your Strapi server for the changes to take effect.

3. **Field Requirements**: These schemas include all the required fields that the Medusa plugin expects:

   - `systemId`: Unique identifier linking to Medusa entities
   - `title`: Display name for the content
   - `handle`: URL-friendly identifier (for products, categories, collections)
   - `productType`: Product type information (products only)
   - `sku`: Stock keeping unit (variants only)

4. **Relations**: The schemas include proper relations between products and variants.

5. **Draft & Publish**: All content types are configured with draft and publish functionality enabled.

## Customization

You can extend these schemas with additional fields as needed for your use case. Just ensure you don't remove or rename the required fields listed above.
