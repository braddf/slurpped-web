export default {
  name: "blog-post",
  i18n: true,
  type: "document",
  title: "News Post",
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
        "Used to generate the URL of the post - only lowercase letters, numbers and dashes",
      validation: (Rule) =>
        Rule.lowercase()
          .required()
          .custom((slug) => {
            if (slug === "posts") {
              return "The slug 'posts' is reserved, please choose another one";
            }
            console.log(slug, slug.match(/[^a-z0-9-]/g));
            if (slug.match(/[^a-z0-9-]/g)) {
              return "The slug can only contain lowercase letters, numbers and dashes";
            }

            return true;
          })
    },
    {
      name: "publishDate",
      type: "date",
      initialValue: new Date().toISOString(),
      options: {
        dateFormat: "DD-MM-YYYY"
      },
      title: "Publish Date"
    },
    {
      name: "excerpt",
      type: "array",
      of: [{ type: "block" }],
      title: "Excerpt"
    },
    {
      name: "featuredImage",
      type: "image",
      title: "Featured Image"
    },
    {
      title: "Content",
      name: "content",
      type: "array",
      of: [{ type: "block" }, { type: "table" }]
    },
    {
      name: "featuredRecipe",
      type: "reference",
      to: [{ type: "recipe" }],
      title: "Featured Recipe"
    }
  ]
};
