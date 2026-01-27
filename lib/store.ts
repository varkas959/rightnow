"use client";

import { Report, BackendReport } from "./data";

const DEVICE_ID_KEY = "rightnow_device_id";
const LAST_REPORT_KEY_PREFIX = "rightnow_last_report_";

function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

// Convert backend report format to frontend format
function convertBackendReport(backendReport: BackendReport): Report {
  const waitDurationMap: Record<string, "Just arrived / <15 min" | "15–30 min" | "30+ min"> = {
    "<15": "Just arrived / <15 min",
    "15-30": "15–30 min",
    "30+": "30+ min",
  };

  return {
    clinicId: backendReport.clinic_id,
    timestamp: backendReport.created_at,
    isWaiting: true, // All backend reports are waiting reports (Step 2 completion)
    waitDuration: waitDurationMap[backendReport.wait_bucket],
    deviceId: "", // Not needed for frontend display
  };
}

// Convert frontend format to backend format
function convertToBackendFormat(
  clinicId: string,
  waitDuration: "Just arrived / <15 min" | "15–30 min" | "30+ min"
): { clinic_id: string; wait_bucket: "<15" | "15-30" | "30+" } {
  const waitBucketMap: Record<string, "<15" | "15-30" | "30+"> = {
    "Just arrived / <15 min": "<15",
    "15–30 min": "15-30",
    "30+ min": "30+",
  };

  return {
    clinic_id: clinicId,
    wait_bucket: waitBucketMap[waitDuration],
  };
}

/**
 * Fetch reports from backend API
 */
export async function getRecentReports(clinicId: string): Promise<Report[]> {
  try {
    // Add cache-busting timestamp to ensure fresh data
    const response = await fetch(`/api/reports?clinic_id=${encodeURIComponent(clinicId)}&t=${Date.now()}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      console.error("Failed to fetch reports:", response.status, response.statusText);
      return [];
    }
    
    const data = await response.json();
    const convertedReports = data.reports.map(convertBackendReport);
    console.log(`Fetched ${convertedReports.length} reports for clinic ${clinicId}`);
    return convertedReports;
  } catch (error) {
    console.error("Error fetching reports:", error);
    return [];
  }
}

/**
 * Fetch reports for all clinics in parallel
 */
export async function getAllClinicsReports(clinicIds: string[]): Promise<Map<string, Report[]>> {
  const reportsMap = new Map<string, Report[]>();

  // Initialize map so callers always get an entry for each clinic ID
  clinicIds.forEach((id) => reportsMap.set(id, []));

  try {
    // Add cache-busting timestamp to ensure fresh data
    const response = await fetch(`/api/reports/summary?t=${Date.now()}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      console.error(
        "Failed to fetch reports summary:",
        response.status,
        response.statusText
      );
      return reportsMap;
    }

    const data = await response.json();
    const summaries: Record<string, BackendReport[]> = data.summaries || {};

    Object.entries(summaries).forEach(([clinicId, backendReports]) => {
      if (!clinicIds.includes(clinicId)) return;
      const converted = backendReports.map(convertBackendReport);
      reportsMap.set(clinicId, converted);
    });
  } catch (error) {
    console.error("Error fetching all clinics reports:", error);
  }

  return reportsMap;
}

/**
 * Calculate count of clinics with reports updated in last hour
 */
export function getClinicsUpdatedInLastHour(reportsMap: Map<string, Report[]>): number {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  let count = 0;
  
  for (const reports of reportsMap.values()) {
    const hasRecentReport = reports.some((r) => now - r.timestamp < oneHour);
    if (hasRecentReport) {
      count++;
    }
  }
  
  return count;
}

/**
 * Format timestamp to "X mins ago", "1 hour ago", etc.
 */
export function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  
  if (diffMins < 1) {
    return "just now";
  } else if (diffMins < 60) {
    return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`;
  } else if (diffHours === 1) {
    return "1 hour ago";
  } else if (diffHours < 24) {
    return `${diffHours} hours ago`;
  } else {
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  }
}

/**
 * Get confidence level based on report count and recency
 */
export function getConfidenceLevel(reportCount: number, minutesAgo: number): {
  level: "High confidence" | "Medium confidence" | "Low confidence" | "Not reliable";
  isReliable: boolean;
} {
  if (reportCount === 0) {
    return { level: "Not reliable", isReliable: false };
  }
  
  if (reportCount === 1) {
    return { level: "Not reliable", isReliable: false };
  }
  
  if (minutesAgo > 60) {
    return { level: "Not reliable", isReliable: false };
  }
  
  if (reportCount >= 5 && minutesAgo <= 30) {
    return { level: "High confidence", isReliable: true };
  }
  
  if (reportCount >= 3 && minutesAgo <= 45) {
    return { level: "Medium confidence", isReliable: true };
  }
  
  return { level: "Low confidence", isReliable: true };
}

/**
 * Check if user has reported recently (rate limiting using localStorage)
 */
export function hasRecentReport(clinicId: string): boolean {
  if (typeof window === "undefined") return false;
  
  const lastReportKey = `${LAST_REPORT_KEY_PREFIX}${clinicId}`;
  const lastReportTime = localStorage.getItem(lastReportKey);
  
  if (!lastReportTime) return false;
  
  const now = Date.now();
  const sixtyMinutes = 60 * 60 * 1000;
  const timeSinceLastReport = now - parseInt(lastReportTime, 10);
  
  return timeSinceLastReport < sixtyMinutes;
}

/**
 * SINGLE FUNCTION FOR CREATING REPORTS
 * 
 * This is the ONLY function that creates or modifies reports.
 * Reports can ONLY be created after Step 2 completion (duration selection).
 * No other UI interaction may create or modify reports.
 */
export async function addReport(
  report: Omit<Report, "deviceId" | "timestamp">
): Promise<boolean> {
  // Rate limiting check using localStorage
  if (hasRecentReport(report.clinicId)) {
    console.log("Rate limited: already reported recently");
    return false; // Already reported recently
  }

  if (!report.waitDuration) {
    console.log("Missing wait duration");
    return false; // Must have wait duration (Step 2 completion)
  }

  try {
    const backendFormat = convertToBackendFormat(report.clinicId, report.waitDuration);
    console.log("Submitting report:", backendFormat);
    
    const response = await fetch("/api/reports", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backendFormat),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Failed to create report:", response.status, errorData);
      return false;
    }

    const result = await response.json();
    console.log("Report created successfully:", result);

    // Update localStorage for rate limiting
    if (typeof window !== "undefined") {
      const lastReportKey = `${LAST_REPORT_KEY_PREFIX}${report.clinicId}`;
      localStorage.setItem(lastReportKey, Date.now().toString());
    }

    return true;
  } catch (error) {
    console.error("Error creating report:", error);
    return false;
  }
}
