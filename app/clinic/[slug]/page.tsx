"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { clinics } from "@/lib/data";
import { getRecentReports, hasRecentReport } from "@/lib/store";
import { calculateStatus, getStatusEmoji, getStatusText, getStatusColors, StatusInfo } from "@/lib/status";
import ReportModal from "@/components/ReportModal";

export default function ClinicPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const router = useRouter();
  const [showReportModal, setShowReportModal] = useState(false);
  const [statusInfo, setStatusInfo] = useState<StatusInfo>({
    status: "unknown",
    description: "Status appears when people are visiting",
    confidence: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [reportCount, setReportCount] = useState(0);

  const clinic = clinics.find((c) => c.slug === slug);

  // Fetch reports from backend on load and when refreshTrigger changes
  useEffect(() => {
    if (!clinic) return;

    const fetchReports = async () => {
      setIsLoading(true);
      try {
        const reports = await getRecentReports(clinic.id);
        console.log(`Fetched ${reports.length} reports for clinic ${clinic.id}`);
        const calculatedStatus = calculateStatus(reports);
        setStatusInfo(calculatedStatus);
        setReportCount(reports.length);
      } catch (error) {
        console.error("Error fetching reports:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, [clinic, refreshTrigger]);

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

  const userHasRecentReport = hasRecentReport(clinic.id);

  const handleReportClick = () => {
    if (userHasRecentReport) {
      return;
    }
    setShowReportModal(true);
  };

  const handleReportComplete = async () => {
    setShowReportModal(false);
    // Refetch reports from backend after submission
    // Small delay to ensure backend has processed the report
    setTimeout(() => {
      setRefreshTrigger((prev) => prev + 1);
    }, 300);
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
              {getStatusText(statusInfo.status, reportCount)}
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

