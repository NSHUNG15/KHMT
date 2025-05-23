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

// Export form handlers are defined below

// Export custom forms handler - xuất thông tin người đăng ký biểu mẫu
async function handleExportForms(req: Request, res: Response) {
  try {
    // Get all forms
    const forms = await storage.listCustomForms();
    
    // Lấy ID của biểu mẫu từ query parameter, nếu có
    const formId = req.query.formId ? parseInt(req.query.formId as string, 10) : null;
    
    // Nếu có formId cụ thể, sẽ xuất dữ liệu đăng ký của form đó
    if (formId) {
      const form = await storage.getCustomForm(formId);
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }
      
      // TODO: Thay bằng lấy dữ liệu đăng ký của form này
      // Ví dụ: const submissions = await storage.getFormSubmissions(formId);
      
      // Tạm thời tạo dữ liệu mẫu để demo
      const submissions = [
        {
          id: 1,
          formId: formId,
          userId: 1,
          username: "user1",
          fullName: "Người dùng 1",
          submittedAt: new Date(),
          responses: {
            field_1: "Giá trị 1",
            field_2: "Giá trị 2"
          }
        }
      ];
      
      const filename = `${form.name}_submissions_${new Date().toISOString().split('T')[0]}.xlsx`;
      const buffer = await exportToExcel(submissions, filename);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(filename)}`);
      return res.send(buffer);
    }
    
    // Nếu không có formId, xuất danh sách tất cả các biểu mẫu
    const exportData = forms.map(form => {
      // Count fields
      let fieldCount = 0;
      if (Array.isArray(form.fields)) {
        fieldCount = form.fields.length;
      }
      
      return {
        id: form.id,
        name: form.name,
        description: form.description || '',
        fieldCount: fieldCount,
        createdAt: form.createdAt,
      };
    });
    
    // Generate Excel
    const filename = `custom_forms_${new Date().toISOString().split('T')[0]}.xlsx`;
    const buffer = await exportToExcel(exportData, filename);
    
    // Send file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(filename)}`);
    res.send(buffer);
  } catch (error: any) {
    console.error("Error exporting forms:", error);
    res.status(500).json({ message: "Error exporting forms", error: error.message });
  }
}

// Function to handle exporting teams from a tournament - xuất danh sách đội tham gia
async function handleExportTeams(req: Request, res: Response) {
  try {
    const tournamentId = parseInt(req.params.tournamentId, 10);
    
    // Check if tournament exists
    const tournament = await storage.getTournament(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }
    
    // Get teams for this tournament
    const teams = await storage.listTeamsByTournament(tournamentId);
    
    // Prepare data for export - Dữ liệu người dùng đăng ký tham gia giải đấu
    const exportData = await Promise.all(teams.map(async (team) => {
      // Get team members
      const members = await storage.listTeamMembers(team.id);
      
      // Get member details
      const memberPromises = members.map(member => storage.getUser(member.userId));
      const memberDetails = await Promise.all(memberPromises);
      
      // Create a comma-separated list of member names
      const memberNames = memberDetails
        .filter(user => user !== undefined)
        .map(user => user!.fullName || user!.username)
        .join(", ");
      
      // Get captain details
      const captain = await storage.getUser(team.captainId);
      
      return {
        teamId: team.id,
        name: team.name,
        captain: captain ? (captain.fullName || captain.username) : "Unknown",
        createdAt: team.createdAt,
        members: memberNames,
        memberCount: members.length,
      };
    }));
    
    // Generate Excel file
    const filename = `${tournament.name}_teams_${new Date().toISOString().split('T')[0]}.xlsx`;
    const buffer = await exportToExcel(exportData, filename);
    
    // Send file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(filename)}`);
    res.send(buffer);
  } catch (error: any) {
    console.error("Error exporting teams:", error);
    res.status(500).json({ message: "Error exporting teams", error: error.message });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "su_duytan_cs_student_union_secret_key",
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: process.env.NODE_ENV === "production", 
        maxAge: parseInt(process.env.SESSION_EXPIRY || "86400000") // 24 hours by default
      },
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
      console.log("Creating event with data:", req.body);
      
      // Đặc biệt xử lý trường formTemplate
      const formTemplateData = req.body.formTemplate;
      
      // Tạo một bản sao của dữ liệu để chỉnh sửa
      const eventData = { ...req.body };
      
      // Đảm bảo formTemplate là đúng định dạng (chuỗi hoặc đối tượng)
      if (formTemplateData) {
        if (typeof formTemplateData === 'string') {
          try {
            eventData.formTemplate = JSON.parse(formTemplateData);
          } catch (e) {
            // Nếu không phân tích được, giữ nguyên
            console.log("Error parsing formTemplate string:", e);
          }
        } else if (typeof formTemplateData === 'object') {
          // Nếu đã là object, giữ nguyên
          eventData.formTemplate = formTemplateData;
        }
      }
      
      console.log("Processed event data:", eventData);
      
      // Bỏ qua xác thực Zod tạm thời để tìm ra vấn đề
      // const validatedData = insertEventSchema.parse(eventData);
      const event = await storage.createEvent(eventData);
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Error creating event", error: error.message });
    }
  });

  app.put("/api/events/:id", isAdmin, async (req, res) => {
    try {
      console.log("PUT updating event with data:", req.body);
      
      const id = parseInt(req.params.id, 10);
      
      // Đặc biệt xử lý trường formTemplate
      const formTemplateData = req.body.formTemplate;
      
      // Tạo một bản sao của dữ liệu để chỉnh sửa
      const eventData = { ...req.body };
      
      // Đảm bảo formTemplate là đúng định dạng (chuỗi hoặc đối tượng)
      if (formTemplateData) {
        if (typeof formTemplateData === 'string') {
          try {
            eventData.formTemplate = JSON.parse(formTemplateData);
          } catch (e) {
            // Nếu không phân tích được, giữ nguyên
            console.log("Error parsing formTemplate string:", e);
          }
        } else if (typeof formTemplateData === 'object') {
          // Nếu đã là object, giữ nguyên
          eventData.formTemplate = formTemplateData;
        }
      }
      
      const updatedEvent = await storage.updateEvent(id, eventData);
      if (!updatedEvent) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.status(200).json(updatedEvent);
    } catch (error) {
      console.error("Error in PUT update event:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Error updating event", error: error.message });
    }
  });

  // Add PATCH endpoint for partial updates to events
  app.patch("/api/events/:id", isAdmin, async (req, res) => {
    try {
      console.log("PATCH request received for event with body:", req.body);
      const id = parseInt(req.params.id, 10);
      const eventData = req.body.eventData || req.body;
      
      // Log the actual data we're using to update
      console.log("Updating event with ID:", id, "and data:", eventData);
      
      const updatedEvent = await storage.updateEvent(id, eventData);
      if (!updatedEvent) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.status(200).json(updatedEvent);
    } catch (error) {
      console.error("Error updating event:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Error updating event", error: error.message });
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

  // Export event registrations - xuất dữ liệu người dùng đăng ký sự kiện
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
      
      // Combine registration data with user data - Dữ liệu người dùng đăng ký sự kiện
      const registrationData = registrations.map((reg, index) => {
        const user = users[index];
        if (!user) return null;
        
        // Remove password and other sensitive information
        const { password, ...userDetails } = user;
        
        // Xử lý dữ liệu form, lấy thông tin người dùng đã điền
        let formResponses = {};
        if (reg.formData && typeof reg.formData === 'object') {
          formResponses = reg.formData;
        } else if (typeof reg.formData === 'string') {
          try {
            formResponses = JSON.parse(reg.formData);
          } catch (e) {
            console.error("Error parsing formData:", e);
          }
        }
        
        return {
          registrationId: reg.id,
          registrationStatus: reg.status,
          registeredAt: reg.registeredAt,
          username: userDetails.username,
          fullName: userDetails.fullName,
          email: userDetails.email,
          faculty: userDetails.faculty,
          studentId: userDetails.studentId,
          ...formResponses,
        };
      }).filter(data => data !== null);
      
      // Generate Excel file
      const filename = `${event.title}_registrations_${new Date().toISOString().split('T')[0]}.xlsx`;
      const buffer = await exportToExcel(registrationData, filename);
      
      // Send file
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(filename)}`);
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
      console.log("Creating tournament with request body:", req.body);
      const userId = req.session.userId!;
      
      // Process dates
      const tournamentData = {
        ...req.body,
        createdBy: userId,
        // Convert string dates to ISO format if they exist
        startDate: req.body.startDate ? new Date(req.body.startDate).toISOString() : new Date().toISOString(),
        endDate: req.body.endDate ? new Date(req.body.endDate).toISOString() : new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
        registrationDeadline: req.body.registrationDeadline ? new Date(req.body.registrationDeadline).toISOString() : new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
        // Set default values for required fields if missing
        name: req.body.name || "Untitled Tournament",
        description: req.body.description || "Tournament description",
        sportType: req.body.sportType || "Other",
        format: req.body.format || "knockout",
        status: req.body.status || "upcoming",
        isPublished: req.body.isPublished !== undefined ? req.body.isPublished : true
      };
      
      console.log("Processed tournament data:", tournamentData);
      
      // Skip Zod validation for troubleshooting
      // const validatedData = insertTournamentSchema.parse(tournamentData);
      const tournament = await storage.createTournament(tournamentData);
      res.status(201).json(tournament);
    } catch (error) {
      console.error("Error creating tournament:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Error creating tournament", error: error.message });
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

  // Add export endpoint for tournament teams
  app.get("/api/tournaments/:tournamentId/export-teams", isAdmin, handleExportTeams);
  
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
  
  // Export Forms endpoint
  app.get("/api/custom-forms/export", isAdmin, handleExportForms);

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
      console.log("Creating custom form with request body:", req.body);
      const userId = req.session.userId!;
      
      // Ensure we can handle both direct fields and structure.fields
      let fields = [];
      if (req.body.fields) {
        fields = req.body.fields;
        console.log("Using fields directly:", fields);
      } else if (req.body.structure) {
        try {
          const structure = typeof req.body.structure === 'string' 
            ? JSON.parse(req.body.structure) 
            : req.body.structure;
          fields = structure.fields || [];
          console.log("Extracted fields from structure:", fields);
        } catch (e) {
          console.error("Error parsing structure:", e);
        }
      }
      
      const formData = {
        name: req.body.name || "Untitled Form",
        description: req.body.description || "",
        fields: fields,
        createdBy: userId
      };
      
      console.log("Processed form data:", formData);
      
      // Skip Zod validation for troubleshooting
      // const validatedData = insertCustomFormSchema.parse(formData);
      const form = await storage.createCustomForm(formData);
      res.status(201).json(form);
    } catch (error) {
      console.error("Error creating custom form:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Error creating custom form", error: error.message });
    }
  });

  // PATCH endpoint for updating custom forms
  app.patch("/api/custom-forms/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      
      // Ensure we can handle both direct fields and structure.fields
      let fields = [];
      if (req.body.fields) {
        fields = req.body.fields;
        console.log("Using fields directly:", fields);
      } else if (req.body.structure) {
        try {
          const structure = typeof req.body.structure === 'string' 
            ? JSON.parse(req.body.structure) 
            : req.body.structure;
          fields = structure.fields || [];
          console.log("Extracted fields from structure:", fields);
        } catch (e) {
          console.error("Error parsing structure:", e);
        }
      }
      
      const formData = {
        name: req.body.name,
        description: req.body.description,
        fields: fields
      };
      
      console.log("Updating form with data:", formData);
      
      const updatedForm = await storage.updateCustomForm(id, formData);
      if (!updatedForm) {
        return res.status(404).json({ message: "Custom form not found" });
      }
      res.status(200).json(updatedForm);
    } catch (error) {
      console.error("Error updating custom form:", error);
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
