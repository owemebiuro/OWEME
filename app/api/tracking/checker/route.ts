import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({
  flightNumber: z.string().min(1).max(20),
  date: z.coerce.date().optional(),
  result: z.enum(["eligible", "not_eligible", "not_found"]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ??
      req.headers.get("x-real-ip") ??
      null;

    await prisma.checkerEvent.create({
      data: {
        flightNumber: parsed.data.flightNumber,
        flightDate: parsed.data.date ?? null,
        result: parsed.data.result,
        ip,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
