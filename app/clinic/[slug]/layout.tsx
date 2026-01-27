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
    title: `How crowded is ${clinic.name}? | StatusNow`,
    description: `Check real-time crowd and wait time status at ${clinic.name} in ${clinic.area}. Live status is based on recent visitor reports.`,
  };
}

export default function ClinicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

