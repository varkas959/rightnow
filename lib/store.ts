"use client";

import { Report } from "./data";

const STORAGE_KEY = "rightnow_reports";
const DEVICE_ID_KEY = "rightnow_device_id";

function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

function getReports(): Report[] {
  if (typeof window === "undefined") return [];
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveReports(reports: Report[]): void {
  if (typeof window === "undefined") return;
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

/**
 * SINGLE FUNCTION FOR CREATING REPORTS
 * 
 * This is the ONLY function that creates or modifies reports.
 * Reports can ONLY be created after Step 2 completion (duration selection).
 * No other UI interaction may create or modify reports.
 */
export function addReport(report: Omit<Report, "deviceId" | "timestamp">): boolean {
  const deviceId = getDeviceId();
  const reports = getReports();
  const now = Date.now();
  
  // Check if user already reported for this clinic in the last 60 minutes
  const recentReport = reports.find(
    (r) =>
      r.clinicId === report.clinicId &&
      r.deviceId === deviceId &&
      now - r.timestamp < 60 * 60 * 1000
  );
  
  if (recentReport) {
    return false; // Already reported recently
  }
  
  const newReport: Report = {
    ...report,
    deviceId,
    timestamp: now,
  };
  
  reports.push(newReport);
  saveReports(reports);
  return true;
}

export function getRecentReports(clinicId: string): Report[] {
  const reports = getReports();
  const now = Date.now();
  const ninetyMinutes = 90 * 60 * 1000;
  
  return reports.filter(
    (r) => r.clinicId === clinicId && now - r.timestamp < ninetyMinutes
  );
}

export function hasRecentReport(clinicId: string): boolean {
  const deviceId = getDeviceId();
  const reports = getReports();
  const now = Date.now();
  const sixtyMinutes = 60 * 60 * 1000;
  
  return reports.some(
    (r) =>
      r.clinicId === clinicId &&
      r.deviceId === deviceId &&
      now - r.timestamp < sixtyMinutes
  );
}

