import { SHARES, shareCard } from "../share";

export const alt = SHARES["skyward"].title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return shareCard(SHARES["skyward"]);
}
