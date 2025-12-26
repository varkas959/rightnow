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
    title: `Is ${clinic.name} running on time today? | Whitefield Bangalore`,
    description: `Check if ${clinic.name} in ${clinic.area} is running smoothly or has waiting right now. Live visit status based on recent visitor reports.`,
  };
}

export default function ClinicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

