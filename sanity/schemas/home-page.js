export default {
  name: "home-page",
  i18n: true,
  type: "document",
  title: "Home Page",
  groups: [
    {
      name: "hero",
      title: "Hero Section"
    },
    {
      name: "how-it-works",
      title: "How It Works"
    },
    {
      name: "who-we-are",
      title: "Who We Are"
    },
    {
      name: "why-choose-us",
      title: "Why Choose Us"
    },
    {
      name: "supplier-spotlight",
      title: "Supplier Spotlight"
    },
    {
      name: "mushrooms",
      title: "Mushrooms"
    },
    {
      name: "blog",
      title: "Blog"
    },
    {
      name: "recipes",
      title: "Recipes"
    }
  ],
  fields: [
    {
      name: "title",
      type: "string",
      title: "Page Title",
      group: "hero"
    },
    {
      name: "heroTitle",
      type: "string",
      title: "Hero Title",
      group: "hero"
    },
    {
      name: "subtitle",
      type: "string",
      title: "Hero Subtitle",
      group: "hero"
    },
    {
      name: "heroBtnText",
      type: "string",
      title: "Hero Button Text",
      group: "hero"
    },
    {
      name: "howItWorksTitle",
      type: "string",
      title: "How It Works Title",
      group: "how-it-works"
    },
    {
      name: "howItWorksDescription",
      type: "array",
      title: "How It Works Description",
      of: [{ type: "block" }],
      group: "how-it-works"
    },
    {
      name: "howItWorksSteps",
      type: "array",
      title: "How It Works Steps",
      of: [{ type: "how-it-works-block" }],
      group: "how-it-works"
    },
    {
      name: "howItWorksBtnText",
      type: "string",
      title: "How It Works Button Text",
      group: "how-it-works"
    },
    {
      type: "string",
      title: "Who We Are Title",
      name: "whoWeAreTitle",
      group: "who-we-are"
    },
    {
      type: "text",
      title: "Who We Are Tagline",
      name: "whoWeAreTagline",
      group: "who-we-are"
    },
    {
      title: "Who We Are Content",
      name: "whoWeAreContent",
      type: "array",
      group: "who-we-are",
      of: [{ type: "block" }]
    },
    {
      type: "string",
      title: "Who We Are Button Text",
      name: "whoWeAreButtonText",
      group: "who-we-are"
    },
    {
      type: "string",
      title: "Why Choose Us Title",
      name: "whyChooseUsTitle",
      group: "why-choose-us"
    },
    {
      title: "Why Choose Us Content",
      name: "whyChooseUsContent",
      type: "array",
      group: "why-choose-us",
      of: [{ type: "block" }]
    },
    {
      type: "string",
      title: "Why Choose Us Button Text",
      name: "whyChooseUsButtonText",
      group: "why-choose-us"
    },
    {
      type: "string",
      title: "Why Choose Us Button Link",
      name: "whyChooseUsButtonLink",
      group: "why-choose-us"
    },
    {
      type: "string",
      title: "Supplier Spotlight Title",
      name: "supplierSpotlightTitle",
      group: "supplier-spotlight"
    },
    {
      type: "image",
      title: "Supplier Spotlight Logo",
      name: "supplierSpotlightLogo",
      group: "supplier-spotlight"
    },
    {
      type: "image",
      title: "Supplier Spotlight Graphic",
      name: "supplierSpotlightGraphic",
      group: "supplier-spotlight"
    },
    {
      title: "Supplier Spotlight Content",
      name: "supplierSpotlightContent",
      type: "array",
      group: "supplier-spotlight",
      of: [{ type: "block" }]
    },
    {
      type: "string",
      title: "Supplier Spotlight Button Text",
      name: "supplierSpotlightButtonText",
      group: "supplier-spotlight"
    },
    {
      type: "string",
      title: "Supplier Spotlight Button Link",
      name: "supplierSpotlightButtonLink",
      group: "supplier-spotlight"
    },
    {
      type: "string",
      title: "Mushrooms Title",
      name: "mushroomsTitle",
      group: "mushrooms"
    },
    {
      type: "string",
      title: "Mushrooms Logo Text",
      name: "mushroomsLogoText",
      group: "mushrooms"
    },
    {
      type: "image",
      title: "Mushrooms Logo",
      name: "mushroomsLogo",
      group: "mushrooms"
    },
    {
      type: "image",
      title: "Mushrooms Graphic",
      name: "mushroomsGraphic",
      group: "mushrooms"
    },
    {
      title: "Mushrooms Content",
      name: "mushroomsContent",
      type: "array",
      group: "mushrooms",
      of: [{ type: "block" }]
    },
    {
      type: "string",
      title: "Mushrooms Button Text",
      name: "mushroomsButtonText",
      group: "mushrooms"
    },
    {
      type: "string",
      title: "Mushrooms Button Link",
      name: "mushroomsButtonLink",
      group: "mushrooms"
    },
    {
      type: "string",
      title: "Blog Title",
      name: "blogTitle",
      group: "blog"
    },
    {
      type: "string",
      title: "Blog Button Text",
      name: "blogButtonText",
      group: "blog"
    },
    {
      type: "string",
      title: "Blog Post 'Read More' Text",
      name: "blogPostButtonText",
      group: "blog"
    },
    {
      type: "string",
      title: "Recipes Title",
      name: "recipesTitle",
      group: "recipes"
    },
    {
      type: "string",
      title: "Recipes Button Text",
      name: "recipesButtonText",
      group: "recipes"
    },
    {
      title: "Content",
      name: "content",
      type: "array",
      of: [{ type: "block" }]
    }
  ]
};
