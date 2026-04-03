import generalSettings from "./general-settings";
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
  generalSettings,
  aboutPage,
  contactPage,
  faqPage,
  galleryPage,
  homePage,
  howItWorksBlock,
  location,
  mainMenu,
  newsPage,
  blogPost,
  partnersPage,
  policyPage,
  recipe,
  recipesPage
];
