export default {
  name: "news-page",
  i18n: true,
  type: "document",
  title: "News Page",
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
      name: "intro",
      type: "array",
      title: "Intro",
      of: [{ type: "block" }]
    },
    {
      name: "searchLabel",
      type: "string",
      title: "Search Label"
    },
    {
      name: "searchPlaceholder",
      type: "string",
      title: "Search Placeholder"
    },
    {
      name: "filterLabel",
      description: "Label in format: 'Showing X of Y posts'",
      type: "string",
      title: "Filter Label"
    }
  ]
};
