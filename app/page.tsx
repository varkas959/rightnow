"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { clinics } from "@/lib/data";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const filteredClinics = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return clinics.filter(
      (clinic) =>
        clinic.name.toLowerCase().includes(query) ||
        clinic.area.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const hasNoMatches = searchQuery.trim().length > 0 && filteredClinics.length === 0;

  const handleClinicSelect = (slug: string) => {
    router.push(`/clinic/${slug}`);
  };

  return (
    <div className="min-h-screen bg-white px-4 pt-6 pb-8 relative">
      <div className="text-2xl font-bold text-blue-600 tracking-tight mb-3">
        statusnow
      </div>
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Is this clinic running on time right now?
          </h1>
          <p className="text-sm text-gray-500 mb-3">
            Live visit status for selected clinics in Bangalore
          </p>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder='Search clinic name or area (e.g. "Dentist Whitefield")'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-400 text-base"
          />

          {filteredClinics.length > 0 && (
            <div className="mt-2 border border-gray-200 rounded-lg bg-white shadow-sm">
              {filteredClinics.map((clinic) => (
                <button
                  key={clinic.id}
                  onClick={() => handleClinicSelect(clinic.slug)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 first:rounded-t-lg last:rounded-b-lg"
                >
                  <div className="font-medium text-gray-900">{clinic.name}</div>
                  <div className="text-sm text-gray-500">{clinic.area}</div>
                </button>
              ))}
            </div>
          )}

          {hasNoMatches && (
            <div className="mt-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm font-medium text-gray-900 mb-1">
                We're not tracking this place yet
              </p>
              <p className="text-xs text-gray-600 mb-2">
                Currently showing live status only for selected standalone clinics in Whitefield.
              </p>
              <p className="text-xs text-gray-500">
                Hospitals and large OPDs will be added later.
              </p>
            </div>
          )}
        </div>

        <div className="text-center text-sm text-gray-600">
          Tracking selected clinics in Whitefield
        </div>
      </div>
    </div>
  );
}

