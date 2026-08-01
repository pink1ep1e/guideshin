import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `Интерактивная карта | ${SITE_NAME}` },
  description: "Интерактивная карта Тейвата — сундуки, материалы, боссы и секреты Genshin Impact.",
  alternates: { canonical: "/map" },
};

const MAP_URL = "https://act.hoyolab.com/ys/app/interactive-map/?lang=ru-ru";

export default function MapPage() {
  return (
    <div className="map-page-root fixed inset-0 z-0">
      <h1 className="sr-only">Интерактивная карта Genshin Impact — Тейват</h1>
      <iframe
        src={MAP_URL}
        title="Интерактивная карта Genshin Impact"
        className="absolute inset-0 h-full w-full border-0"
        loading="eager"
        referrerPolicy="no-referrer-when-downgrade"
        allow="fullscreen; geolocation"
      />
    </div>
  );
}
