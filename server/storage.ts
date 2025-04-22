import {
  users, type User, type InsertUser,
  announcements, type Announcement, type InsertAnnouncement,
  events, type Event, type InsertEvent,
  eventRegistrations, type EventRegistration, type InsertEventRegistration,
  tournaments, type Tournament, type InsertTournament,
  teams, type Team, type InsertTeam,
  teamMembers, type TeamMember, type InsertTeamMember,
  matches, type Match, type InsertMatch,
  standings, type Standing, type InsertStanding,
  customForms, type CustomForm, type InsertCustomForm
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  listUsers(): Promise<User[]>;

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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private announcements: Map<number, Announcement>;
  private events: Map<number, Event>;
  private eventRegistrations: Map<number, EventRegistration>;
  private tournaments: Map<number, Tournament>;
  private teams: Map<number, Team>;
  private teamMembers: Map<number, TeamMember>;
  private matches: Map<number, Match>;
  private standings: Map<number, Standing>;
  private customForms: Map<number, CustomForm>;
  
  private currentIds: {
    users: number;
    announcements: number;
    events: number;
    eventRegistrations: number;
    tournaments: number;
    teams: number;
    teamMembers: number;
    matches: number;
    standings: number;
    customForms: number;
  };

  constructor() {
    this.users = new Map();
    this.announcements = new Map();
    this.events = new Map();
    this.eventRegistrations = new Map();
    this.tournaments = new Map();
    this.teams = new Map();
    this.teamMembers = new Map();
    this.matches = new Map();
    this.standings = new Map();
    this.customForms = new Map();
    
    this.currentIds = {
      users: 1,
      announcements: 1,
      events: 1,
      eventRegistrations: 1,
      tournaments: 1,
      teams: 1,
      teamMembers: 1,
      matches: 1,
      standings: 1,
      customForms: 1
    };

    // Add initial admin user
    this.createUser({
      username: "admin",
      password: "$2b$10$vaVwCommoBbGd2lS2pFVae9JV31dByySVNPYWxXiDuHW6QdlTwaTi", // password: admin
      email: "admin@dtu.edu.vn",
      fullName: "Admin",
      faculty: "Computer Science",
      role: "admin"
    } as InsertUser);
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now, role: insertUser.role || "user" };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Announcements
  async getAnnouncement(id: number): Promise<Announcement | undefined> {
    return this.announcements.get(id);
  }

  async listAnnouncements(limit?: number): Promise<Announcement[]> {
    const announcements = Array.from(this.announcements.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return limit ? announcements.slice(0, limit) : announcements;
  }

  async createAnnouncement(insertAnnouncement: InsertAnnouncement): Promise<Announcement> {
    const id = this.currentIds.announcements++;
    const now = new Date();
    const announcement: Announcement = { ...insertAnnouncement, id, createdAt: now };
    this.announcements.set(id, announcement);
    return announcement;
  }

  async updateAnnouncement(id: number, announcementData: Partial<Announcement>): Promise<Announcement | undefined> {
    const announcement = await this.getAnnouncement(id);
    if (!announcement) return undefined;
    
    const updatedAnnouncement = { ...announcement, ...announcementData };
    this.announcements.set(id, updatedAnnouncement);
    return updatedAnnouncement;
  }

  async deleteAnnouncement(id: number): Promise<boolean> {
    return this.announcements.delete(id);
  }

  // Events
  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async listEvents(limit?: number): Promise<Event[]> {
    const events = Array.from(this.events.values())
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    
    return limit ? events.slice(0, limit) : events;
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = this.currentIds.events++;
    const now = new Date();
    const event: Event = { ...insertEvent, id, createdAt: now };
    this.events.set(id, event);
    return event;
  }

  async updateEvent(id: number, eventData: Partial<Event>): Promise<Event | undefined> {
    const event = await this.getEvent(id);
    if (!event) return undefined;
    
    const updatedEvent = { ...event, ...eventData };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<boolean> {
    return this.events.delete(id);
  }

  // Event Registrations
  async getEventRegistration(id: number): Promise<EventRegistration | undefined> {
    return this.eventRegistrations.get(id);
  }

  async getEventRegistrationByUserAndEvent(userId: number, eventId: number): Promise<EventRegistration | undefined> {
    return Array.from(this.eventRegistrations.values()).find(
      (reg) => reg.userId === userId && reg.eventId === eventId,
    );
  }

  async listEventRegistrations(eventId: number): Promise<EventRegistration[]> {
    return Array.from(this.eventRegistrations.values())
      .filter(reg => reg.eventId === eventId)
      .sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());
  }

  async createEventRegistration(insertRegistration: InsertEventRegistration): Promise<EventRegistration> {
    const id = this.currentIds.eventRegistrations++;
    const now = new Date();
    const registration: EventRegistration = { ...insertRegistration, id, registeredAt: now };
    this.eventRegistrations.set(id, registration);
    return registration;
  }

  async updateEventRegistration(id: number, registrationData: Partial<EventRegistration>): Promise<EventRegistration | undefined> {
    const registration = await this.getEventRegistration(id);
    if (!registration) return undefined;
    
    const updatedRegistration = { ...registration, ...registrationData };
    this.eventRegistrations.set(id, updatedRegistration);
    return updatedRegistration;
  }

  async deleteEventRegistration(id: number): Promise<boolean> {
    return this.eventRegistrations.delete(id);
  }

  // Tournaments
  async getTournament(id: number): Promise<Tournament | undefined> {
    return this.tournaments.get(id);
  }

  async listTournaments(limit?: number): Promise<Tournament[]> {
    const tournaments = Array.from(this.tournaments.values())
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    
    return limit ? tournaments.slice(0, limit) : tournaments;
  }

  async createTournament(insertTournament: InsertTournament): Promise<Tournament> {
    const id = this.currentIds.tournaments++;
    const now = new Date();
    const tournament: Tournament = { ...insertTournament, id, createdAt: now };
    this.tournaments.set(id, tournament);
    return tournament;
  }

  async updateTournament(id: number, tournamentData: Partial<Tournament>): Promise<Tournament | undefined> {
    const tournament = await this.getTournament(id);
    if (!tournament) return undefined;
    
    const updatedTournament = { ...tournament, ...tournamentData };
    this.tournaments.set(id, updatedTournament);
    return updatedTournament;
  }

  async deleteTournament(id: number): Promise<boolean> {
    return this.tournaments.delete(id);
  }

  // Teams
  async getTeam(id: number): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async listTeamsByTournament(tournamentId: number): Promise<Team[]> {
    return Array.from(this.teams.values())
      .filter(team => team.tournamentId === tournamentId);
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const id = this.currentIds.teams++;
    const now = new Date();
    const team: Team = { ...insertTeam, id, createdAt: now };
    this.teams.set(id, team);
    return team;
  }

  async updateTeam(id: number, teamData: Partial<Team>): Promise<Team | undefined> {
    const team = await this.getTeam(id);
    if (!team) return undefined;
    
    const updatedTeam = { ...team, ...teamData };
    this.teams.set(id, updatedTeam);
    return updatedTeam;
  }

  async deleteTeam(id: number): Promise<boolean> {
    return this.teams.delete(id);
  }

  // Team Members
  async getTeamMember(id: number): Promise<TeamMember | undefined> {
    return this.teamMembers.get(id);
  }

  async listTeamMembers(teamId: number): Promise<TeamMember[]> {
    return Array.from(this.teamMembers.values())
      .filter(member => member.teamId === teamId);
  }

  async createTeamMember(insertTeamMember: InsertTeamMember): Promise<TeamMember> {
    const id = this.currentIds.teamMembers++;
    const now = new Date();
    const teamMember: TeamMember = { ...insertTeamMember, id, joinedAt: now };
    this.teamMembers.set(id, teamMember);
    return teamMember;
  }

  async deleteTeamMember(id: number): Promise<boolean> {
    return this.teamMembers.delete(id);
  }

  // Matches
  async getMatch(id: number): Promise<Match | undefined> {
    return this.matches.get(id);
  }

  async listMatchesByTournament(tournamentId: number): Promise<Match[]> {
    return Array.from(this.matches.values())
      .filter(match => match.tournamentId === tournamentId)
      .sort((a, b) => {
        // First by round
        if (a.round !== b.round) return a.round - b.round;
        // Then by match number within the round
        return a.matchNumber - b.matchNumber;
      });
  }

  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const id = this.currentIds.matches++;
    const match: Match = { ...insertMatch, id };
    this.matches.set(id, match);
    return match;
  }

  async updateMatch(id: number, matchData: Partial<Match>): Promise<Match | undefined> {
    const match = await this.getMatch(id);
    if (!match) return undefined;
    
    const updatedMatch = { ...match, ...matchData };
    this.matches.set(id, updatedMatch);
    return updatedMatch;
  }

  async deleteMatch(id: number): Promise<boolean> {
    return this.matches.delete(id);
  }

  // Standings
  async getStanding(id: number): Promise<Standing | undefined> {
    return this.standings.get(id);
  }

  async getStandingByTeamAndTournament(teamId: number, tournamentId: number): Promise<Standing | undefined> {
    return Array.from(this.standings.values()).find(
      (standing) => standing.teamId === teamId && standing.tournamentId === tournamentId,
    );
  }

  async listStandingsByTournament(tournamentId: number): Promise<Standing[]> {
    return Array.from(this.standings.values())
      .filter(standing => standing.tournamentId === tournamentId)
      .sort((a, b) => {
        // Sort by points (descending)
        if (a.points !== b.points) return b.points - a.points;
        // If points are equal, sort by goal difference
        const aGoalDiff = (a.goalsFor || 0) - (a.goalsAgainst || 0);
        const bGoalDiff = (b.goalsFor || 0) - (b.goalsAgainst || 0);
        if (aGoalDiff !== bGoalDiff) return bGoalDiff - aGoalDiff;
        // If goal difference is equal, sort by goals for
        return (b.goalsFor || 0) - (a.goalsFor || 0);
      });
  }

  async createStanding(insertStanding: InsertStanding): Promise<Standing> {
    const id = this.currentIds.standings++;
    const standing: Standing = { ...insertStanding, id };
    this.standings.set(id, standing);
    return standing;
  }

  async updateStanding(id: number, standingData: Partial<Standing>): Promise<Standing | undefined> {
    const standing = await this.getStanding(id);
    if (!standing) return undefined;
    
    const updatedStanding = { ...standing, ...standingData };
    this.standings.set(id, updatedStanding);
    return updatedStanding;
  }

  async deleteStanding(id: number): Promise<boolean> {
    return this.standings.delete(id);
  }

  // Custom Forms
  async getCustomForm(id: number): Promise<CustomForm | undefined> {
    return this.customForms.get(id);
  }

  async listCustomForms(): Promise<CustomForm[]> {
    return Array.from(this.customForms.values());
  }

  async createCustomForm(insertForm: InsertCustomForm): Promise<CustomForm> {
    const id = this.currentIds.customForms++;
    const now = new Date();
    const form: CustomForm = { ...insertForm, id, createdAt: now };
    this.customForms.set(id, form);
    return form;
  }

  async updateCustomForm(id: number, formData: Partial<CustomForm>): Promise<CustomForm | undefined> {
    const form = await this.getCustomForm(id);
    if (!form) return undefined;
    
    const updatedForm = { ...form, ...formData };
    this.customForms.set(id, updatedForm);
    return updatedForm;
  }

  async deleteCustomForm(id: number): Promise<boolean> {
    return this.customForms.delete(id);
  }
}

export const storage = new MemStorage();
