export default {
  name: "about-page",
  i18n: true,
  type: "document",
  title: "About Page",
  groups: [
    {
      name: "team",
      title: "Team Section"
    }
  ],
  fields: [
    {
      name: "title",
      type: "string",
      title: "Title"
    },
    {
      name: "intro",
      type: "text",
      title: "Intro"
    },
    {
      title: "Content",
      name: "content",
      type: "array",
      of: [{ type: "block" }]
    },
    {
      name: "teamTitle",
      type: "string",
      title: "Team Title",
      group: "team"
    },
    {
      name: "teamSubtitle",
      type: "string",
      title: "Team Subtitle",
      group: "team"
    },
    {
      name: "teamMembers",
      type: "array",
      title: "Team Members",
      group: "team",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "name",
              type: "string",
              title: "Name"
            },
            {
              name: "role",
              type: "string",
              title: "Role"
            },
            {
              name: "image",
              type: "image",
              title: "Image",
              options: {
                hotspot: true
              }
            }
          ]
        }
      ]
    }
  ]
};
