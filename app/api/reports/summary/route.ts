import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// Force dynamic rendering so we don't get cached data for live status
export const dynamic = "force-dynamic";

// Shape matches BackendReport in lib/data.ts
interface BackendReportRow {
  id: string;
  clinic_id: string;
  wait_bucket: "<15" | "15-30" | "30+";
  created_at: string;
}

export async function GET(_request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const ninetyMinutesAgo = new Date(
      Date.now() - 90 * 60 * 1000
    ).toISOString();

    // Fetch all reports for the last 90 minutes across clinics
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .gte("created_at", ninetyMinutesAgo)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[API] Supabase summary error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const summaries: Record<string, BackendReportRow[]> = {};

    (data || []).forEach((row: BackendReportRow) => {
      if (!summaries[row.clinic_id]) {
        summaries[row.clinic_id] = [];
      }
      summaries[row.clinic_id].push(row);
    });

    // Convert created_at to numeric timestamp on the wire for consistency
    const normalizedSummaries: Record<
      string,
      { id: string; clinic_id: string; wait_bucket: "<15" | "15-30" | "30+"; created_at: number }[]
    > = {};

    Object.entries(summaries).forEach(([clinicId, reports]) => {
      normalizedSummaries[clinicId] = reports.map((r) => ({
        id: r.id,
        clinic_id: r.clinic_id,
        wait_bucket: r.wait_bucket,
        created_at: new Date(r.created_at).getTime(),
      }));
    });

    console.log(
      `[API] GET reports summary: ${Object.keys(normalizedSummaries).length} clinics`
    );

    return NextResponse.json({ summaries: normalizedSummaries });
  } catch (error) {
    console.error("[API] Error fetching reports summary:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

