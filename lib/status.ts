import { Report } from "./data";

export type Status = "smooth" | "some-waiting" | "heavy-waiting" | "unknown";

export interface StatusInfo {
  status: Status;
  description: string;
  confidence: string;
}

function getConfidenceText(reports: Report[]): string {
  if (reports.length === 0) {
    return "";
  }
  
  const now = Date.now();
  const newestReport = Math.max(...reports.map((r) => r.timestamp));
  const minutesAgo = Math.floor((now - newestReport) / (60 * 1000));
  
  return `Based on reports in the last ${minutesAgo} minute${minutesAgo !== 1 ? "s" : ""}`;
}

/**
 * Isolates reports by time-of-day window (morning vs evening)
 * Morning: 6 AM - 2 PM
 * Evening: 2 PM - 10 PM
 * Night: 10 PM - 6 AM (next day)
 */
function getTimeWindow(date: Date): "morning" | "evening" | "night" {
  const hour = date.getHours();
  if (hour >= 6 && hour < 14) return "morning";
  if (hour >= 14 && hour < 22) return "evening";
  return "night";
}

function filterByTimeWindow(reports: Report[]): Report[] {
  if (reports.length === 0) return [];
  
  const now = new Date();
  const currentWindow = getTimeWindow(now);
  
  return reports.filter((report) => {
    const reportDate = new Date(report.timestamp);
    const reportWindow = getTimeWindow(reportDate);
    return reportWindow === currentWindow;
  });
}

export function calculateStatus(reports: Report[]): StatusInfo {
  const now = Date.now();
  const ninetyMinutes = 90 * 60 * 1000;
  
  // Strict freshness: only reports within 90 minutes
  const recentReports = reports.filter((r) => now - r.timestamp < ninetyMinutes);
  
  // Time-of-day isolation: only reports from current time window
  const windowedReports = filterByTimeWindow(recentReports);
  
  // If no fresh reports in current time window, show unknown state
  if (windowedReports.length === 0) {
    return {
      status: "unknown",
      description: "Status updates appear when people are visiting",
      confidence: "",
    };
  }
  
  // Status changes require MULTIPLE reports (never a single report)
  if (windowedReports.length === 1) {
    return {
      status: "unknown",
      description: "Status updates appear when people are visiting",
      confidence: "",
    };
  }
  
  const waitingReports = windowedReports.filter((r) => r.isWaiting);
  
  // If no waiting reports, check for smooth status
  if (waitingReports.length === 0) {
    const shortWaitReports = windowedReports.filter(
      (r) => r.waitDuration === "Just arrived / <15 min"
    );
    
    // Reports indicating "Just arrived / <15 min" may result in 🟢 Smooth if multiple reports
    if (shortWaitReports.length >= 2) {
      return {
        status: "smooth",
        description: "Visitors report little or no waiting right now",
        confidence: getConfidenceText(windowedReports),
      };
    }
    
    // Multiple reports but no clear waiting signal → unknown
    return {
      status: "unknown",
      description: "Status updates appear when people are visiting",
      confidence: "",
    };
  }
  
  // 3+ recent reports with waiting → 🔴 Heavy waiting
  if (waitingReports.length >= 3) {
    return {
      status: "heavy-waiting",
      description: "Multiple visitors report long waiting",
      confidence: getConfidenceText(windowedReports),
    };
  }
  
  // 2 waiting reports → 🟡 Some waiting
  if (waitingReports.length === 2) {
    return {
      status: "some-waiting",
      description: "A few visitors are currently waiting",
      confidence: getConfidenceText(windowedReports),
    };
  }
  
  // 1 waiting report (but multiple total) → unknown (need more signals)
  return {
    status: "unknown",
    description: "Status updates appear when people are visiting",
    confidence: "",
  };
}

export function getStatusEmoji(status: Status): string {
  switch (status) {
    case "smooth":
      return "🟢";
    case "some-waiting":
      return "🟡";
    case "heavy-waiting":
      return "🔴";
    case "unknown":
      return "⚪";
  }
}

export function getStatusText(status: Status): string {
  switch (status) {
    case "smooth":
      return "Moving smoothly";
    case "some-waiting":
      return "Some waiting reported";
    case "heavy-waiting":
      return "Heavy waiting reported";
    case "unknown":
      return "No one has shared an update recently";
  }
}

export function getStatusColors(status: Status): { bg: string; text: string } {
  switch (status) {
    case "smooth":
      return { bg: "#ECFDF3", text: "#027A48" };
    case "some-waiting":
      return { bg: "#FFFAEB", text: "#B54708" };
    case "heavy-waiting":
      return { bg: "#FEF3F2", text: "#B42318" };
    case "unknown":
      return { bg: "#F9FAFB", text: "#667085" };
  }
}

