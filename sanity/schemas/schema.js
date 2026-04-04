import generalSettings from "./general-settings";
import product from "./product";
import weeklySpecial from "./weekly-special";
import aboutPage from "./about-page";
import blogPost from "./blog-post";
import contactPage from "./contact-page";
import faqPage from "./faq-page";
import galleryPage from "./gallery-page";
import homePage from "./home-page";
import howItWorksBlock from "./how-it-works-block";
import location from "./location";
import mainMenu from "./main-menu";
import newsPage from "./news-page";
import partnersPage from "./partners-page";
import policyPage from "./policy-page";
import recipe from "./recipe";
import recipesPage from "./recipes-page";

// Then we give our schema to the builder and provide the result to Sanity
export default [
  // Core Slurpp'd types — managed by Ollie & Kate
  product,
  weeklySpecial,
  generalSettings,
  // Content pages
  homePage,
  aboutPage,
  faqPage,
  blogPost,
  newsPage,
  recipe,
  recipesPage,
  // Site structure
  mainMenu,
  policyPage,
  // Legacy / to be replaced in Week 5
  contactPage,
  galleryPage,
  howItWorksBlock,
  location,
  partnersPage
];
