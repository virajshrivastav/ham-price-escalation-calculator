import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const indices = sqliteTable('indices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull(),           // 'WPI' | 'CPI-IW'
  year: integer('year').notNull(),
  month: integer('month').notNull(),       // 1-12
  value: real('value').notNull(),
  source: text('source'),                  // 'MoSPI MCP', 'Labour Bureau'
  createdAt: integer('created_at', { mode: 'timestamp' }).default(new Date()),
});

export const contracts = sqliteTable('contracts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  bidDueDate: text('bid_due_date').notNull(),
  baseMonth: text('base_month').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(new Date()),
});

export const calculations = sqliteTable('calculations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  contractId: integer('contract_id').references(() => contracts.id),
  reportDate: text('report_date').notNull(),
  currentMonth: text('current_month').notNull(),
  workDone: real('work_done').notNull(),
  wpiBase: real('wpi_base').notNull(),
  wpiCurrent: real('wpi_current').notNull(),
  cpiBase: real('cpi_base').notNull(),
  cpiCurrent: real('cpi_current').notNull(),
  p0: real('p0').notNull(),
  pc: real('pc').notNull(),
  pim: real('pim').notNull(),
  escalationAmount: real('escalation_amount').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(new Date()),
});

// Type exports
export type Index = typeof indices.$inferSelect;
export type NewIndex = typeof indices.$inferInsert;
export type Contract = typeof contracts.$inferSelect;
export type Calculation = typeof calculations.$inferSelect;
