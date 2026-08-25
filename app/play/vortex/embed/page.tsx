import { PitchClient } from "@/components/vortex/pitch-client";

/* A bare, chrome-free copy of the game for embedding in an iframe — no nav, no
   footer, nothing but the pitch. Kept out of search results because it is the
   same content as /play/vortex, which is the page people should land on. */
export const metadata = {
  title: "Vortex Rugby",
  robots: { index: false, follow: false },
};

export default function VortexEmbedPage() {
  return <PitchClient />;
}
