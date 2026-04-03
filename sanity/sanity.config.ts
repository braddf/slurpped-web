import { defineConfig } from "sanity";
import { withDocumentI18nPlugin } from "@sanity/document-internationalization";
import { table } from "@sanity/table";
import { deskTool } from "sanity/desk";
import schemas from "./schemas/schema";

export default defineConfig({
  name: "green-pelican",
  title: "Groentetas",
  projectId: "lrkfr7go",
  dataset: "production",
  plugins: withDocumentI18nPlugin([deskTool(), table()], {
    base: "en-gb",
    languages: [
      {
        title: "English (UK)",
        id: "en-gb"
      },
      {
        title: "Dutch (NL)",
        id: "nl-nl"
      }
    ]
  }),
  schema: {
    types: schemas
  },
  env: {
    development: {
      plugins: ["@sanity/vision"]
    }
  },
  parts: [
    {
      name: "part:@sanity/base/schema",
      path: "./schemas/schema"
    },
    {
      implements: "part:@sanity/base/root",
      path: "plugins/sanity-plugin-tutorial/CustomDefaultLayout"
    }
  ]
});
