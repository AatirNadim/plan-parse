import { getFeatureBySlug } from "../../../lib/features-data";
import FeaturePageTemplate from "../../../components/FeaturePageTemplate";

export const metadata = {
  title: "Color Grading & Visual Grammar — plan-parse",
  description:
    "Rigorous semantic action tokens (Create, Update, Delete, Replace, Read, No-op), module containers, and dependency edges.",
};

export default function ColorGradingPage() {
  const feature = getFeatureBySlug("color-grading");
  return <FeaturePageTemplate feature={feature} />;
}
