import { getFeatureBySlug } from "../../../lib/features-data";
import FeaturePageTemplate from "../../../components/FeaturePageTemplate";

export const metadata = {
  title: "Workbench Sidebar & Local Plan Ingestion — plan-parse",
  description:
    "Docked left hierarchy tree, real-time search, action filtering, and local drag-and-drop ingestion with zero telemetry.",
};

export default function WorkbenchSidebarPage() {
  const feature = getFeatureBySlug("workbench-sidebar");
  return <FeaturePageTemplate feature={feature} />;
}
