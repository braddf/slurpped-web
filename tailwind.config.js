const colors = require("tailwindcss/colors");

module.exports = {
  content: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        green: colors.green,
        mangetout: "#D9A020", // was GT green (#008033) — repurposed to deep yellow accent
        beetroot: "#930A4B", // unchanged
        carrot: "#C84B1A",   // was GT orange (#E06E2E) — now burnt orange (all CTAs)
        chickpea: "#FBF0D8", // was pale yellow (#FFF1CC) — now warm cream (card fills)
        potato: "#FFFCF5",   // unchanged
        rainwater: "#FDF8ED", // was pinkish cream (#FCF7F3) — now warm cream (page bg)
        rosewater: "#FEFAFB", // unchanged
        radish: "#FDF1F3",   // unchanged
        soil: {
          DEFAULT: "#3D1800", // was dark brown (#432412) — now richer dark brown (headings/body)
          dark: "#1A0800"     // was near-black (#0d0803) — now near-black
        },
        sweetcorn: "#F2BE35", // was bright yellow (#FFC940) — now noodle golden (primary bg)
        broth: "#6B3010",     // new — mid brown (secondary text)
        shoyu: "#8B1A1A",     // new — deep red (accent, use sparingly)
        cabbageLeaf: "#82C19C", // GT-only, kept to avoid breaking contact/admin pages
        newTrowel: "#cdc8c7",   // GT-only, kept to avoid breaking form styles
        trowel: "#A89E98"       // GT-only, kept to avoid breaking admin/users page
      },
      boxShadow: {
        solid: "0 2px 0 0 rgba(0, 0, 0, 1)"
      },
      textUnderlineOffset: {
        10: "10px"
      }
    },
    container: {
      center: true,
      padding: {
        DEFAULT: "2rem",
        sm: "3rem"
      }
      // padding: "3rem"
    }
  },
  plugins: []
};
