import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { ZodError } from "zod";
import { 
  insertUserSchema, 
  insertAnnouncementSchema, 
  insertEventSchema, 
  insertEventRegistrationSchema, 
  insertTournamentSchema, 
  insertTeamSchema, 
  insertTeamMemberSchema, 
  insertMatchSchema, 
  insertStandingSchema, 
  insertCustomFormSchema 
} from "@shared/schema";
import bcrypt from "bcrypt";
import session from "express-session";
import createMemoryStore from "memorystore";
import { exportToExcel } from "./utils/excelExport";
import { generateTournamentBrackets } from "./utils/tournamentBracket";

const MemoryStore = createMemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === "production", maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
      store: new MemoryStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
    })
  );

  // Middleware to handle errors
  app.use((err: Error, req: Request, res: Response, next: any) => {
    console.error(err.stack);
    if (err instanceof ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: err.errors 
      });
    }
    res.status(500).json({ message: "Internal server error" });
  });

  // Helper to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: any) => {
    if (req.session && req.session.userId) {
      return next();
    }
    res.status(401).json({ message: "Authentication required" });
  };

  // Helper to check if user is admin
  const isAdmin = async (req: Request, res: Response, next: any) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    next();
  };

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Create user with hashed password
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Error creating user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set user session
      req.session.userId = user.id;

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error during login" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Error during logout" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving user" });
    }
  });

  // User routes
  app.get("/api/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.listUsers();
      // Remove passwords before sending the data
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.status(200).json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving users" });
    }
  });

  app.get("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      
      // Check if the user is requesting their own profile or is an admin
      if (req.session.userId !== id) {
        const currentUser = await storage.getUser(req.session.userId);
        if (!currentUser || currentUser.role !== "admin") {
          return res.status(403).json({ message: "Unauthorized access" });
        }
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving user" });
    }
  });

  app.put("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      
      // Check if the user is updating their own profile or is an admin
      if (req.session.userId !== id) {
        const currentUser = await storage.getUser(req.session.userId);
        if (!currentUser || currentUser.role !== "admin") {
          return res.status(403).json({ message: "Unauthorized access" });
        }
      }

      // Get the current user to ensure they exist
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updateData = { ...req.body };
      
      // If updating password, hash it
      if (updateData.password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(updateData.password, salt);
      }

      // Only admins can update role
      if (updateData.role && req.session.userId !== id) {
        const currentUser = await storage.getUser(req.session.userId);
        if (!currentUser || currentUser.role !== "admin") {
          delete updateData.role;
        }
      }

      const updatedUser = await storage.updateUser(id, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return user without password
      const { password, ...userWithoutPassword } = updatedUser;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Error updating user" });
    }
  });

  // Announcement routes
  app.get("/api/announcements", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const announcements = await storage.listAnnouncements(limit);
      res.status(200).json(announcements);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving announcements" });
    }
  });

  app.get("/api/announcements/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const announcement = await storage.getAnnouncement(id);
      if (!announcement) {
        return res.status(404).json({ message: "Announcement not found" });
      }
      res.status(200).json(announcement);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving announcement" });
    }
  });

  app.post("/api/announcements", isAdmin, async (req, res) => {
    try {
      const announcementData = insertAnnouncementSchema.parse(req.body);
      const announcement = await storage.createAnnouncement(announcementData);
      res.status(201).json(announcement);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Error creating announcement" });
    }
  });

  app.put("/api/announcements/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const announcementData = req.body;
      const updatedAnnouncement = await storage.updateAnnouncement(id, announcementData);
      if (!updatedAnnouncement) {
        return res.status(404).json({ message: "Announcement not found" });
      }
      res.status(200).json(updatedAnnouncement);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Error updating announcement" });
    }
  });
  
  // Add PATCH endpoint for partial updates to announcements
  app.patch("/api/announcements/:id", isAdmin, async (req, res) => {
    try {
      console.log("PATCH request received with body:", req.body);
      const id = parseInt(req.params.id, 10);
      const announcementData = req.body.announcementData || req.body;
      
      // Log the actual data we're using to update
      console.log("Updating announcement with ID:", id, "and data:", announcementData);
      
      const updatedAnnouncement = await storage.updateAnnouncement(id, announcementData);
      if (!updatedAnnouncement) {
        return res.status(404).json({ message: "Announcement not found" });
      }
      res.status(200).json(updatedAnnouncement);
    } catch (error) {
      console.error("Error updating announcement:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Error updating announcement", error: error.message });
    }
  });

  app.delete("/api/announcements/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await storage.deleteAnnouncement(id);
      if (!success) {
        return res.status(404).json({ message: "Announcement not found" });
      }
      res.status(200).json({ message: "Announcement deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting announcement" });
    }
  });

  // Event routes
  app.get("/api/events", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const events = await storage.listEvents(limit);
      res.status(200).json(events);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving events" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const event = await storage.getEvent(id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.status(200).json(event);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving event" });
    }
  });

  app.post("/api/events", isAdmin, async (req, res) => {
    try {
      const eventData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(eventData);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Error creating event" });
    }
  });

  app.put("/api/events/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const eventData = req.body;
      const updatedEvent = await storage.updateEvent(id, eventData);
      if (!updatedEvent) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.status(200).json(updatedEvent);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Error updating event" });
    }
  });

  app.delete("/api/events/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await storage.deleteEvent(id);
      if (!success) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.status(200).json({ message: "Event deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting event" });
    }
  });

  // Event Registration routes
  app.get("/api/events/:eventId/registrations", isAdmin, async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      const registrations = await storage.listEventRegistrations(eventId);
      res.status(200).json(registrations);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving registrations" });
    }
  });

  app.post("/api/events/:eventId/register", isAuthenticated, async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      const userId = req.session.userId!;
      
      // Check if event exists
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Check if registration deadline has passed
      if (event.registrationDeadline && new Date(event.registrationDeadline) < new Date()) {
        return res.status(400).json({ message: "Registration deadline has passed" });
      }

      // Check if event has reached capacity
      const registrations = await storage.listEventRegistrations(eventId);
      if (event.capacity && registrations.length >= event.capacity) {
        return res.status(400).json({ message: "Event has reached capacity" });
      }

      // Check if user is already registered
      const existingRegistration = await storage.getEventRegistrationByUserAndEvent(userId, eventId);
      if (existingRegistration) {
        return res.status(400).json({ message: "You are already registered for this event" });
      }

      // Create registration
      const registrationData = insertEventRegistrationSchema.parse({
        eventId,
        userId,
        formData: req.body.formData || {},
        status: "pending"
      });

      const registration = await storage.createEventRegistration(registrationData);
      res.status(201).json(registration);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Error registering for event" });
    }
  });

  app.put("/api/events/registrations/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const registrationData = req.body;
      const updatedRegistration = await storage.updateEventRegistration(id, registrationData);
      if (!updatedRegistration) {
        return res.status(404).json({ message: "Registration not found" });
      }
      res.status(200).json(updatedRegistration);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Error updating registration" });
    }
  });

  app.delete("/api/events/registrations/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await storage.deleteEventRegistration(id);
      if (!success) {
        return res.status(404).json({ message: "Registration not found" });
      }
      res.status(200).json({ message: "Registration deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting registration" });
    }
  });

  app.get("/api/events/:eventId/registrations/export", isAdmin, async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      
      // Check if event exists
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Get registrations
      const registrations = await storage.listEventRegistrations(eventId);
      
      // Get users for these registrations
      const userPromises = registrations.map(reg => storage.getUser(reg.userId));
      const users = await Promise.all(userPromises);
      
      // Combine registration data with user data
      const registrationData = registrations.map((reg, index) => {
        const user = users[index];
        if (!user) return null;
        
        // Remove password and other sensitive information
        const { password, ...userDetails } = user;
        
        return {
          registrationId: reg.id,
          registrationStatus: reg.status,
          registeredAt: reg.registeredAt,
          ...userDetails,
          ...reg.formData,
        };
      }).filter(data => data !== null);
      
      // Generate Excel file
      const filename = `${event.title}_registrations_${new Date().toISOString().split('T')[0]}.xlsx`;
      const buffer = await exportToExcel(registrationData, filename);
      
      // Send file
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(buffer);
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ message: "Error exporting registrations" });
    }
  });

  // Tournament routes
  app.get("/api/tournaments", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const tournaments = await storage.listTournaments(limit);
      res.status(200).json(tournaments);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving tournaments" });
    }
  });

  app.get("/api/tournaments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const tournament = await storage.getTournament(id);
      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }
      res.status(200).json(tournament);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving tournament" });
    }
  });

  app.post("/api/tournaments", isAdmin, async (req, res) => {
    try {
      const tournamentData = insertTournamentSchema.parse(req.body);
      const tournament = await storage.createTournament(tournamentData);
      res.status(201).json(tournament);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Error creating tournament" });
    }
  });

  app.put("/api/tournaments/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const tournamentData = req.body;
      const updatedTournament = await storage.updateTournament(id, tournamentData);
      if (!updatedTournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }
      res.status(200).json(updatedTournament);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Error updating tournament" });
    }
  });

  app.delete("/api/tournaments/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await storage.deleteTournament(id);
      if (!success) {
        return res.status(404).json({ message: "Tournament not found" });
      }
      res.status(200).json({ message: "Tournament deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting tournament" });
    }
  });

  // Teams routes
  app.get("/api/tournaments/:tournamentId/teams", async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.tournamentId, 10);
      const teams = await storage.listTeamsByTournament(tournamentId);
      res.status(200).json(teams);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving teams" });
    }
  });

  app.post("/api/tournaments/:tournamentId/teams", isAuthenticated, async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.tournamentId, 10);
      const captainId = req.session.userId!;
      
      // Check if tournament exists and is accepting registrations
      const tournament = await storage.getTournament(tournamentId);
      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }

      if (tournament.registrationDeadline && new Date(tournament.registrationDeadline) < new Date()) {
        return res.status(400).json({ message: "Registration deadline has passed" });
      }

      // Check if max teams limit is reached
      const existingTeams = await storage.listTeamsByTournament(tournamentId);
      if (tournament.maxTeams && existingTeams.length >= tournament.maxTeams) {
        return res.status(400).json({ message: "Tournament has reached maximum team capacity" });
      }

      // Check if user is already a captain of a team in this tournament
      const isCaptain = existingTeams.some(team => team.captainId === captainId);
      if (isCaptain) {
        return res.status(400).json({ message: "You are already a captain of a team in this tournament" });
      }

      // Create team
      const teamData = insertTeamSchema.parse({
        name: req.body.name,
        tournamentId,
        captainId
      });

      const team = await storage.createTeam(teamData);
      
      // Add captain as a team member
      await storage.createTeamMember({
        teamId: team.id,
        userId: captainId
      });

      res.status(201).json(team);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Error creating team" });
    }
  });

  app.put("/api/teams/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = req.session.userId!;
      
      // Get team and verify user is the captain
      const team = await storage.getTeam(id);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      if (team.captainId !== userId) {
        const user = await storage.getUser(userId);
        if (!user || user.role !== "admin") {
          return res.status(403).json({ message: "Only team captain or admin can update team" });
        }
      }

      const updatedTeam = await storage.updateTeam(id, req.body);
      if (!updatedTeam) {
        return res.status(404).json({ message: "Team not found" });
      }
      res.status(200).json(updatedTeam);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Error updating team" });
    }
  });

  app.delete("/api/teams/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = req.session.userId!;
      
      // Get team and verify user is the captain or admin
      const team = await storage.getTeam(id);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      if (team.captainId !== userId) {
        const user = await storage.getUser(userId);
        if (!user || user.role !== "admin") {
          return res.status(403).json({ message: "Only team captain or admin can delete team" });
        }
      }

      const success = await storage.deleteTeam(id);
      if (!success) {
        return res.status(404).json({ message: "Team not found" });
      }
      res.status(200).json({ message: "Team deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting team" });
    }
  });

  // Team Members routes
  app.get("/api/teams/:teamId/members", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId, 10);
      const teamMembers = await storage.listTeamMembers(teamId);
      
      // Get full user details for each member
      const memberDetails = await Promise.all(
        teamMembers.map(async (member) => {
          const user = await storage.getUser(member.userId);
          if (!user) return null;
          
          // Remove password from user data
          const { password, ...userDetails } = user;
          
          return {
            ...member,
            user: userDetails
          };
        })
      );
      
      res.status(200).json(memberDetails.filter(member => member !== null));
    } catch (error) {
      res.status(500).json({ message: "Error retrieving team members" });
    }
  });

  app.post("/api/teams/:teamId/members", isAuthenticated, async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId, 10);
      const captainId = req.session.userId!;
      
      // Get team and verify user is the captain
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      if (team.captainId !== captainId) {
        const user = await storage.getUser(captainId);
        if (!user || user.role !== "admin") {
          return res.status(403).json({ message: "Only team captain or admin can add members" });
        }
      }

      // Validate user to add
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const userToAdd = await storage.getUser(userId);
      if (!userToAdd) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user is already a member
      const teamMembers = await storage.listTeamMembers(teamId);
      if (teamMembers.some(member => member.userId === userId)) {
        return res.status(400).json({ message: "User is already a team member" });
      }

      // Add team member
      const teamMemberData = insertTeamMemberSchema.parse({
        teamId,
        userId
      });

      const teamMember = await storage.createTeamMember(teamMemberData);
      res.status(201).json(teamMember);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Error adding team member" });
    }
  });

  app.delete("/api/team-members/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = req.session.userId!;
      
      // Get team member to determine the team
      const teamMember = await storage.getTeamMember(id);
      if (!teamMember) {
        return res.status(404).json({ message: "Team member not found" });
      }

      // Get team to verify user is the captain
      const team = await storage.getTeam(teamMember.teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      // Check if user has permission (is captain, admin, or the member being removed)
      const isTeamCaptain = team.captainId === userId;
      const isSelfRemoval = teamMember.userId === userId;
      
      if (!isTeamCaptain && !isSelfRemoval) {
        const user = await storage.getUser(userId);
        if (!user || user.role !== "admin") {
          return res.status(403).json({ message: "You don't have permission to remove this team member" });
        }
      }

      // Check if trying to remove the captain
      if (teamMember.userId === team.captainId && !isSelfRemoval) {
        return res.status(400).json({ message: "Cannot remove team captain" });
      }

      const success = await storage.deleteTeamMember(id);
      if (!success) {
        return res.status(404).json({ message: "Team member not found" });
      }
      res.status(200).json({ message: "Team member removed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error removing team member" });
    }
  });

  // Matches routes
  app.get("/api/tournaments/:tournamentId/matches", async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.tournamentId, 10);
      const matches = await storage.listMatchesByTournament(tournamentId);
      res.status(200).json(matches);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving matches" });
    }
  });

  app.post("/api/tournaments/:tournamentId/matches", isAdmin, async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.tournamentId, 10);
      
      // If creating a single match
      if (req.body.round) {
        const matchData = insertMatchSchema.parse({
          ...req.body,
          tournamentId
        });
        const match = await storage.createMatch(matchData);
        return res.status(201).json(match);
      }
      
      // If generating all matches for a tournament
      const tournament = await storage.getTournament(tournamentId);
      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }
      
      const teams = await storage.listTeamsByTournament(tournamentId);
      if (teams.length < 2) {
        return res.status(400).json({ message: "Not enough teams to generate matches" });
      }
      
      // Generate tournament brackets based on format
      const matches = await generateTournamentBrackets(tournament, teams);
      
      // Create all matches
      const createdMatches = await Promise.all(
        matches.map(match => storage.createMatch(match))
      );
      
      res.status(201).json(createdMatches);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Error creating matches" });
    }
  });

  app.put("/api/matches/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const matchData = req.body;
      
      // Get current match data
      const currentMatch = await storage.getMatch(id);
      if (!currentMatch) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      // Update match
      const updatedMatch = await storage.updateMatch(id, matchData);
      if (!updatedMatch) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      // If match is completed and scores are updated, update standings
      if (updatedMatch.status === "completed" && 
          updatedMatch.team1Score !== undefined && 
          updatedMatch.team2Score !== undefined &&
          updatedMatch.team1Id && 
          updatedMatch.team2Id) {
        
        // Update team 1 standing
        let team1Standing = await storage.getStandingByTeamAndTournament(
          updatedMatch.team1Id, 
          updatedMatch.tournamentId
        );
        
        if (!team1Standing) {
          // Create standing if it doesn't exist
          team1Standing = await storage.createStanding({
            tournamentId: updatedMatch.tournamentId,
            teamId: updatedMatch.team1Id,
            wins: 0,
            losses: 0,
            draws: 0,
            points: 0,
            goalsFor: 0,
            goalsAgainst: 0
          });
        }
        
        // Update team 2 standing
        let team2Standing = await storage.getStandingByTeamAndTournament(
          updatedMatch.team2Id, 
          updatedMatch.tournamentId
        );
        
        if (!team2Standing) {
          // Create standing if it doesn't exist
          team2Standing = await storage.createStanding({
            tournamentId: updatedMatch.tournamentId,
            teamId: updatedMatch.team2Id,
            wins: 0,
            losses: 0,
            draws: 0,
            points: 0,
            goalsFor: 0,
            goalsAgainst: 0
          });
        }
        
        // Update standings based on match result
        if (updatedMatch.team1Score > updatedMatch.team2Score) {
          // Team 1 wins
          await storage.updateStanding(team1Standing.id, {
            wins: (team1Standing.wins || 0) + 1,
            points: (team1Standing.points || 0) + 3,
            goalsFor: (team1Standing.goalsFor || 0) + updatedMatch.team1Score,
            goalsAgainst: (team1Standing.goalsAgainst || 0) + updatedMatch.team2Score
          });
          
          await storage.updateStanding(team2Standing.id, {
            losses: (team2Standing.losses || 0) + 1,
            goalsFor: (team2Standing.goalsFor || 0) + updatedMatch.team2Score,
            goalsAgainst: (team2Standing.goalsAgainst || 0) + updatedMatch.team1Score
          });
          
          // Set winner
          await storage.updateMatch(id, { winnerId: updatedMatch.team1Id });
        } else if (updatedMatch.team1Score < updatedMatch.team2Score) {
          // Team 2 wins
          await storage.updateStanding(team1Standing.id, {
            losses: (team1Standing.losses || 0) + 1,
            goalsFor: (team1Standing.goalsFor || 0) + updatedMatch.team1Score,
            goalsAgainst: (team1Standing.goalsAgainst || 0) + updatedMatch.team2Score
          });
          
          await storage.updateStanding(team2Standing.id, {
            wins: (team2Standing.wins || 0) + 1,
            points: (team2Standing.points || 0) + 3,
            goalsFor: (team2Standing.goalsFor || 0) + updatedMatch.team2Score,
            goalsAgainst: (team2Standing.goalsAgainst || 0) + updatedMatch.team1Score
          });
          
          // Set winner
          await storage.updateMatch(id, { winnerId: updatedMatch.team2Id });
        } else {
          // Draw
          await storage.updateStanding(team1Standing.id, {
            draws: (team1Standing.draws || 0) + 1,
            points: (team1Standing.points || 0) + 1,
            goalsFor: (team1Standing.goalsFor || 0) + updatedMatch.team1Score,
            goalsAgainst: (team1Standing.goalsAgainst || 0) + updatedMatch.team2Score
          });
          
          await storage.updateStanding(team2Standing.id, {
            draws: (team2Standing.draws || 0) + 1,
            points: (team2Standing.points || 0) + 1,
            goalsFor: (team2Standing.goalsFor || 0) + updatedMatch.team2Score,
            goalsAgainst: (team2Standing.goalsAgainst || 0) + updatedMatch.team1Score
          });
        }
        
        // Update next round in knockout format if needed
        const tournament = await storage.getTournament(updatedMatch.tournamentId);
        if (tournament && tournament.format === "knockout" && updatedMatch.winnerId) {
          // Find the next match in the tournament bracket
          const allMatches = await storage.listMatchesByTournament(updatedMatch.tournamentId);
          
          // In knockout format, the next round's match number is calculated
          // For example, if current match is round 1, match 1, winner goes to round 2, match 1
          const nextRound = updatedMatch.round + 1;
          const nextMatchNumber = Math.ceil(updatedMatch.matchNumber / 2);
          
          const nextMatch = allMatches.find(m => 
            m.round === nextRound && m.matchNumber === nextMatchNumber
          );
          
          if (nextMatch) {
            // Determine if winner should be team1 or team2 in the next match
            // For odd-numbered matches, winners go to team1 of next match
            // For even-numbered matches, winners go to team2 of next match
            const updateData = updatedMatch.matchNumber % 2 === 1
              ? { team1Id: updatedMatch.winnerId }
              : { team2Id: updatedMatch.winnerId };
            
            await storage.updateMatch(nextMatch.id, updateData);
          }
        }
      }
      
      res.status(200).json(updatedMatch);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Error updating match" });
    }
  });

  // Standings routes
  app.get("/api/tournaments/:tournamentId/standings", async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.tournamentId, 10);
      const standings = await storage.listStandingsByTournament(tournamentId);
      
      // Get team details for each standing
      const standingsWithTeams = await Promise.all(
        standings.map(async (standing, index) => {
          const team = await storage.getTeam(standing.teamId);
          return {
            ...standing,
            rank: index + 1, // Update rank based on sorted position
            team: team || { name: "Unknown Team" }
          };
        })
      );
      
      res.status(200).json(standingsWithTeams);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving standings" });
    }
  });

  // Custom Forms routes
  app.get("/api/custom-forms", isAdmin, async (req, res) => {
    try {
      const forms = await storage.listCustomForms();
      res.status(200).json(forms);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving custom forms" });
    }
  });

  app.get("/api/custom-forms/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const form = await storage.getCustomForm(id);
      if (!form) {
        return res.status(404).json({ message: "Custom form not found" });
      }
      res.status(200).json(form);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving custom form" });
    }
  });

  app.post("/api/custom-forms", isAdmin, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const formData = insertCustomFormSchema.parse({
        ...req.body,
        createdBy: userId
      });
      const form = await storage.createCustomForm(formData);
      res.status(201).json(form);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Error creating custom form" });
    }
  });

  app.put("/api/custom-forms/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const formData = req.body;
      const updatedForm = await storage.updateCustomForm(id, formData);
      if (!updatedForm) {
        return res.status(404).json({ message: "Custom form not found" });
      }
      res.status(200).json(updatedForm);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Error updating custom form" });
    }
  });

  app.delete("/api/custom-forms/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await storage.deleteCustomForm(id);
      if (!success) {
        return res.status(404).json({ message: "Custom form not found" });
      }
      res.status(200).json({ message: "Custom form deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting custom form" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
