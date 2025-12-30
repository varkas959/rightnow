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
 * Map frontend waitDuration to backend wait_bucket
 */
function getWaitBucket(waitDuration: string): "<15" | "15-30" | "30+" | null {
  if (waitDuration === "Just arrived / <15 min") return "<15";
  if (waitDuration === "15–30 min") return "15-30";
  if (waitDuration === "30+ min") return "30+";
  return null;
}

/**
 * Calculate status using majority rule based on wait_bucket values
 * Separates CONFIDENCE (number of reports) from SIGNAL (what reports say)
 */
export function calculateStatus(reports: Report[]): StatusInfo {
  const now = Date.now();
  const ninetyMinutes = 90 * 60 * 1000;
  
  // STEP 1: Filter fresh reports (last 90 minutes only)
  const recentReports = reports.filter((r) => now - r.timestamp < ninetyMinutes);
  
  // If less than 2 reports, return UNKNOWN
  if (recentReports.length < 2) {
    if (recentReports.length === 0) {
      return {
        status: "unknown",
        description: "Status appears when people are visiting",
        confidence: "",
      };
    }
    // Exactly 1 report
    return {
      status: "unknown",
      description: "Status becomes visible when more people share",
      confidence: "",
    };
  }
  
  // STEP 2: Aggregate signal (count wait_bucket values)
  let green = 0; // "<15"
  let yellow = 0; // "15-30"
  let red = 0; // "30+"
  
  for (const report of recentReports) {
    if (!report.waitDuration) continue;
    const bucket = getWaitBucket(report.waitDuration);
    if (bucket === "<15") green++;
    else if (bucket === "15-30") yellow++;
    else if (bucket === "30+") red++;
  }
  
  const total = green + yellow + red;
  
  // STEP 3: Derive status using majority rule
  if (total === 0) {
    // No valid wait buckets (shouldn't happen, but safe fallback)
    return {
      status: "unknown",
      description: "Status appears when people are visiting",
      confidence: "",
    };
  }
  
  // Majority rule: >= 50% threshold
  if (red / total >= 0.5) {
    return {
      status: "heavy-waiting",
      description: "Multiple visitors report long waiting",
      confidence: getConfidenceText(recentReports),
    };
  }
  
  if (yellow / total >= 0.5) {
    return {
      status: "some-waiting",
      description: "A few visitors are currently waiting",
      confidence: getConfidenceText(recentReports),
    };
  }
  
  if (green / total >= 0.5) {
    return {
      status: "smooth",
      description: "Visitors report little or no waiting right now",
      confidence: getConfidenceText(recentReports),
    };
  }
  
  // No majority (mixed signals) → safe fallback to "some waiting"
  return {
    status: "some-waiting",
    description: "A few visitors are currently waiting",
    confidence: getConfidenceText(recentReports),
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

export function getStatusText(status: Status, reportCount: number = 0): string {
  switch (status) {
    case "smooth":
      return "Moving smoothly";
    case "some-waiting":
      return "Some waiting reported";
    case "heavy-waiting":
      return "Heavy waiting reported";
    case "unknown":
      if (reportCount === 0) {
        return "No one has shared an update recently";
      } else if (reportCount === 1) {
        return "Only one recent update so far";
      }
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

