import { renderGuidesIndexOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const alt = "Developer Guides & Walkthroughs - CODERCOPS Tools";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderGuidesIndexOgImage();
}
