export default {
  name: "recipe",
  i18n: true,
  type: "document",
  title: "Recipe",
  fields: [
    {
      name: "title",
      type: "string",
      title: "Title"
    },
    {
      name: "subtitle",
      type: "string",
      title: "Subtitle"
    },
    {
      name: "slug",
      type: "string",
      title: "Slug",
      description:
        "Used to generate the URL of the recipe - only lowercase letters, numbers and dashes",
      validation: (Rule) =>
        Rule.lowercase()
          .required()
          .custom((slug) => {
            if (slug === "recipes") {
              return "The slug 'recipes' is reserved, please choose another one";
            }
            console.log(slug, slug.match(/[^a-z0-9-]/g));
            if (slug.match(/[^a-z0-9-]/g)) {
              return "The slug can only contain lowercase letters, numbers and dashes";
            }

            return true;
          })
    },
    {
      name: "excerpt",
      type: "text",
      title: "Excerpt"
    },
    {
      name: "featuredImage",
      type: "image",
      title: "Featured Image"
    },
    {
      name: "source",
      title: "Source",
      type: "string"
    },
    {
      name: "sourceUrl",
      title: "Source URL",
      type: "url",
      validation: (Rule) =>
        Rule.uri({
          scheme: ["http", "https"]
        }),
      hidden: ({ parent }) => !parent.source
    },
    {
      name: "serves",
      title: "Serves",
      type: "number"
    },
    {
      name: "time",
      title: "Prep Time",
      type: "string"
    },
    {
      title: "Ingredients",
      name: "ingredients",
      type: "array",
      of: [{ type: "block" }]
    },
    {
      title: "Method",
      name: "method",
      type: "array",
      of: [{ type: "block" }]
    }
  ]
};
