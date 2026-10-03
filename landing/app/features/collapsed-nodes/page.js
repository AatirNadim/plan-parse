import { getFeatureBySlug } from "../../../lib/features-data";
import FeaturePageTemplate from "../../../components/FeaturePageTemplate";

export const metadata = {
  title: "Collapsed Nodes (Mutations Only) — plan-parse",
  description:
    "Deterministic DAG reduction that prunes unchanged no-op resources while computing transitive closure edges between surviving mutated nodes.",
};

export default function CollapsedNodesPage() {
  const feature = getFeatureBySlug("collapsed-nodes");
  return <FeaturePageTemplate feature={feature} />;
}
