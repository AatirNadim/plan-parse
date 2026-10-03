import { getFeatureBySlug } from "../../../lib/features-data";
import FeaturePageTemplate from "../../../components/FeaturePageTemplate";

export const metadata = {
  title: "Blast Radius Analysis & Subgraph Isolation — plan-parse",
  description:
    "Transitive BFS graph traversal tracking upstream dependencies and downstream references with on-canvas metrics and subgraph isolation.",
};

export default function BlastRadiusPage() {
  const feature = getFeatureBySlug("blast-radius");
  return <FeaturePageTemplate feature={feature} />;
}
