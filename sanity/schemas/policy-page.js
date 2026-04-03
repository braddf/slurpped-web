export default {
  name: "policy-page",
  i18n: true,
  type: "document",
  title: "Policy Page",
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
      description: "Used to generate the URL - only lowercase letters, numbers and dashes",
      validation: (Rule) =>
        Rule.lowercase()
          .required()
          .custom((slug) => {
            console.log(slug, slug.match(/[^a-z0-9-]/g));
            if (slug.match(/[^a-z0-9-]/g)) {
              return "The slug can only contain lowercase letters, numbers and dashes";
            }

            return true;
          })
    },
    {
      name: "content",
      type: "array",
      title: "Content",
      of: [{ type: "block" }]
    }
  ]
};
