export default {
  name: "partners-page",
  i18n: true,
  type: "document",
  title: "Partners Page",
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
      name: "homepageBtnText",
      type: "string",
      title: "Homepage Button Text"
    },
    {
      name: "partners",
      type: "array",
      title: "Partners",
      of: [
        {
          name: "partner",
          type: "object",
          title: "Partner",
          fields: [
            {
              name: "name",
              type: "string",
              title: "Name"
            },
            {
              name: "logo",
              type: "image",
              title: "Logo"
            },
            {
              name: "url",
              type: "url",
              title: "URL"
            },
            {
              name: "description",
              type: "array",
              title: "Description",
              of: [{ type: "block" }]
            }
          ]
        }
      ]
    }
  ]
};
