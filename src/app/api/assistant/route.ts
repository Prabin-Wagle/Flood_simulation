import { NextResponse } from 'next/server';
import { simulate, validParams } from '@/lib/simulation';
export async function POST(request: Request) {
  try {
    const {parameters, question} = await request.json();
    if (!validParams(parameters) || typeof question !== 'string' || question.length > 2000) return NextResponse.json({error:'Invalid briefing request.'},{status:400});
    const result = simulate(parameters);
    const ordered = [...result.settlements].sort((a,b)=>a.arrival-b.arrival);
    const infrastructure = /road|hospital|school|bridge|infrastructure/i.test(question);
    const text = infrastructure
      ? `Prioritize checks on the river crossings and critical facilities near ${ordered[0].name} and ${ordered[1].name}. The illustrative inventory includes ${ordered.reduce((a,s)=>a+s.facilities,0)} critical facilities across the four settlements. Do not route people across flood-exposed bridges; have local responders verify uphill routes and receiving sites before use.`
      : `Evacuate ${ordered[0].name} first: its ${ordered[0].population.toLocaleString()} residents have only about ${ordered[0].arrival} minutes before modeled arrival, with a potential depth of ${ordered[0].depth} m. Next prioritize ${ordered[1].name} (${ordered[1].arrival} min; ${ordered[1].population.toLocaleString()} residents), then ${ordered[2].name} (${ordered[2].arrival} min). Start warnings across the entire downstream corridor now, giving extra support to schools, health facilities, and people with limited mobility.`;
    return NextResponse.json({answer:text, disclaimer:'Model-based guidance, not a live AI forecast. Settlements, exposure data, and source geometry are illustrative. Confirm decisions with Nepal DHM and local emergency authorities.'});
  } catch { return NextResponse.json({error:'Unable to generate briefing.'},{status:500}); }
}
