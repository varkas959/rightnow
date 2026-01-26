"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { clinics } from "@/lib/data";
import { getAllClinicsReports, getClinicsUpdatedInLastHour, formatTimeAgo, getConfidenceLevel } from "@/lib/store";
import { calculateStatus, getStatusEmoji, getStatusText, getStatusColors, getCrowdStatusLabel, getWaitTimeRange } from "@/lib/status";
import type { Report } from "@/lib/data";
import type { StatusInfo } from "@/lib/status";

interface ClinicStatus {
  reports: Report[];
  statusInfo: StatusInfo;
  isLoading: boolean;
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [clinicStatuses, setClinicStatuses] = useState<Map<string, ClinicStatus>>(new Map());
  const [isLoadingAll, setIsLoadingAll] = useState(true);
  const router = useRouter();

  // Fetch reports for all clinics on mount
  useEffect(() => {
    const fetchAllReports = async () => {
      setIsLoadingAll(true);
      const clinicIds = clinics.map((c) => c.id);
      const reportsMap = await getAllClinicsReports(clinicIds);
      
      const statusMap = new Map<string, ClinicStatus>();
      for (const clinic of clinics) {
        const reports = reportsMap.get(clinic.id) || [];
        const statusInfo = calculateStatus(reports);
        statusMap.set(clinic.id, {
          reports,
          statusInfo,
          isLoading: false,
        });
      }
      
      setClinicStatuses(statusMap);
      setIsLoadingAll(false);
    };

    fetchAllReports();
  }, []);

  // Filter clinics based on search
  const filteredClinics = useMemo(() => {
    if (!searchQuery.trim()) return clinics;
    
    const query = searchQuery.toLowerCase();
    return clinics.filter(
      (clinic) =>
        clinic.name.toLowerCase().includes(query) ||
        clinic.area.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Calculate statistics
  const clinicsUpdatedInLastHour = useMemo(() => {
    const reportsMap = new Map<string, Report[]>();
    for (const [clinicId, status] of clinicStatuses.entries()) {
      reportsMap.set(clinicId, status.reports);
    }
    return getClinicsUpdatedInLastHour(reportsMap);
  }, [clinicStatuses]);

  const handleClinicClick = (slug: string) => {
    router.push(`/clinic/${slug}`);
  };

  const handleQuickUpdate = () => {
    // Navigate to first clinic or show clinic selector
    if (clinics.length > 0) {
      router.push(`/clinic/${clinics[0].slug}`);
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 pt-6 pb-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-blue-600 tracking-tight mb-2">
            statusnow
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-1">
            Check hospital crowds before you go
          </h1>
          <p className="text-sm text-gray-600">
            Live status for Whitefield hospitals • Updated by people like you.
          </p>
        </div>

        {/* Statistics */}
        {clinicsUpdatedInLastHour > 0 && (
          <div className="text-center mb-6 text-sm text-blue-600">
            {clinicsUpdatedInLastHour} hospitals updated in last hour • {clinics.length} tracked
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search hospital or area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
          />
        </div>

        {/* Section Header */}
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Whitefield Hospitals</h2>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs font-medium text-green-600">LIVE</span>
          </div>
        </div>

        {/* Clinic List */}
        <div className="space-y-3 mb-8">
          {filteredClinics.map((clinic) => {
            const clinicStatus = clinicStatuses.get(clinic.id);
            const reports = clinicStatus?.reports || [];
            const statusInfo = clinicStatus?.statusInfo || {
              status: "unknown" as const,
              description: "Status appears when people are visiting",
              confidence: "",
            };
            const isLoading = clinicStatus?.isLoading ?? isLoadingAll;

            // Get last updated time
            const newestReport = reports.length > 0 
              ? Math.max(...reports.map((r) => r.timestamp))
              : null;
            const lastUpdatedText = newestReport ? formatTimeAgo(newestReport) : null;
            
            // Get minutes ago for confidence
            const now = Date.now();
            const minutesAgo = newestReport ? Math.floor((now - newestReport) / (60 * 1000)) : 999;
            const confidenceInfo = getConfidenceLevel(reports.length, minutesAgo);
            
            // Get wait time range
            const waitTimeRange = getWaitTimeRange(reports);
            
            // Get status colors
            const colors = getStatusColors(statusInfo.status);
            const crowdLabel = getCrowdStatusLabel(statusInfo.status);

            const hasData = reports.length >= 2;

            // Get status emoji for hospital name
            const statusEmoji = getStatusEmoji(statusInfo.status);
            // Get border color based on status
            const borderColor = statusInfo.status === "smooth" ? "#027A48" 
              : statusInfo.status === "some-waiting" ? "#B54708"
              : statusInfo.status === "heavy-waiting" ? "#B42318"
              : "#667085";

            return (
              <div
                key={clinic.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden"
                style={{ borderLeftWidth: "4px", borderLeftColor: borderColor }}
                onClick={() => handleClinicClick(clinic.slug)}
              >
                {isLoading ? (
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ) : hasData ? (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                        <span>{statusEmoji}</span>
                        <span>{clinic.name}</span>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">{clinic.area}</div>
                      
                      <div className="flex flex-wrap gap-4 text-xs text-gray-600 mb-3">
                        {waitTimeRange !== "—" && (
                          <div className="flex items-center gap-1">
                            <span>⏱️</span>
                            <span>{waitTimeRange}</span>
                          </div>
                        )}
                        {lastUpdatedText && (
                          <div className="flex items-center gap-1">
                            <span>🕐</span>
                            <span>Updated: {lastUpdatedText}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <span>👥</span>
                          <span>{reports.length} report{reports.length !== 1 ? "s" : ""}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {confidenceInfo.isReliable ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                            {confidenceInfo.level}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
                            <span>⚠️</span>
                            <span>{confidenceInfo.level}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <div
                        className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border"
                        style={{
                          backgroundColor: colors.bg,
                          color: colors.text,
                          borderColor: colors.text + "40", // Add transparency to border color
                        }}
                      >
                        {crowdLabel}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                        <span>{statusEmoji}</span>
                        <span>{clinic.name}</span>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">{clinic.area}</div>
                      <div className="text-sm text-gray-500 mb-3">No updates yet</div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClinicClick(clinic.slug);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                      >
                        Be the first to update
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">📄</span>
            <h3 className="text-lg font-semibold text-gray-900">At a hospital right now?</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Help others save time - update wait time in 5 seconds
          </p>
          <button
            onClick={handleQuickUpdate}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Quick Update
          </button>
        </div>
      </div>
    </div>
  );
}
