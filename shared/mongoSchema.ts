import mongoose, { Schema, Document } from 'mongoose';
import { z } from 'zod';

// User Schema
export interface IUser extends Document {
  username: string;
  password: string;
  email: string;
  fullName: string;
  studentId?: string;
  faculty?: string;
  major?: string;
  role: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  studentId: { type: String },
  faculty: { type: String },
  major: { type: String },
  role: { type: String, default: 'user', required: true },
  createdAt: { type: Date, default: Date.now, required: true }
});

// Announcement Schema
export interface IAnnouncement extends Document {
  title: string;
  content: string;
  category: string;
  createdAt: Date;
  createdBy: number;
  isPublished: boolean;
}

const announcementSchema = new Schema<IAnnouncement>({
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, required: true },
  createdBy: { type: Number, required: true },
  isPublished: { type: Boolean, default: true, required: true }
});

// Event Schema
export interface IEvent extends Document {
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
  capacity?: number;
  registrationDeadline?: Date;
  createdAt: Date;
  createdBy: number;
  isPublished: boolean;
  formTemplate?: object;
  imageUrl?: string;
}

const eventSchema = new Schema<IEvent>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  capacity: { type: Number },
  registrationDeadline: { type: Date },
  createdAt: { type: Date, default: Date.now, required: true },
  createdBy: { type: Number, required: true },
  isPublished: { type: Boolean, default: true, required: true },
  formTemplate: { type: Schema.Types.Mixed },
  imageUrl: { type: String }
});

// Event Registration Schema
export interface IEventRegistration extends Document {
  eventId: number;
  userId: number;
  registeredAt: Date;
  formData?: object;
  status: string;
}

const eventRegistrationSchema = new Schema<IEventRegistration>({
  eventId: { type: Number, required: true },
  userId: { type: Number, required: true },
  registeredAt: { type: Date, default: Date.now, required: true },
  formData: { type: Schema.Types.Mixed },
  status: { type: String, default: 'pending', required: true }
});

// Tournament Schema
export interface ITournament extends Document {
  name: string;
  description: string;
  sportType: string;
  startDate: Date;
  endDate: Date;
  registrationDeadline: Date;
  format: string;
  createdAt: Date;
  createdBy: number;
  isPublished: boolean;
  status: string;
  maxTeams?: number;
  imageUrl?: string;
  formId?: number;
}

const tournamentSchema = new Schema<ITournament>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  sportType: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  registrationDeadline: { type: Date, required: true },
  format: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, required: true },
  createdBy: { type: Number, required: true },
  isPublished: { type: Boolean, default: true, required: true },
  status: { type: String, default: 'upcoming', required: true },
  maxTeams: { type: Number },
  imageUrl: { type: String },
  formId: { type: Number }
});

// Team Schema
export interface ITeam extends Document {
  name: string;
  tournamentId: number;
  captainId: number;
  createdAt: Date;
}

const teamSchema = new Schema<ITeam>({
  name: { type: String, required: true },
  tournamentId: { type: Number, required: true },
  captainId: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now, required: true }
});

// Team Member Schema
export interface ITeamMember extends Document {
  teamId: number;
  userId: number;
  joinedAt: Date;
}

const teamMemberSchema = new Schema<ITeamMember>({
  teamId: { type: Number, required: true },
  userId: { type: Number, required: true },
  joinedAt: { type: Date, default: Date.now, required: true }
});

// Match Schema
export interface IMatch extends Document {
  tournamentId: number;
  round: number;
  matchNumber: number;
  team1Id?: number;
  team2Id?: number;
  team1Score?: number;
  team2Score?: number;
  winnerId?: number;
  startTime?: Date;
  location?: string;
  status: string;
}

const matchSchema = new Schema<IMatch>({
  tournamentId: { type: Number, required: true },
  round: { type: Number, required: true },
  matchNumber: { type: Number, required: true },
  team1Id: { type: Number },
  team2Id: { type: Number },
  team1Score: { type: Number },
  team2Score: { type: Number },
  winnerId: { type: Number },
  startTime: { type: Date },
  location: { type: String },
  status: { type: String, default: 'scheduled', required: true }
});

// Standing Schema
export interface IStanding extends Document {
  tournamentId: number;
  teamId: number;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  goalsFor?: number;
  goalsAgainst?: number;
  rank?: number;
}

const standingSchema = new Schema<IStanding>({
  tournamentId: { type: Number, required: true },
  teamId: { type: Number, required: true },
  wins: { type: Number, default: 0, required: true },
  losses: { type: Number, default: 0, required: true },
  draws: { type: Number, default: 0, required: true },
  points: { type: Number, default: 0, required: true },
  goalsFor: { type: Number, default: 0 },
  goalsAgainst: { type: Number, default: 0 },
  rank: { type: Number }
});

// Custom Form Schema
export interface ICustomForm extends Document {
  name: string;
  fields: object;
  createdBy: number;
  createdAt: Date;
}

const customFormSchema = new Schema<ICustomForm>({
  name: { type: String, required: true },
  fields: { type: Schema.Types.Mixed, required: true },
  createdBy: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now, required: true }
});

// Zod Validation Schemas
export const insertUserSchema = z.object({
  username: z.string(),
  password: z.string(),
  email: z.string().email(),
  fullName: z.string(),
  studentId: z.string().optional(),
  faculty: z.string().optional(),
  major: z.string().optional(),
  role: z.string().optional(),
});

export const insertAnnouncementSchema = z.object({
  title: z.string(),
  content: z.string(),
  category: z.string(),
  createdBy: z.number(),
  isPublished: z.boolean().optional(),
});

export const insertEventSchema = z.object({
  title: z.string(),
  description: z.string(),
  location: z.string(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  capacity: z.number().optional(),
  registrationDeadline: z.coerce.date().optional(),
  createdBy: z.number(),
  isPublished: z.boolean().optional(),
  formTemplate: z.any().optional(),
  imageUrl: z.string().optional(),
});

export const insertEventRegistrationSchema = z.object({
  eventId: z.number(),
  userId: z.number(),
  formData: z.any().optional(),
  status: z.string().optional(),
});

export const insertTournamentSchema = z.object({
  name: z.string(),
  description: z.string(),
  sportType: z.string(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  registrationDeadline: z.coerce.date(),
  format: z.string(),
  createdBy: z.number(),
  isPublished: z.boolean().optional(),
  status: z.string().optional(),
  maxTeams: z.number().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  formId: z.number().optional(),
});

export const insertTeamSchema = z.object({
  name: z.string(),
  tournamentId: z.number(),
  captainId: z.number(),
});

export const insertTeamMemberSchema = z.object({
  teamId: z.number(),
  userId: z.number(),
});

export const insertMatchSchema = z.object({
  tournamentId: z.number(),
  round: z.number(),
  matchNumber: z.number(),
  team1Id: z.number().optional(),
  team2Id: z.number().optional(),
  team1Score: z.number().optional(),
  team2Score: z.number().optional(),
  winnerId: z.number().optional(),
  startTime: z.coerce.date().optional(),
  location: z.string().optional(),
  status: z.string().optional(),
});

export const insertStandingSchema = z.object({
  tournamentId: z.number(),
  teamId: z.number(),
  wins: z.number().optional(),
  losses: z.number().optional(),
  draws: z.number().optional(),
  points: z.number().optional(),
  goalsFor: z.number().optional(),
  goalsAgainst: z.number().optional(),
  rank: z.number().optional(),
});

export const insertCustomFormSchema = z.object({
  name: z.string(),
  fields: z.any(),
  createdBy: z.number(),
});

// Create and export Mongoose models
export const User = mongoose.model<IUser>('User', userSchema);
export const Announcement = mongoose.model<IAnnouncement>('Announcement', announcementSchema);
export const Event = mongoose.model<IEvent>('Event', eventSchema);
export const EventRegistration = mongoose.model<IEventRegistration>('EventRegistration', eventRegistrationSchema);
export const Tournament = mongoose.model<ITournament>('Tournament', tournamentSchema);
export const Team = mongoose.model<ITeam>('Team', teamSchema);
export const TeamMember = mongoose.model<ITeamMember>('TeamMember', teamMemberSchema);
export const Match = mongoose.model<IMatch>('Match', matchSchema);
export const Standing = mongoose.model<IStanding>('Standing', standingSchema);
export const CustomForm = mongoose.model<ICustomForm>('CustomForm', customFormSchema);

// Export types for use in the application
export type User = IUser;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Announcement = IAnnouncement;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;

export type Event = IEvent;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type EventRegistration = IEventRegistration;
export type InsertEventRegistration = z.infer<typeof insertEventRegistrationSchema>;

export type Tournament = ITournament;
export type InsertTournament = z.infer<typeof insertTournamentSchema>;

export type Team = ITeam;
export type InsertTeam = z.infer<typeof insertTeamSchema>;

export type TeamMember = ITeamMember;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;

export type Match = IMatch;
export type InsertMatch = z.infer<typeof insertMatchSchema>;

export type Standing = IStanding;
export type InsertStanding = z.infer<typeof insertStandingSchema>;

export type CustomForm = ICustomForm;
export type InsertCustomForm = z.infer<typeof insertCustomFormSchema>;