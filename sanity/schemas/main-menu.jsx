export default {
  name: "main-menu",
  i18n: true,
  type: "document",
  title: "Main Menu",
  preview: {
    select: {
      title: "__i18n_lang"
    },
    prepare({ title }) {
      const EMOJIS = {
        "en-gb": "🇬🇧",
        "nl-nl": "🇳🇱"
      };
      return {
        title: title === "en-gb" ? "English" : "Nederlands",
        media: <span style={{ fontSize: "1.5rem" }}>{title ? EMOJIS[title] : "❓"}</span>
      };
    }
  },
  fields: [
    {
      name: "links",
      type: "array",
      title: "Links",
      of: [
        {
          type: "object",
          fields: [
            {
              title: "Linked Page",
              name: "page",
              type: "reference",
              to: [
                {
                  title: "home-page",
                  type: "home-page"
                },
                {
                  type: "about-page"
                },
                {
                  type: "recipes-page"
                },
                {
                  type: "news-page"
                },
                {
                  type: "gallery-page"
                },
                {
                  type: "faq-page"
                },
                {
                  type: "contact-page"
                }
              ]
            },
            {
              name: "overrideTitle",
              type: "string",
              title: "Page Title Override"
            }
          ],
          preview: {
            select: {
              title: "page.title",
              subtitle: "page._type",
              status: "page.__i18n_lang"
            },
            prepare({ title, subtitle, status }) {
              const EMOJIS = {
                "en-gb": "🇬🇧",
                "nl-nl": "🇳🇱"
              };
              return {
                title: title,
                subtitle: subtitle,
                media: <span style={{ fontSize: "1.5rem" }}>{status ? EMOJIS[status] : "❓"}</span>
              };
            }
          }
        }
      ]
    }
  ]
};
