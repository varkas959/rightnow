import type { Metadata } from "next";
import { clinics } from "@/lib/data";

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const { slug } = params;
  const clinic = clinics.find((c) => c.slug === slug);

  if (!clinic) {
    return {
      title: "Clinic not found | StatusNow",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: `${clinic.name} - Live Wait Times | StatusNow`,
    description: `Check real-time wait times and crowd status at ${clinic.name} in ${clinic.area}. Live status is based on recent visitor reports.`,
  };
}

export default function ClinicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

