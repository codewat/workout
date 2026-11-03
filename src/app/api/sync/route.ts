import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

// In-memory fallback cache for local dev or when Redis env vars are not yet configured
declare global {
  // eslint-disable-next-line no-var
  var __memorySyncStore: Map<string, { routine: unknown; updatedAt: number }> | undefined;
}

if (!global.__memorySyncStore) {
  global.__memorySyncStore = new Map();
}

function getRedisClient(): Redis | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    return new Redis({ url, token });
  }
  return null;
}

// POST /api/sync -> Save routine with a sync code
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, routine } = body;

    if (!code || typeof code !== "string" || !routine) {
      return NextResponse.json(
        { error: "Invalid sync code or routine data" },
        { status: 400 }
      );
    }

    const normalizedCode = code.trim().toUpperCase();
    const redis = getRedisClient();

    if (redis) {
      // Store in Redis with 180 days expiration
      await redis.set(`workout:${normalizedCode}`, JSON.stringify(routine), {
        ex: 60 * 60 * 24 * 180,
      });
    } else {
      // Fallback to in-memory store
      global.__memorySyncStore?.set(normalizedCode, {
        routine,
        updatedAt: Date.now(),
      });
    }

    return NextResponse.json({
      success: true,
      code: normalizedCode,
      message: "Routine saved successfully under sync code",
      storage: redis ? "cloud-redis" : "memory",
    });
  } catch (error) {
    console.error("Error saving sync routine:", error);
    return NextResponse.json(
      { error: "Failed to save sync routine" },
      { status: 500 }
    );
  }
}

// GET /api/sync?code=... -> Retrieve routine with a sync code
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Sync code parameter is required" },
        { status: 400 }
      );
    }

    const normalizedCode = code.trim().toUpperCase();
    const redis = getRedisClient();

    if (redis) {
      const data = await redis.get(`workout:${normalizedCode}`);
      if (!data) {
        return NextResponse.json(
          { error: `No workout found for code: ${normalizedCode}` },
          { status: 404 }
        );
      }
      const routine = typeof data === "string" ? JSON.parse(data) : data;
      return NextResponse.json({ success: true, code: normalizedCode, routine });
    }

    // In-memory fallback
    const entry = global.__memorySyncStore?.get(normalizedCode);
    if (!entry) {
      return NextResponse.json(
        { error: `No workout found for code: ${normalizedCode}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      code: normalizedCode,
      routine: entry.routine,
    });
  } catch (error) {
    console.error("Error retrieving sync routine:", error);
    return NextResponse.json(
      { error: "Failed to retrieve sync routine" },
      { status: 500 }
    );
  }
}
