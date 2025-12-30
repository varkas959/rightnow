import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Database interface matching Supabase schema
interface Report {
  id: string;
  clinic_id: string;
  wait_bucket: "<15" | "15-30" | "30+";
  created_at: string; // ISO timestamp from Supabase
}

// GET /api/reports?clinic_id=xxx
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const clinicId = searchParams.get("clinic_id");

  if (!clinicId) {
    return NextResponse.json({ error: "clinic_id is required" }, { status: 400 });
  }

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // Calculate timestamp 90 minutes ago
    const ninetyMinutesAgo = new Date(Date.now() - 90 * 60 * 1000).toISOString();

    // Query Supabase for reports within last 90 minutes
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('clinic_id', clinicId)
      .gte('created_at', ninetyMinutesAgo)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API] Supabase error:', error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Convert timestamps to numbers for frontend compatibility
    const reports = (data || []).map((r) => ({
      id: r.id,
      clinic_id: r.clinic_id,
      wait_bucket: r.wait_bucket as "<15" | "15-30" | "30+",
      created_at: new Date(r.created_at).getTime(),
    }));

    console.log(`[API] GET reports for clinic ${clinicId}: ${reports.length} recent reports`);

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('[API] Error fetching reports:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/reports
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clinic_id, wait_bucket } = body;

    if (!clinic_id || !wait_bucket) {
      return NextResponse.json(
        { error: "clinic_id and wait_bucket are required" },
        { status: 400 }
      );
    }

    if (!["<15", "15-30", "30+"].includes(wait_bucket)) {
      return NextResponse.json(
        { error: "Invalid wait_bucket" },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // Insert into Supabase
    const { data, error } = await supabase
      .from('reports')
      .insert({
        clinic_id,
        wait_bucket: wait_bucket as "<15" | "15-30" | "30+",
      })
      .select()
      .single();

    if (error) {
      console.error('[API] Supabase insert error:', error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Convert timestamp to number for frontend compatibility
    const newReport = {
      id: data.id,
      clinic_id: data.clinic_id,
      wait_bucket: data.wait_bucket as "<15" | "15-30" | "30+",
      created_at: new Date(data.created_at).getTime(),
    };

    console.log(`[API] Created report for clinic ${clinic_id}, id: ${data.id}`);

    return NextResponse.json({ report: newReport }, { status: 201 });
  } catch (error) {
    console.error('[API] Error creating report:', error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

