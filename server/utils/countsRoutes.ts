import { Express, Request, Response } from 'express';
import { storage } from '../mongoStorage';

/**
 * Registers routes for getting counts of different entities
 * @param app Express application
 */
export function registerCountsRoutes(app: Express) {
  // Get counts of users (for authenticated users, since it's used in admin dashboard)
  app.get('/api/users/count', async (req, res) => {
    try {
      const count = await storage.getCount('users');
      res.status(200).json({ count });
    } catch (error) {
      console.error('Error getting user count:', error);
      res.status(500).json({ message: 'Error retrieving user count' });
    }
  });

  // Get counts of announcements (public route)
  app.get('/api/announcements/count', async (req, res) => {
    try {
      const count = await storage.getCount('announcements');
      res.status(200).json({ count });
    } catch (error) {
      console.error('Error getting announcements count:', error);
      res.status(500).json({ message: 'Error retrieving announcements count' });
    }
  });

  // Get counts of events (public route)
  app.get('/api/events/count', async (req, res) => {
    try {
      const count = await storage.getCount('events');
      res.status(200).json({ count });
    } catch (error) {
      console.error('Error getting events count:', error);
      res.status(500).json({ message: 'Error retrieving events count' });
    }
  });

  // Get counts of tournaments (public route)
  app.get('/api/tournaments/count', async (req, res) => {
    try {
      const count = await storage.getCount('tournaments');
      res.status(200).json({ count });
    } catch (error) {
      console.error('Error getting tournaments count:', error);
      res.status(500).json({ message: 'Error retrieving tournaments count' });
    }
  });

  // Get counts of forms (public route)
  app.get('/api/forms/count', async (req, res) => {
    try {
      const count = await storage.getCount('customForms');
      res.status(200).json({ count });
    } catch (error) {
      console.error('Error getting forms count:', error);
      res.status(500).json({ message: 'Error retrieving forms count' });
    }
  });
  
  // Add a handler for API/forms which is also needed
  app.get('/api/forms', async (req, res) => {
    try {
      const forms = await storage.listCustomForms();
      res.status(200).json(forms);
    } catch (error) {
      console.error('Error getting forms:', error);
      res.status(500).json({ message: 'Error retrieving forms' });
    }
  });
}