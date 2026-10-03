import { getFeatureBySlug } from "../../../lib/features-data";
import FeaturePageTemplate from "../../../components/FeaturePageTemplate";

export const metadata = {
  title: "Dedicated Resource Panel (Inspector) — plan-parse",
  description:
    "Docked right slide-over inspector showing attribute diffs, bidirectional lineage navigation chips, and raw schema views.",
};

export default function ResourcePanelPage() {
  const feature = getFeatureBySlug("resource-panel");
  return <FeaturePageTemplate feature={feature} />;
}
