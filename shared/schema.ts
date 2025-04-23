import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  studentId: text("student_id"),
  faculty: text("faculty"),
  major: text("major"),
  role: text("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  studentId: true,
  faculty: true,
  major: true,
  role: true,
});

// Announcements Table
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").notNull(),
  isPublished: boolean("is_published").default(true).notNull(),
});

export const insertAnnouncementSchema = createInsertSchema(announcements).pick({
  title: true,
  content: true,
  category: true,
  createdBy: true,
  isPublished: true,
});

// Events Table
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  capacity: integer("capacity"),
  registrationDeadline: timestamp("registration_deadline"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").notNull(),
  isPublished: boolean("is_published").default(true).notNull(),
  formTemplate: jsonb("form_template"), // Form fields configuration
  imageUrl: text("image_url"),
});

export const insertEventSchema = createInsertSchema(events).pick({
  title: true,
  description: true,
  location: true,
  startDate: true,
  endDate: true,
  capacity: true,
  registrationDeadline: true,
  createdBy: true,
  isPublished: true,
  formTemplate: true,
  imageUrl: true,
});

// Event Registrations Table
export const eventRegistrations = pgTable("event_registrations", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  userId: integer("user_id").notNull(),
  registeredAt: timestamp("registered_at").defaultNow().notNull(),
  formData: jsonb("form_data"), // User responses to the form
  status: text("status").default("pending").notNull(), // pending, approved, rejected
});

export const insertEventRegistrationSchema = createInsertSchema(eventRegistrations).pick({
  eventId: true,
  userId: true,
  formData: true,
  status: true,
});

// Tournaments Table
export const tournaments = pgTable("tournaments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  sportType: text("sport_type").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  registrationDeadline: timestamp("registration_deadline").notNull(),
  format: text("format").notNull(), // knockout, round-robin, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").notNull(),
  isPublished: boolean("is_published").default(true).notNull(),
  status: text("status").default("upcoming").notNull(), // upcoming, ongoing, completed
  maxTeams: integer("max_teams"),
  imageUrl: text("image_url"),
  formId: integer("form_id"), // Reference to custom form for team registration
});

export const insertTournamentSchema = createInsertSchema(tournaments).pick({
  name: true,
  description: true,
  sportType: true,
  startDate: true,
  endDate: true,
  registrationDeadline: true,
  format: true,
  createdBy: true,
  isPublished: true,
  status: true,
  maxTeams: true,
  imageUrl: true,
  formId: true,
});

// Teams Table
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  tournamentId: integer("tournament_id").notNull(),
  captainId: integer("captain_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTeamSchema = createInsertSchema(teams).pick({
  name: true,
  tournamentId: true,
  captainId: true,
});

// Team Members Table
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull(),
  userId: integer("user_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).pick({
  teamId: true,
  userId: true,
});

// Matches Table
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").notNull(),
  round: integer("round").notNull(),
  matchNumber: integer("match_number").notNull(),
  team1Id: integer("team1_id"),
  team2Id: integer("team2_id"),
  team1Score: integer("team1_score"),
  team2Score: integer("team2_score"),
  winnerId: integer("winner_id"),
  startTime: timestamp("start_time"),
  location: text("location"),
  status: text("status").default("scheduled").notNull(), // scheduled, in_progress, completed
});

export const insertMatchSchema = createInsertSchema(matches).pick({
  tournamentId: true,
  round: true,
  matchNumber: true,
  team1Id: true,
  team2Id: true,
  team1Score: true,
  team2Score: true,
  winnerId: true,
  startTime: true,
  location: true,
  status: true,
});

// Tournament Standings Table
export const standings = pgTable("standings", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").notNull(),
  teamId: integer("team_id").notNull(),
  wins: integer("wins").default(0).notNull(),
  losses: integer("losses").default(0).notNull(),
  draws: integer("draws").default(0).notNull(),
  points: integer("points").default(0).notNull(),
  goalsFor: integer("goals_for").default(0),
  goalsAgainst: integer("goals_against").default(0),
  rank: integer("rank"),
});

export const insertStandingSchema = createInsertSchema(standings).pick({
  tournamentId: true,
  teamId: true,
  wins: true,
  losses: true,
  draws: true,
  points: true,
  goalsFor: true,
  goalsAgainst: true,
  rank: true,
});

// Custom Form Definitions
export const customForms = pgTable("custom_forms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  fields: jsonb("fields").notNull(), // JSON schema for form fields
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCustomFormSchema = createInsertSchema(customForms).pick({
  name: true,
  description: true,
  fields: true,
  createdBy: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type EventRegistration = typeof eventRegistrations.$inferSelect;
export type InsertEventRegistration = z.infer<typeof insertEventRegistrationSchema>;

export type Tournament = typeof tournaments.$inferSelect;
export type InsertTournament = z.infer<typeof insertTournamentSchema>;

export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;

export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;

export type Standing = typeof standings.$inferSelect;
export type InsertStanding = z.infer<typeof insertStandingSchema>;

export type CustomForm = typeof customForms.$inferSelect;
export type InsertCustomForm = z.infer<typeof insertCustomFormSchema>;
