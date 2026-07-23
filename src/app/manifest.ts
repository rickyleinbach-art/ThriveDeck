import type { MetadataRoute } from "next";

// Web app manifest — served by Next at /manifest.webmanifest and linked
// automatically from the document head.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "ThriveDeck",
    short_name: "ThriveDeck",
    description: "Your metabolic health, in one place.",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0B0F14",
    theme_color: "#0B0F14",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
