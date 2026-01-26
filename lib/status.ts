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
  
  // Never show "0 minutes" - use "just now" for < 1 minute
  if (minutesAgo < 1) {
    return "Based on reports from just now";
  }
  
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
      description: "Long waiting reported by recent visitors",
      confidence: getConfidenceText(recentReports),
    };
  }
  
  if (yellow / total >= 0.5) {
    return {
      status: "some-waiting",
      description: "Moderate waiting reported by recent visitors",
      confidence: getConfidenceText(recentReports),
    };
  }
  
  if (green / total >= 0.5) {
    return {
      status: "smooth",
      description: "Little or no waiting reported by recent visitors",
      confidence: getConfidenceText(recentReports),
    };
  }
  
  // No majority (mixed signals) → safe fallback to "some waiting"
  return {
    status: "some-waiting",
    description: "Moderate waiting reported by recent visitors",
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
      // Reduced saturation by ~20%: from #FFFAEB to warmer, less alert-like
      return { bg: "#FDF8F0", text: "#B54708" };
    case "heavy-waiting":
      return { bg: "#FEF3F2", text: "#B42318" };
    case "unknown":
      return { bg: "#F9FAFB", text: "#667085" };
  }
}

/**
 * Map status to crowd status label for display
 */
export function getCrowdStatusLabel(status: Status): string {
  switch (status) {
    case "smooth":
      return "Not Crowded";
    case "some-waiting":
      return "Moderate";
    case "heavy-waiting":
      return "Very Crowded";
    case "unknown":
      return "No Recent Updates";
  }
}

/**
 * Get wait time range from reports (e.g., "< 15 min", "15-30 min", "45+ min")
 */
export function getWaitTimeRange(reports: Report[]): string {
  if (reports.length === 0) {
    return "—";
  }
  
  const now = Date.now();
  const ninetyMinutes = 90 * 60 * 1000;
  const recentReports = reports.filter((r) => now - r.timestamp < ninetyMinutes);
  
  if (recentReports.length === 0) {
    return "—";
  }
  
  // Get wait buckets from recent reports
  const buckets = recentReports
    .map((r) => {
      if (!r.waitDuration) return null;
      if (r.waitDuration === "Just arrived / <15 min") return "<15";
      if (r.waitDuration === "15–30 min") return "15-30";
      if (r.waitDuration === "30+ min") return "30+";
      return null;
    })
    .filter((b): b is "<15" | "15-30" | "30+" => b !== null);
  
  if (buckets.length === 0) {
    return "—";
  }
  
  // Count occurrences
  const counts = {
    "<15": buckets.filter((b) => b === "<15").length,
    "15-30": buckets.filter((b) => b === "15-30").length,
    "30+": buckets.filter((b) => b === "30+").length,
  };
  
  // Find most common bucket
  const maxCount = Math.max(counts["<15"], counts["15-30"], counts["30+"]);
  if (maxCount === 0) return "—";
  
  if (counts["30+"] === maxCount) {
    return "45+ min";
  } else if (counts["15-30"] === maxCount) {
    return "20-30 min";
  } else {
    return "< 15 min";
  }
}
