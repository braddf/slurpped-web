export default {
  name: "general-settings",
  i18n: true,
  type: "document",
  title: "General Settings",
  groups: [
    {
      name: "general",
      title: "General"
    },
    {
      name: "contact",
      title: "Contact"
    }
  ],
  fields: [
    {
      name: "showAnnouncementBar",
      type: "boolean",
      title: "Show Announcement Bar",
      group: "general"
    },
    {
      name: "announcementBarText",
      type: "string",
      title: "Announcement Bar Text",
      group: "general"
    },
    {
      name: "orderButtonText",
      type: "string",
      title: "Order Button Text",
      group: "general"
    },
    {
      name: "nextWeekTeaser",
      type: "string",
      title: "Coming Next Week",
      description: "Short teaser shown on homepage. Update every Monday as part of SOP 1.",
      group: "general"
    },
    {
      name: "contactEmail",
      type: "string",
      title: "Contact Email",
      group: "contact"
    },
    {
      name: "contactPhone",
      type: "string",
      title: "Contact Phone Number",
      group: "contact"
    },
    {
      name: "contactAddress",
      type: "string",
      title: "Contact Address",
      group: "contact"
    }
  ],
  preview: {
    select: {
      title: "contactEmail",
      subtitle: "__i18n_lang"
    },
    prepare({ title, subtitle }) {
      return {
        title: "General Settings",
        subtitle: subtitle
      };
    }
  }
};
