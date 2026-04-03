export default {
  name: "gallery-page",
  i18n: true,
  type: "document",
  title: "Gallery Page",
  fields: [
    {
      name: "title",
      type: "string",
      title: "Title"
    },
    {
      name: "description",
      type: "array",
      title: "Description",
      of: [{ type: "block" }]
    },
    {
      name: "images",
      type: "array",
      title: "Images",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "image",
              title: "Image",
              type: "image",
              options: {
                hotspot: true
              },
              fields: [
                {
                  name: "alt",
                  type: "string",
                  title: "Alternative text"
                }
              ]
            },
            {
              name: "caption",
              type: "string",
              title: "Caption"
            }
          ]
        }
      ],
      options: {
        layout: "grid"
      }
    }
  ],

  preview: {
    select: {
      title: "title",
      subtitle: "subtitle",
      status: "__i18n_lang",
      images: "images"
    },
    prepare({ title, subtitle, images, status }) {
      const EMOJIS = {
        "en-gb": "🇬🇧",
        "nl-nl": "🇳🇱"
      };
      return {
        title: `${title} [${Object.keys(images).length}]`,
        subtitle: subtitle,
        media: <span style={{ fontSize: "1.5rem" }}>{status ? EMOJIS[status] : "❓"}</span>
      };
    }
  }
};
