export interface Clinic {
  id: string;
  name: string;
  area: string;
  slug: string;
}

export interface Report {
  clinicId: string;
  timestamp: number;
  isWaiting: boolean;
  waitDuration?: "Just arrived / <15 min" | "15–30 min" | "30+ min";
  deviceId: string;
}

export const clinics: Clinic[] = [
  {
    id: "1",
    name: "Apollo Clinic Whitefield",
    area: "Whitefield, Bangalore",
    slug: "apollo-clinic-whitefield",
  },
  {
    id: "2",
    name: "Whitefield Dental Care",
    area: "Whitefield, Bangalore",
    slug: "whitefield-dental-care",
  },
  {
    id: "3",
    name: "Sparsh Clinic Whitefield",
    area: "Whitefield, Bangalore",
    slug: "sparsh-clinic-whitefield",
  },
  {
    id: "4",
    name: "Narayana Health City Whitefield",
    area: "Whitefield, Bangalore",
    slug: "narayana-health-city-whitefield",
  },
  {
    id: "5",
    name: "Cloudnine Hospital Whitefield",
    area: "Whitefield, Bangalore",
    slug: "cloudnine-hospital-whitefield",
  },
  {
    id: "6",
    name: "Whitefield Eye Care",
    area: "Whitefield, Bangalore",
    slug: "whitefield-eye-care",
  },
  {
    id: "7",
    name: "Dr. Agarwal's Eye Hospital Whitefield",
    area: "Whitefield, Bangalore",
    slug: "dr-agarwals-eye-hospital-whitefield",
  },
];

