"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Report } from "@/lib/data";
import { clinics } from "@/lib/data";
import { getRecentReports, hasRecentReport, formatTimeAgo } from "@/lib/store";
import { calculateStatus, getStatusEmoji, getStatusText, getStatusColors, StatusInfo, type Status } from "@/lib/status";
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
  const [recentReports, setRecentReports] = useState<Report[]>([]);

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
        setRecentReports(reports);
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

  // Map a single report's wait duration to a status bucket for display
  const getStatusFromReport = (report: Report): Status => {
    if (report.waitDuration === "Just arrived / <15 min") return "smooth";
    if (report.waitDuration === "15–30 min") return "some-waiting";
    if (report.waitDuration === "30+ min") return "heavy-waiting";
    return "unknown";
  };

  const sortedReports = useMemo(
    () => [...recentReports].sort((a, b) => b.timestamp - a.timestamp),
    [recentReports]
  );

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

        {/* Current status */}
        <div className="mb-6">
          <div
            className="rounded-lg p-6 text-center border border-gray-200"
            style={{ backgroundColor: getStatusColors(statusInfo.status).bg }}
          >
            <div
              className="text-4xl mb-3"
              style={{ color: getStatusColors(statusInfo.status).text }}
            >
              {getStatusEmoji(statusInfo.status)}
            </div>
            <h2
              className="text-xl font-semibold mb-1"
              style={{ color: getStatusColors(statusInfo.status).text }}
            >
              {getStatusText(statusInfo.status, reportCount)}
            </h2>
            <p
              className="text-sm mb-2"
              style={{ color: getStatusColors(statusInfo.status).text }}
            >
              {statusInfo.description}
            </p>
            {statusInfo.confidence && (
              <p className="text-xs text-gray-700 mt-2">
                {statusInfo.confidence}
              </p>
            )}
          </div>
        </div>

        {/* Are you here? */}
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
            Are you currently here?
          </button>
          {userHasRecentReport && (
            <p className="text-center text-xs text-gray-400 mt-2 opacity-60">
              You shared an update recently (updates allowed once per hour)
            </p>
          )}
          {!userHasRecentReport && (
            <p className="text-center text-xs text-gray-500 mt-2">
              Takes 3 seconds · No login needed
            </p>
          )}
        </div>

        {/* Recent updates or empty state */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Recent updates
          </h2>
          {sortedReports.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center">
              <div className="text-3xl mb-2">📊</div>
              <p className="text-sm font-medium text-gray-900 mb-1">
                No updates yet
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Be the first to share the current waiting experience for others.
              </p>
              <button
                onClick={handleReportClick}
                disabled={userHasRecentReport}
                className={`w-full py-3 rounded-lg text-sm font-medium ${
                  userHasRecentReport
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Share status
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedReports.map((report) => {
                const status = getStatusFromReport(report);
                const colors = getStatusColors(status);
                const emoji = getStatusEmoji(status);
                const timeAgo = formatTimeAgo(report.timestamp);

                let waitLabel = "";
                if (report.waitDuration === "Just arrived / <15 min") {
                  waitLabel = "< 15 min";
                } else if (report.waitDuration === "15–30 min") {
                  waitLabel = "15–30 min";
                } else if (report.waitDuration === "30+ min") {
                  waitLabel = "30+ min";
                }

                return (
                  <div
                    key={report.timestamp + (report.waitDuration || "")}
                    className="rounded-lg px-3 py-3 flex items-center justify-between border border-gray-100 text-sm"
                    style={{ backgroundColor: colors.bg, color: colors.text }}
                  >
                    <div className="flex items-center gap-2">
                      <span>{emoji}</span>
                      <span className="font-medium">
                        {status === "smooth"
                          ? "Not Crowded"
                          : status === "some-waiting"
                          ? "Moderate"
                          : status === "heavy-waiting"
                          ? "Very Crowded"
                          : "No recent status"}
                      </span>
                      {waitLabel && (
                        <span className="text-xs opacity-80">· {waitLabel} wait</span>
                      )}
                    </div>
                    <div className="text-xs opacity-80">{timeAgo}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Typical patterns placeholder */}
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">
            Typical patterns
          </h2>
          <p className="text-xs text-gray-500">
            Typical crowd patterns for this hospital will appear here once more
            people share their recent waiting experience.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
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

