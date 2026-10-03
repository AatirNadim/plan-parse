import { getFeatureBySlug } from "../../../lib/features-data";
import FeaturePageTemplate from "../../../components/FeaturePageTemplate";

export const metadata = {
  title: "Power-User Utilities & Workstation Ergonomics — plan-parse",
  description:
    "Global Command Palette (⌘K), Retina diagram exports, targeted apply generation, keyboard shortcuts cheat sheet, and diagnostic CLI errors.",
};

export default function MiscellaneousPage() {
  const feature = getFeatureBySlug("miscellaneous");
  return <FeaturePageTemplate feature={feature} />;
}
