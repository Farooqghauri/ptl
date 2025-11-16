import type { Metadata } from "next";
import HireTopLawyerClient from "./HireTopLawyerClient";

export const metadata: Metadata = {
  title: "Hire a Top Lawyer in Pakistan | Best Legal Services — PTL",
  description:
    "Hire top lawyers in Pakistan for civil, criminal, family, corporate, tax, property, and High Court cases. Verified attorneys, expert legal advice, and fast case support through PTL.",
};

export default function HireTopLawyerPage() {
  return <HireTopLawyerClient />;
}
