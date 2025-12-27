"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { clinics } from "@/lib/data";
import { getRecentReports, hasRecentReport } from "@/lib/store";
import { calculateStatus, getStatusEmoji, getStatusText, getStatusColors } from "@/lib/status";
import ReportModal from "@/components/ReportModal";

export default function ClinicPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const router = useRouter();
  const [showReportModal, setShowReportModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const clinic = clinics.find((c) => c.slug === slug);

  if (!clinic) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Clinic not found
          </h1>
          <button
            onClick={() => router.push("/")}
            className="text-blue-600 hover:underline"
          >
            Go back to search
          </button>
        </div>
      </div>
    );
  }

  // Derive status from reports at render time (no state storage)
  // Status is always calculated fresh from reports, treating "unknown" as valid
  // Use refreshKey to force recalculation when reports are updated
  const reports = useMemo(() => getRecentReports(clinic.id), [clinic.id, refreshKey]);
  const statusInfo = useMemo(() => calculateStatus(reports), [reports]);

  // Recalculate hasRecentReport when refreshKey changes
  const userHasRecentReport = useMemo(() => hasRecentReport(clinic.id), [clinic.id, refreshKey]);

  const handleReportClick = () => {
    if (userHasRecentReport) {
      return;
    }
    setShowReportModal(true);
  };

  const handleReportComplete = () => {
    setShowReportModal(false);
    // Force re-render to recalculate status from updated reports
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-white px-4 py-8">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => router.push("/")}
          className="text-gray-600 mb-6 text-sm hover:text-gray-900"
        >
          ← Back to search
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Is {clinic.name} running on time right now?
          </h1>
          <p className="text-gray-600">{clinic.area}</p>
        </div>

        <div className="mb-8">
          <div 
            className="rounded-lg p-8 text-center border border-gray-200"
            style={{ backgroundColor: getStatusColors(statusInfo.status).bg }}
          >
            <div 
              className="text-4xl mb-4"
              style={{ color: getStatusColors(statusInfo.status).text }}
            >
              {getStatusEmoji(statusInfo.status)}
            </div>
            <h2 
              className="text-xl font-semibold mb-3"
              style={{ color: getStatusColors(statusInfo.status).text }}
            >
              {getStatusText(statusInfo.status)}
            </h2>
            <p 
              className="text-sm mb-4"
              style={{ color: getStatusColors(statusInfo.status).text }}
            >
              {statusInfo.description}
            </p>
            {statusInfo.confidence && (
              <p className="text-xs text-gray-500 mt-4">
                {statusInfo.confidence}
              </p>
            )}
          </div>
        </div>

        <div className="mb-8">
          <button
            onClick={handleReportClick}
            disabled={userHasRecentReport}
            className={`w-full py-4 rounded-lg font-medium ${
              userHasRecentReport
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-900 text-white hover:bg-gray-700 active:bg-gray-800"
            }`}
          >
            {userHasRecentReport
              ? "You've already shared an update recently. Thanks!"
              : "Are you currently here?"}
          </button>
          {!userHasRecentReport && (
            <p className="text-center text-xs text-gray-500 mt-2">
              Takes 3 seconds · No login needed
            </p>
          )}
        </div>

        <p className="text-center text-xs text-gray-500">
          This reflects current waiting experience, not clinic quality or
          appointment booking.
        </p>
      </div>

      {showReportModal && (
        <ReportModal
          clinicId={clinic.id}
          onClose={() => setShowReportModal(false)}
          onComplete={handleReportComplete}
        />
      )}
    </div>
  );
}

