import { getFeatureBySlug } from "../../../lib/features-data";
import FeaturePageTemplate from "../../../components/FeaturePageTemplate";

export const metadata = {
  title: "2-Tier Progressive IaC Resource Diff — plan-parse",
  description:
    "Surface popovers for instant action deltas paired with deep full-bleed modal split diffs and JSON attribute matrices.",
};

export default function ResourceDiffPage() {
  const feature = getFeatureBySlug("resource-diff");
  return <FeaturePageTemplate feature={feature} />;
}
