export default {
  name: "general-settings",
  i18n: true,
  type: "document",
  title: "General Settings",
  groups: [
    {
      name: "general",
      title: "General"
    },
    {
      name: "contact",
      title: "Contact"
    }
  ],
  fields: [
    {
      name: "showAnnouncementBar",
      type: "boolean",
      title: "Show Announcement Bar",
      group: "general"
    },
    {
      name: "announcementBarText",
      type: "string",
      title: "Announcement Bar Text",
      group: "general"
    },
    {
      name: "orderButtonText",
      type: "string",
      title: "Order Button Text",
      group: "general"
    },
    {
      name: "products",
      type: "array",
      title: "Products",
      group: "general",
      of: [
        {
          type: "object",
          fields: [
            { name: "name", type: "string", title: "Display Name" },
            {
              name: "slug",
              type: "string",
              title: "Slug (Stable ID)",
              description:
                "Unique identifier stored in orders — must be identical across all languages (e.g. 'groentetas', 'mushrooms'). Never change this after orders have been placed."
            },
            { name: "stripeProductId", type: "string", title: "Stripe Product ID (prod_xxx)" },
            { name: "priceInCents", type: "number", title: "Price (in cents, e.g. 750 = €7.50)" },
            { name: "available", type: "boolean", title: "Available?", initialValue: true },
            { name: "sortOrder", type: "number", title: "Sort Order (lower = first)" }
          ],
          preview: {
            select: { title: "name", subtitle: "priceInCents" },
            prepare({ title, subtitle }) {
              return { title, subtitle: subtitle != null ? `€${(subtitle / 100).toFixed(2)}` : "" };
            }
          }
        }
      ]
    },
    {
      name: "contactEmail",
      type: "string",
      title: "Contact Email",
      group: "contact"
    },
    {
      name: "contactPhone",
      type: "string",
      title: "Contact Phone Number",
      group: "contact"
    },
    {
      name: "contactAddress",
      type: "string",
      title: "Contact Address",
      group: "contact"
    }
  ],
  preview: {
    select: {
      title: "contactEmail",
      subtitle: "__i18n_lang"
    },
    prepare({ title, subtitle }) {
      return {
        title: "General Settings",
        subtitle: subtitle
      };
    }
  }
};
