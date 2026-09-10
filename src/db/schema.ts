import { pgTable, serial, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import type { ScenarioParams, SimulationResult } from '@/lib/simulation';
export const scenarios = pgTable('flood_scenarios', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  parameters: jsonb('parameters').$type<ScenarioParams>().notNull(),
  result: jsonb('result').$type<SimulationResult>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
