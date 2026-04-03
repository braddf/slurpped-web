export default {
  name: "how-it-works-block",
  i18n: true,
  type: "object",
  title: "How It Works Step",
  // groups: [
  //   {
  //     name: "hero",
  //     title: "Hero Section"
  //   },
  //   {
  //     name: "how-it-works",
  //     title: "How It Works"
  //   }
  // ],
  fields: [
    {
      name: "icon",
      type: "file",
      title: "Icon"
    },
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
      title: "Content",
      name: "content",
      type: "array",
      of: [{ type: "block" }]
    }
  ]
};
