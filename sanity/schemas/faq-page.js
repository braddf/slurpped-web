export default {
  name: "faq-page",
  i18n: true,
  type: "document",
  title: "FAQ Page",
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
      name: "faqs",
      type: "array",
      title: "FAQs",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "question",
              title: "Question",
              type: "string"
            },
            {
              name: "answer",
              title: "Answer",
              type: "array",
              of: [{ type: "block" }]
            }
          ]
        }
      ]
    }
  ]
};
