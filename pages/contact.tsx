import React from "react";
import { NextPageContext } from "next";
import { createClient } from "@sanity/client";
import { getCookies } from "cookies-next";
import GoogleMapReact from "google-map-react";
import { GeneralSettings, Location } from "../types";
import { theme } from "../tailwind.config.js";

const mapStyle = [
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [
      {
        lightness: 100
      },
      {
        visibility: "simplified"
      }
    ]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [
      {
        visibility: "on"
      },
      {
        color: "#C6E2FF"
      }
    ]
  },
  {
    featureType: "poi",
    elementType: "geometry.fill",
    stylers: [
      {
        color: theme.extend.colors.radish || "#C5E3BF"
      }
    ]
  },
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [
      {
        color: theme.extend.colors.chickpea || "#D1D1B8"
      }
    ]
  },
  {
    featureType: "landscape.man_made",
    elementType: "geometry.fill",
    stylers: [
      {
        color: theme.extend.colors.potato || "#D1D1B8"
      }
    ]
  },
  {
    featureType: "landscape.natural",
    elementType: "geometry.fill",
    stylers: [
      {
        color: theme.extend.colors.cabbageLeaf || "#82C19C"
      }
    ]
  }
];

const ContactSection = ({
  title,
  description,
  horizontal = false,
  children
}: {
  title: string;
  description: string;
  horizontal?: boolean;
  children: React.ReactNode;
}) => {
  return (
    <section className="mb-16">
      <div className={`flex ${horizontal ? "items-center" : "flex-col"}`}>
        <h2 className="flex-1 text-xl mb-6 sm:mb-12 text-underline-primary">{title}</h2>
        {/*{description && <p className="flex-1">{description}</p>}*/}
        <div className="flex-[2] flex flex-col md:flex-row gap-6">{children}</div>
      </div>
    </section>
  );
};

export default function Contact(
  page: IContactPage & { locations: Location[]; settings: GeneralSettings }
) {
  return (
    <div className="mx-4 sm:mx-16 md:container pt-8 sm:pt-12 mb-32">
      <h1 className="text-2xl font-bold mb-8 sm:mb-12 pt-0 text-underline-primary text-center">
        {page.title}
      </h1>
      <ContactSection title={page.inPersonTitle} description={""}>
        {page.locations.map((location) => {
          const { latitude, longitude } = location;
          const renderMarkers = (map: any, maps: any) => {
            let marker = new maps.Marker({
              position: { lat: latitude, lng: longitude },
              map,
              title: location.name
            });
            return marker;
          };
          return (
            <div className="flex-1 flex flex-col mb-3 sm:mb-4 justify-between" key={location._id}>
              <div>
                <h3 className="text-base font-bold">{location.longName}</h3>
                <p>{location.address}</p>
                <p className="mb-4">
                  Wednesday {location.availableFrom} - {location.availableTo}
                </p>
              </div>
              <div className="self-end" style={{ height: "16rem", width: "100%" }}>
                <GoogleMapReact
                  bootstrapURLKeys={{ key: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "" }}
                  defaultCenter={{ lat: latitude, lng: longitude }}
                  defaultZoom={13}
                  yesIWantToUseGoogleMapApiInternals
                  options={{ styles: mapStyle }}
                  onGoogleApiLoaded={({ map, maps }: { map: any; maps: any }) =>
                    renderMarkers(map, maps)
                  }
                ></GoogleMapReact>
              </div>
            </div>
          );
        })}
      </ContactSection>
      <ContactSection title={page.byEmailTitle} description={page.byEmailText} horizontal>
        <div className="flex-1">
          <a href={`mailto:${page.settings.contactEmail}`}>{page.settings.contactEmail}</a>{" "}
          <p className="mt-4">{page.byEmailText}</p>
        </div>
      </ContactSection>
      <ContactSection title={page.byPhoneTitle} description={page.byPhoneText} horizontal>
        <div className="flex-1">
          <a href={`tel:${page.settings.contactPhone}`}>{page.settings.contactPhone}</a>{" "}
          <p className="mt-4">{page.byPhoneText}</p>
        </div>
      </ContactSection>
    </div>
    // </Wrapper>
  );
}
export const getServerSideProps = async (context: NextPageContext) => {
  const client = createClient({
    projectId: "lrkfr7go",
    dataset: "production",
    apiVersion: "2021-10-21",
    token: process.env.SANITY_BOT_TOKEN
    // useCdn: true,
  });

  const language = getCookies(context)["groentetas/lang"] || "en-gb";

  const query = `*[_type in ["contact-page", "location", "general-settings"] && __i18n_lang == "${language}"]`;

  let page: any;
  let locations: any;
  let settings: any;
  await client.fetch(query).then((pages: (IContactPage | Location | GeneralSettings)[]) => {
    page = pages.filter((d) => d._type === "contact-page")[0];
    locations = pages.filter((d) => d._type === "location");
    settings = pages.filter((d) => d._type === "general-settings")[0];
  });

  if (!page?.title || !settings?._type) {
    return {
      notFound: true
    };
  }
  return {
    props: {
      ...page,
      locations: locations,
      settings: settings
    }
  };
};

type IContactPage = {
  _type: "contact-page";
  title: string;
  inPersonTitle: string;
  byEmailTitle: string;
  byEmailText: string;
  byPhoneTitle: string;
  byPhoneText: string;
};
