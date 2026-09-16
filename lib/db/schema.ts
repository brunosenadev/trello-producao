import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const userRoleEnum = pgEnum("user_role", ["CONTRATANTE", "FUNCIONARIO"]);

export const taskFrequencyEnum = pgEnum("task_frequency", [
  "DIARIA",
  "DIAS_SEMANA",
  "DESATIVADA",
]);

export const occurrenceStatusEnum = pgEnum("occurrence_status", [
  "PENDENTE",
  "EM_ANDAMENTO",
  "CONCLUIDA",
  "BLOQUEADA",
]);

export const transactionTypeEnum = pgEnum("transaction_type", [
  "TASK_EARNING",
  "ADVANCE_CREDIT",
  "PAYMENT",
  "ADJUSTMENT",
]);

export const installmentStatusEnum = pgEnum("installment_status", [
  "PLANEJADA",
  "APLICADA",
  "CANCELADA",
]);

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  googleId: text("google_id").notNull().unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  image: text("image"),
  role: userRoleEnum("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  ownedProjects: many(projects, { relationName: "ownerProjects" }),
  assignedProjects: many(projects, { relationName: "assignedProjects" }),
  taskOccurrences: many(taskOccurrences, { relationName: "assignedOccurrences" }),
  financialTransactions: many(financialTransactions, { relationName: "userTransactions" }),
  advances: many(advances, { relationName: "userAdvances" }),
}));

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  ownerUserId: uuid("owner_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  assignedUserId: uuid("assigned_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.ownerUserId],
    references: [users.id],
    relationName: "ownerProjects",
  }),
  assignedUser: one(users, {
    fields: [projects.assignedUserId],
    references: [users.id],
    relationName: "assignedProjects",
  }),
  taskTemplates: many(taskTemplates),
  taskOccurrences: many(taskOccurrences),
}));

// ---------------------------------------------------------------------------
// Task templates (permanent model of a recurring task)
// ---------------------------------------------------------------------------

export const taskTemplates = pgTable("task_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  // Nome do "tipo de demanda" recorrente (ex: "Vídeo") — não confundir com
  // o título de cada vídeo específico, que é preenchido por ocorrência.
  title: text("title").notNull(),
  order: integer("order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  amountCents: integer("amount_cents").notNull().default(5000),
  frequency: taskFrequencyEnum("frequency").notNull().default("DIARIA"),
  // 0 = domingo ... 6 = sábado, usado somente quando frequency = DIAS_SEMANA
  weekDays: integer("week_days").array(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const taskTemplatesRelations = relations(taskTemplates, ({ one, many }) => ({
  project: one(projects, {
    fields: [taskTemplates.projectId],
    references: [projects.id],
  }),
  checklistTemplates: many(taskChecklistTemplates),
  occurrences: many(taskOccurrences),
}));

// ---------------------------------------------------------------------------
// Checklist templates (permanent, belongs to the task template)
// ---------------------------------------------------------------------------

export const taskChecklistTemplates = pgTable("task_checklist_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskTemplateId: uuid("task_template_id")
    .notNull()
    .references(() => taskTemplates.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  order: integer("order").notNull().default(0),
});

export const taskChecklistTemplatesRelations = relations(taskChecklistTemplates, ({ one }) => ({
  taskTemplate: one(taskTemplates, {
    fields: [taskChecklistTemplates.taskTemplateId],
    references: [taskTemplates.id],
  }),
}));

// ---------------------------------------------------------------------------
// Task occurrences (one per template per date — the daily instance)
// ---------------------------------------------------------------------------

export const taskOccurrences = pgTable(
  "task_occurrences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taskTemplateId: uuid("task_template_id")
      .notNull()
      .references(() => taskTemplates.id, { onDelete: "cascade" }),
    // Desnormalizado para permitir consultas "todas as ocorrências do projeto
    // nesta data" sem join no template.
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    occurrenceDate: date("occurrence_date", { mode: "string" }).notNull(),
    status: occurrenceStatusEnum("status").notNull().default("PENDENTE"),
    // Congelado no momento da criação da ocorrência — mudanças no template
    // não afetam ocorrências já geradas.
    amountCents: integer("amount_cents").notNull(),
    // Cada ocorrência é um vídeo diferente — título, instruções e thumbnail
    // são específicos dela, preenchidos depois de criada (não vêm do
    // template, que só define o tipo de demanda recorrente).
    title: text("title"),
    instructions: text("instructions"),
    videoUrl: text("video_url"),
    thumbnailUrl: text("thumbnail_url"),
    assignedUserId: uuid("assigned_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    completedByUserId: uuid("completed_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Regra #21: nunca duas ocorrências do mesmo template no mesmo dia.
    uniqueIndex("task_occurrences_template_date_unique").on(
      table.taskTemplateId,
      table.occurrenceDate,
    ),
    index("task_occurrences_project_date_idx").on(table.projectId, table.occurrenceDate),
  ],
);

export const taskOccurrencesRelations = relations(taskOccurrences, ({ one, many }) => ({
  taskTemplate: one(taskTemplates, {
    fields: [taskOccurrences.taskTemplateId],
    references: [taskTemplates.id],
  }),
  project: one(projects, {
    fields: [taskOccurrences.projectId],
    references: [projects.id],
  }),
  assignedUser: one(users, {
    fields: [taskOccurrences.assignedUserId],
    references: [users.id],
    relationName: "assignedOccurrences",
  }),
  completedByUser: one(users, {
    fields: [taskOccurrences.completedByUserId],
    references: [users.id],
  }),
  checklistItems: many(taskOccurrenceChecklistItems),
  financialTransaction: one(financialTransactions, {
    fields: [taskOccurrences.id],
    references: [financialTransactions.taskOccurrenceId],
  }),
}));

// ---------------------------------------------------------------------------
// Checklist items of a specific occurrence — independent copy, own state
// ---------------------------------------------------------------------------

export const taskOccurrenceChecklistItems = pgTable("task_occurrence_checklist_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskOccurrenceId: uuid("task_occurrence_id")
    .notNull()
    .references(() => taskOccurrences.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  order: integer("order").notNull().default(0),
  isDone: boolean("is_done").notNull().default(false),
  doneAt: timestamp("done_at", { withTimezone: true }),
});

export const taskOccurrenceChecklistItemsRelations = relations(
  taskOccurrenceChecklistItems,
  ({ one }) => ({
    taskOccurrence: one(taskOccurrences, {
      fields: [taskOccurrenceChecklistItems.taskOccurrenceId],
      references: [taskOccurrences.id],
    }),
  }),
);

// ---------------------------------------------------------------------------
// Financial ledger — single source of truth for balances
// ---------------------------------------------------------------------------

export const financialTransactions = pgTable(
  "financial_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // Funcionário a quem esta movimentação se refere.
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: transactionTypeEnum("type").notNull(),
    // Positivo = crédito para o funcionário, negativo = débito.
    amountCents: integer("amount_cents").notNull(),
    description: text("description").notNull(),
    taskOccurrenceId: uuid("task_occurrence_id").references(() => taskOccurrences.id, {
      onDelete: "set null",
    }),
    advanceId: uuid("advance_id").references(() => advances.id, { onDelete: "set null" }),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Regra #2 e #20: uma ocorrência nunca gera duas remunerações.
    uniqueIndex("financial_transactions_task_earning_unique")
      .on(table.taskOccurrenceId)
      .where(sql`${table.type} = 'TASK_EARNING'`),
    index("financial_transactions_user_idx").on(table.userId, table.createdAt),
  ],
);

export const financialTransactionsRelations = relations(financialTransactions, ({ one }) => ({
  user: one(users, {
    fields: [financialTransactions.userId],
    references: [users.id],
    relationName: "userTransactions",
  }),
  taskOccurrence: one(taskOccurrences, {
    fields: [financialTransactions.taskOccurrenceId],
    references: [taskOccurrences.id],
  }),
  advance: one(advances, {
    fields: [financialTransactions.advanceId],
    references: [advances.id],
  }),
  createdByUser: one(users, {
    fields: [financialTransactions.createdByUserId],
    references: [users.id],
  }),
}));

// ---------------------------------------------------------------------------
// Advances (adiantamentos) and their planned installments
// ---------------------------------------------------------------------------

export const advances = pgTable("advances", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  totalAmountCents: integer("total_amount_cents").notNull(),
  description: text("description"),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const advancesRelations = relations(advances, ({ one, many }) => ({
  user: one(users, {
    fields: [advances.userId],
    references: [users.id],
    relationName: "userAdvances",
  }),
  createdByUser: one(users, {
    fields: [advances.createdByUserId],
    references: [users.id],
  }),
  installments: many(advanceInstallments),
  transactions: many(financialTransactions),
}));

export const advanceInstallments = pgTable("advance_installments", {
  id: uuid("id").defaultRandom().primaryKey(),
  advanceId: uuid("advance_id")
    .notNull()
    .references(() => advances.id, { onDelete: "cascade" }),
  // Sempre o dia 1 do mês de referência, ex: 2026-10-01.
  referenceMonth: date("reference_month", { mode: "string" }).notNull(),
  amountCents: integer("amount_cents").notNull(),
  status: installmentStatusEnum("status").notNull().default("PLANEJADA"),
  dueDate: date("due_date", { mode: "string" }),
  paidDate: date("paid_date", { mode: "string" }),
  note: text("note"),
});

export const advanceInstallmentsRelations = relations(advanceInstallments, ({ one }) => ({
  advance: one(advances, {
    fields: [advanceInstallments.advanceId],
    references: [advances.id],
  }),
}));
