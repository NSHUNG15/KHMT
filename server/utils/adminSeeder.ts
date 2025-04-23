import bcrypt from 'bcrypt';
import { User } from '@shared/mongoSchema';
import { storage } from '../mongoStorage';

/**
 * Creates an admin user if none exists
 */
export async function seedAdminUser() {
  try {
    // Check if admin user exists
    const adminUser = await storage.getUserByUsername('admin');
    
    if (!adminUser) {
      console.log('Creating admin user...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin', salt);
      
      await storage.createUser({
        username: 'admin',
        password: hashedPassword,
        email: 'admin@dtu.edu.vn',
        fullName: 'Admin',
        faculty: 'Computer Science',
        role: 'admin'
      });
      
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error seeding admin user:', error);
  }
}