import {
  Blocks,
  ChartNoAxesCombined,
  DatabaseZap,
  SearchCheck,
  Workflow,
} from "lucide-react";

export const navItems = [
  {
    href: "/sources",
    label: "Data Sources",
    pageTitle: "Data Engine Sources",
    caption: "Channel health and ingestion",
    icon: DatabaseZap,
  },
  {
    href: "/labels",
    label: "Taxonomy",
    pageTitle: "Taxonomy Intelligence",
    caption: "Label hierarchy and impact",
    icon: Blocks,
  },
  {
    href: "/prompts",
    label: "Prompt Lab",
    pageTitle: "Semantic Prompt Lab",
    caption: "Prompt tuning and simulation",
    icon: ChartNoAxesCombined,
  },
  {
    href: "/search",
    label: "Results",
    pageTitle: "Semantic Search Console",
    caption: "VOC retrieval and drill-down",
    icon: SearchCheck,
  },
  {
    href: "/pipelines",
    label: "Pipeline Monitor",
    pageTitle: "Pipeline Runtime Monitor",
    caption: "Six-stage AI pipeline monitoring",
    icon: Workflow,
  },
] as const;
