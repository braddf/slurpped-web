export default {
  name: "location",
  i18n: true,
  type: "document",
  title: "Location",
  fields: [
    {
      name: "name",
      type: "string",
      title: "Name"
    },
    {
      name: "longName",
      type: "string",
      title: "Long Name"
    },
    {
      name: "address",
      type: "string",
      title: "address"
    },
    {
      name: "availableFrom",
      type: "string",
      title: "Available From"
    },
    {
      name: "availableTo",
      type: "string",
      title: "Available To"
    },
    {
      name: "directionsLink",
      type: "url",
      title: "Directions Link"
    },
    {
      name: "latitude",
      type: "number",
      title: "Latitude"
    },
    {
      name: "longitude",
      type: "number",
      title: "Longitude"
    },
    {
      name: "defaultStatus",
      type: "string",
      title: "Default Status",
      initialValue: "open",
      validation: (rule) => rule.required(),
      options: {
        list: [
          { title: "Open", value: "open" },
          { title: "Closed", value: "closed" }
        ]
      }
    }
  ]
};
