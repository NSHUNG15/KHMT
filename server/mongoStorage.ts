import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  User, InsertUser,
  Announcement, InsertAnnouncement,
  Event, InsertEvent,
  EventRegistration, InsertEventRegistration,
  Tournament, InsertTournament,
  Team, InsertTeam,
  TeamMember, InsertTeamMember,
  Match, InsertMatch,
  Standing, InsertStanding,
  CustomForm, InsertCustomForm
} from '@shared/mongoSchema';
import { generateCounterId } from './utils/counterUtils';
import session from 'express-session';
import createMemoryStore from 'memorystore';

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;  // Add this for MongoDB ObjectId lookups
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  listUsers(): Promise<User[]>;
  
  // Counters
  getCount(collectionName: string): Promise<number>;

  // Announcements
  getAnnouncement(id: number): Promise<Announcement | undefined>;
  listAnnouncements(limit?: number): Promise<Announcement[]>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: number, announcementData: Partial<Announcement>): Promise<Announcement | undefined>;
  deleteAnnouncement(id: number): Promise<boolean>;

  // Events
  getEvent(id: number): Promise<Event | undefined>;
  listEvents(limit?: number): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, eventData: Partial<Event>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;

  // Event Registrations
  getEventRegistration(id: number): Promise<EventRegistration | undefined>;
  getEventRegistrationByUserAndEvent(userId: number, eventId: number): Promise<EventRegistration | undefined>;
  listEventRegistrations(eventId: number): Promise<EventRegistration[]>;
  createEventRegistration(registration: InsertEventRegistration): Promise<EventRegistration>;
  updateEventRegistration(id: number, registrationData: Partial<EventRegistration>): Promise<EventRegistration | undefined>;
  deleteEventRegistration(id: number): Promise<boolean>;

  // Tournaments
  getTournament(id: number): Promise<Tournament | undefined>;
  listTournaments(limit?: number): Promise<Tournament[]>;
  createTournament(tournament: InsertTournament): Promise<Tournament>;
  updateTournament(id: number, tournamentData: Partial<Tournament>): Promise<Tournament | undefined>;
  deleteTournament(id: number): Promise<boolean>;

  // Teams
  getTeam(id: number): Promise<Team | undefined>;
  listTeamsByTournament(tournamentId: number): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, teamData: Partial<Team>): Promise<Team | undefined>;
  deleteTeam(id: number): Promise<boolean>;

  // Team Members
  getTeamMember(id: number): Promise<TeamMember | undefined>;
  listTeamMembers(teamId: number): Promise<TeamMember[]>;
  createTeamMember(teamMember: InsertTeamMember): Promise<TeamMember>;
  deleteTeamMember(id: number): Promise<boolean>;

  // Matches
  getMatch(id: number): Promise<Match | undefined>;
  listMatchesByTournament(tournamentId: number): Promise<Match[]>;
  createMatch(match: InsertMatch): Promise<Match>;
  updateMatch(id: number, matchData: Partial<Match>): Promise<Match | undefined>;
  deleteMatch(id: number): Promise<boolean>;

  // Standings
  getStanding(id: number): Promise<Standing | undefined>;
  getStandingByTeamAndTournament(teamId: number, tournamentId: number): Promise<Standing | undefined>;
  listStandingsByTournament(tournamentId: number): Promise<Standing[]>;
  createStanding(standing: InsertStanding): Promise<Standing>;
  updateStanding(id: number, standingData: Partial<Standing>): Promise<Standing | undefined>;
  deleteStanding(id: number): Promise<boolean>;

  // Custom Forms
  getCustomForm(id: number): Promise<CustomForm | undefined>;
  listCustomForms(): Promise<CustomForm[]>;
  createCustomForm(form: InsertCustomForm): Promise<CustomForm>;
  updateCustomForm(id: number, formData: Partial<CustomForm>): Promise<CustomForm | undefined>;
  deleteCustomForm(id: number): Promise<boolean>;

  // Session store
  sessionStore: session.Store;
}

export class MongoStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Initialize the Memory Store for sessions
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Prune expired entries every 24h
    });

    // Connect to MongoDB
    this.connectToDatabase();
  }

  async connectToDatabase() {
    try {
      // Create an in-memory MongoDB server
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      
      // Connect to the in-memory server
      await mongoose.connect(uri);
      console.log('Connected to in-memory MongoDB');
    } catch (error) {
      console.error('MongoDB connection error:', error);
    }
  }

  // Counters
  async getCount(collectionName: string): Promise<number> {
    try {
      switch (collectionName) {
        case 'users':
          return await User.countDocuments();
        case 'announcements':
          return await Announcement.countDocuments();
        case 'events':
          return await Event.countDocuments();
        case 'tournaments':
          return await Tournament.countDocuments();
        case 'customForms':
          return await CustomForm.countDocuments();
        default:
          console.log(`Unknown collection name: ${collectionName}`);
          return 0;
      }
    } catch (error) {
      console.error(`Error counting ${collectionName}:`, error);
      return 0;
    }
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const user = await User.findOne({ id });
    return user || undefined;
  }
  
  async getUserById(id: string): Promise<User | undefined> {
    const user = await User.findById(id);
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await User.findOne({ username });
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await User.findOne({ email });
    return user || undefined;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = await generateCounterId('users');
    const user = new User({
      ...userData,
      id,
      role: userData.role || 'user'
    });
    await user.save();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await User.findOneAndUpdate(
      { id },
      { $set: userData },
      { new: true }
    );
    return user || undefined;
  }

  async listUsers(): Promise<User[]> {
    return await User.find();
  }

  // Announcements
  async getAnnouncement(id: number): Promise<Announcement | undefined> {
    const announcement = await Announcement.findOne({ id });
    return announcement || undefined;
  }

  async listAnnouncements(limit?: number): Promise<Announcement[]> {
    const query = Announcement.find().sort({ createdAt: -1 });
    if (limit) {
      query.limit(limit);
    }
    return await query.exec();
  }

  async createAnnouncement(announcementData: InsertAnnouncement): Promise<Announcement> {
    const id = await generateCounterId('announcements');
    const announcement = new Announcement({
      ...announcementData,
      id
    });
    await announcement.save();
    return announcement;
  }

  async updateAnnouncement(id: number, announcementData: Partial<Announcement>): Promise<Announcement | undefined> {
    const announcement = await Announcement.findOneAndUpdate(
      { id },
      { $set: announcementData },
      { new: true }
    );
    return announcement || undefined;
  }

  async deleteAnnouncement(id: number): Promise<boolean> {
    const result = await Announcement.deleteOne({ id });
    return result.deletedCount > 0;
  }

  // Events
  async getEvent(id: number): Promise<Event | undefined> {
    const event = await Event.findOne({ id });
    return event || undefined;
  }

  async listEvents(limit?: number): Promise<Event[]> {
    const query = Event.find().sort({ createdAt: -1 });
    if (limit) {
      query.limit(limit);
    }
    return await query.exec();
  }

  async createEvent(eventData: InsertEvent): Promise<Event> {
    const id = await generateCounterId('events');
    const event = new Event({
      ...eventData,
      id
    });
    await event.save();
    return event;
  }

  async updateEvent(id: number, eventData: Partial<Event>): Promise<Event | undefined> {
    const event = await Event.findOneAndUpdate(
      { id },
      { $set: eventData },
      { new: true }
    );
    return event || undefined;
  }

  async deleteEvent(id: number): Promise<boolean> {
    const result = await Event.deleteOne({ id });
    return result.deletedCount > 0;
  }

  // Event Registrations
  async getEventRegistration(id: number): Promise<EventRegistration | undefined> {
    const registration = await EventRegistration.findOne({ id });
    return registration || undefined;
  }

  async getEventRegistrationByUserAndEvent(userId: number, eventId: number): Promise<EventRegistration | undefined> {
    const registration = await EventRegistration.findOne({ userId, eventId });
    return registration || undefined;
  }

  async listEventRegistrations(eventId: number): Promise<EventRegistration[]> {
    return await EventRegistration.find({ eventId });
  }

  async createEventRegistration(registrationData: InsertEventRegistration): Promise<EventRegistration> {
    const id = await generateCounterId('eventRegistrations');
    const registration = new EventRegistration({
      ...registrationData,
      id
    });
    await registration.save();
    return registration;
  }

  async updateEventRegistration(id: number, registrationData: Partial<EventRegistration>): Promise<EventRegistration | undefined> {
    const registration = await EventRegistration.findOneAndUpdate(
      { id },
      { $set: registrationData },
      { new: true }
    );
    return registration || undefined;
  }

  async deleteEventRegistration(id: number): Promise<boolean> {
    const result = await EventRegistration.deleteOne({ id });
    return result.deletedCount > 0;
  }

  // Tournaments
  async getTournament(id: number): Promise<Tournament | undefined> {
    const tournament = await Tournament.findOne({ id });
    return tournament || undefined;
  }

  async listTournaments(limit?: number): Promise<Tournament[]> {
    const query = Tournament.find().sort({ createdAt: -1 });
    if (limit) {
      query.limit(limit);
    }
    return await query.exec();
  }

  async createTournament(tournamentData: InsertTournament): Promise<Tournament> {
    const id = await generateCounterId('tournaments');
    const tournament = new Tournament({
      ...tournamentData,
      id
    });
    await tournament.save();
    return tournament;
  }

  async updateTournament(id: number, tournamentData: Partial<Tournament>): Promise<Tournament | undefined> {
    const tournament = await Tournament.findOneAndUpdate(
      { id },
      { $set: tournamentData },
      { new: true }
    );
    return tournament || undefined;
  }

  async deleteTournament(id: number): Promise<boolean> {
    const result = await Tournament.deleteOne({ id });
    return result.deletedCount > 0;
  }

  // Teams
  async getTeam(id: number): Promise<Team | undefined> {
    const team = await Team.findOne({ id });
    return team || undefined;
  }

  async listTeamsByTournament(tournamentId: number): Promise<Team[]> {
    return await Team.find({ tournamentId });
  }

  async createTeam(teamData: InsertTeam): Promise<Team> {
    const id = await generateCounterId('teams');
    const team = new Team({
      ...teamData,
      id
    });
    await team.save();
    return team;
  }

  async updateTeam(id: number, teamData: Partial<Team>): Promise<Team | undefined> {
    const team = await Team.findOneAndUpdate(
      { id },
      { $set: teamData },
      { new: true }
    );
    return team || undefined;
  }

  async deleteTeam(id: number): Promise<boolean> {
    const result = await Team.deleteOne({ id });
    return result.deletedCount > 0;
  }

  // Team Members
  async getTeamMember(id: number): Promise<TeamMember | undefined> {
    const teamMember = await TeamMember.findOne({ id });
    return teamMember || undefined;
  }

  async listTeamMembers(teamId: number): Promise<TeamMember[]> {
    return await TeamMember.find({ teamId });
  }

  async createTeamMember(teamMemberData: InsertTeamMember): Promise<TeamMember> {
    const id = await generateCounterId('teamMembers');
    const teamMember = new TeamMember({
      ...teamMemberData,
      id
    });
    await teamMember.save();
    return teamMember;
  }

  async deleteTeamMember(id: number): Promise<boolean> {
    const result = await TeamMember.deleteOne({ id });
    return result.deletedCount > 0;
  }

  // Matches
  async getMatch(id: number): Promise<Match | undefined> {
    const match = await Match.findOne({ id });
    return match || undefined;
  }

  async listMatchesByTournament(tournamentId: number): Promise<Match[]> {
    return await Match.find({ tournamentId }).sort({ round: 1, matchNumber: 1 });
  }

  async createMatch(matchData: InsertMatch): Promise<Match> {
    const id = await generateCounterId('matches');
    const match = new Match({
      ...matchData,
      id
    });
    await match.save();
    return match;
  }

  async updateMatch(id: number, matchData: Partial<Match>): Promise<Match | undefined> {
    const match = await Match.findOneAndUpdate(
      { id },
      { $set: matchData },
      { new: true }
    );
    return match || undefined;
  }

  async deleteMatch(id: number): Promise<boolean> {
    const result = await Match.deleteOne({ id });
    return result.deletedCount > 0;
  }

  // Standings
  async getStanding(id: number): Promise<Standing | undefined> {
    const standing = await Standing.findOne({ id });
    return standing || undefined;
  }

  async getStandingByTeamAndTournament(teamId: number, tournamentId: number): Promise<Standing | undefined> {
    const standing = await Standing.findOne({ teamId, tournamentId });
    return standing || undefined;
  }

  async listStandingsByTournament(tournamentId: number): Promise<Standing[]> {
    return await Standing.find({ tournamentId }).sort({ points: -1, rank: 1 });
  }

  async createStanding(standingData: InsertStanding): Promise<Standing> {
    const id = await generateCounterId('standings');
    const standing = new Standing({
      ...standingData,
      id
    });
    await standing.save();
    return standing;
  }

  async updateStanding(id: number, standingData: Partial<Standing>): Promise<Standing | undefined> {
    const standing = await Standing.findOneAndUpdate(
      { id },
      { $set: standingData },
      { new: true }
    );
    return standing || undefined;
  }

  async deleteStanding(id: number): Promise<boolean> {
    const result = await Standing.deleteOne({ id });
    return result.deletedCount > 0;
  }

  // Custom Forms
  async getCustomForm(id: number): Promise<CustomForm | undefined> {
    const form = await CustomForm.findOne({ id });
    return form || undefined;
  }

  async listCustomForms(): Promise<CustomForm[]> {
    return await CustomForm.find().sort({ createdAt: -1 });
  }

  async createCustomForm(formData: InsertCustomForm): Promise<CustomForm> {
    const id = await generateCounterId('customForms');
    const form = new CustomForm({
      ...formData,
      id
    });
    await form.save();
    return form;
  }

  async updateCustomForm(id: number, formData: Partial<CustomForm>): Promise<CustomForm | undefined> {
    const form = await CustomForm.findOneAndUpdate(
      { id },
      { $set: formData },
      { new: true }
    );
    return form || undefined;
  }

  async deleteCustomForm(id: number): Promise<boolean> {
    const result = await CustomForm.deleteOne({ id });
    return result.deletedCount > 0;
  }
}

export const storage = new MongoStorage();