import { NextResponse } from 'next/server';
import { db } from '@/db';
import { scenarios } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { simulate, validParams } from '@/lib/simulation';
export async function GET() {
  try { return NextResponse.json(await db.select().from(scenarios).orderBy(desc(scenarios.createdAt)).limit(30)); }
  catch { return NextResponse.json({error:'Unable to load scenario history.'},{status:500}); }
}
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!validParams(body.parameters)) return NextResponse.json({error:'Please use valid scenario parameters.'},{status:400});
    const result = simulate(body.parameters);
    const [record] = await db.insert(scenarios).values({name: `${body.parameters.river} · breach scenario`,parameters:body.parameters,result}).returning();
    return NextResponse.json(record);
  } catch { return NextResponse.json({error:'Could not save this simulation. Please try again.'},{status:500}); }
}
