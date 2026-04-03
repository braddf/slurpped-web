const colors = require("tailwindcss/colors");

module.exports = {
  content: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        green: colors.green,
        mangetout: "#008033",
        beetroot: "#930A4B",
        carrot: "#E06E2E",
        chickpea: "#FFF1CC",
        potato: "#FFFCF5",
        rainwater: "#FCF7F3",
        rosewater: "#FEFAFB",
        radish: "#FDF1F3",
        soil: {
          DEFAULT: "#432412",
          dark: "#0d0803"
        },
        sweetcorn: "#FFC940",
        cabbageLeaf: "#82C19C",
        newTrowel: "#cdc8c7",
        trowel: "#A89E98"
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
