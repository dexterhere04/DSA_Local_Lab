import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const problems = sqliteTable("problems", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  sourceType: text("source_type", {
    enum: ["ai_generated", "custom"]
  }).notNull(),
  sourceInput: text("source_input").notNull(),
  statement: text("statement").notNull(),
  constraints: text("constraints", { mode: "json" }).notNull(),
  examples: text("examples", { mode: "json" }).notNull(),
  edgeCases: text("edge_cases", { mode: "json" }).notNull(),
  hints: text("hints", { mode: "json" }).notNull(),
  functionSignature: text("function_signature").notNull(),
  starterCode: text("starter_code").notNull(),
  expectedComplexity: text("expected_complexity").notNull(),
  difficulty: text("difficulty", {
    enum: ["easy", "medium", "hard"]
  }).notNull(),
  tags: text("tags", { mode: "json" }).notNull(),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP")
});

export const testCases = sqliteTable("test_cases", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  problemId: integer("problem_id").notNull().references(() => problems.id, { onDelete: "cascade" }),
  input: text("input").notNull(),
  expectedOutput: text("expected_output").notNull(),
  explanation: text("explanation"),
  isHidden: integer("is_hidden", { mode: "boolean" }).notNull().default(false),
  weight: integer("weight").notNull().default(1)
});

export const submissions = sqliteTable("submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  problemId: integer("problem_id").notNull().references(() => problems.id, { onDelete: "cascade" }),
  language: text("language").notNull().default("java"),
  code: text("code").notNull(),
  mode: text("mode", { enum: ["run", "submit"] }).notNull(),
  status: text("status").notNull(),
  passedCount: integer("passed_count").notNull().default(0),
  totalCount: integer("total_count").notNull().default(0),
  runtimeMs: integer("runtime_ms"),
  memoryKb: integer("memory_kb"),
  resultDetails: text("result_details", { mode: "json" }).notNull(),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP")
});

export const problemSets = sqliteTable("problem_sets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP")
});

export const problemSetItems = sqliteTable("problem_set_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  problemSetId: integer("problem_set_id").notNull().references(() => problemSets.id, { onDelete: "cascade" }),
  problemId: integer("problem_id").notNull().references(() => problems.id, { onDelete: "cascade" })
});

export const problemsRelations = relations(problems, ({ many }) => ({
  testCases: many(testCases),
  submissions: many(submissions),
  setItems: many(problemSetItems)
}));
