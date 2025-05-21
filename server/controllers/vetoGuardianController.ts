import { Request, Response } from 'express';
import { db } from '../db';
import { vetoGuardians, vetoActions } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Mock data for development until database is populated
const mockVetoGuardians = [
  {
    id: 1,
    address: 'PVX_9c386d81bdea6f063593498c335ee640',
    name: 'Network Supervisor',
    description: 'Primary network supervisor with veto powers for potentially harmful governance proposals',
    isActive: true,
    appointedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
    activeUntil: new Date(Date.now() + 275 * 24 * 60 * 60 * 1000), // 275 days from now
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  {
    id: 2,
    address: 'PVX_a5a86dcdfa84040815d7a399ba1e2ec2',
    name: 'Protocol Guardian',
    description: 'Monitors protocol changes and prevents malicious code updates',
    isActive: true,
    appointedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
    activeUntil: new Date(Date.now() + 305 * 24 * 60 * 60 * 1000), // 305 days from now
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  {
    id: 3,
    address: 'PVX_1e1ee32c2770a6af3ca119759c539907',
    name: 'Treasury Auditor',
    description: 'Protects treasury funds from unauthorized or potentially harmful financial proposals',
    isActive: true,
    appointedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    activeUntil: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000), // 335 days from now
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  }
];

/**
 * Get all veto guardians
 */
export const getAllVetoGuardians = async (req: Request, res: Response): Promise<void> => {
  try {
    let guardians;
    
    try {
      // Try to get from database first
      guardians = await db.select().from(vetoGuardians);
    } catch (dbError) {
      console.warn('Database error getting veto guardians, using mock data:', dbError);
      // Return mock data if database access fails
      guardians = mockVetoGuardians;
    }
    
    // If no guardians found in DB, use mock data
    if (!guardians || guardians.length === 0) {
      guardians = mockVetoGuardians;
    }
    
    res.status(200).json(guardians);
  } catch (error) {
    console.error('Error getting veto guardians:', error);
    res.status(500).json({ error: 'Failed to fetch veto guardians' });
  }
};

/**
 * Get veto guardian by ID
 */
export const getVetoGuardianById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      res.status(400).json({ error: 'Invalid guardian ID' });
      return;
    }
    
    const guardianId = parseInt(id);
    
    let guardian;
    try {
      // Try to get from database first
      const result = await db.select().from(vetoGuardians).where(eq(vetoGuardians.id, guardianId));
      guardian = result[0];
    } catch (dbError) {
      console.warn('Database error getting veto guardian, using mock data:', dbError);
      // Find in mock data if database access fails
      guardian = mockVetoGuardians.find(g => g.id === guardianId);
    }
    
    // If guardian not found in DB, try mock data
    if (!guardian) {
      guardian = mockVetoGuardians.find(g => g.id === guardianId);
    }
    
    if (!guardian) {
      res.status(404).json({ error: 'Veto guardian not found' });
      return;
    }
    
    res.status(200).json(guardian);
  } catch (error) {
    console.error('Error getting veto guardian by ID:', error);
    res.status(500).json({ error: 'Failed to fetch veto guardian' });
  }
};

/**
 * Get veto guardian by address
 */
export const getVetoGuardianByAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { address } = req.params;
    
    if (!address) {
      res.status(400).json({ error: 'Address is required' });
      return;
    }
    
    let guardian;
    try {
      // Try to get from database first
      const result = await db.select().from(vetoGuardians).where(eq(vetoGuardians.address, address));
      guardian = result[0];
    } catch (dbError) {
      console.warn('Database error getting veto guardian by address, using mock data:', dbError);
      // Find in mock data if database access fails
      guardian = mockVetoGuardians.find(g => g.address === address);
    }
    
    // If guardian not found in DB, try mock data
    if (!guardian) {
      guardian = mockVetoGuardians.find(g => g.address === address);
    }
    
    if (!guardian) {
      res.status(404).json({ error: 'Veto guardian not found for this address' });
      return;
    }
    
    res.status(200).json(guardian);
  } catch (error) {
    console.error('Error getting veto guardian by address:', error);
    res.status(500).json({ error: 'Failed to fetch veto guardian' });
  }
};

/**
 * Create a new veto guardian
 */
export const createVetoGuardian = async (req: Request, res: Response): Promise<void> => {
  try {
    const { address, name, description, activeUntil } = req.body;
    
    if (!address || !name) {
      res.status(400).json({ error: 'Address and name are required' });
      return;
    }
    
    // Check if guardian already exists
    try {
      const existingGuardian = await db.select().from(vetoGuardians).where(eq(vetoGuardians.address, address));
      
      if (existingGuardian && existingGuardian.length > 0) {
        res.status(409).json({ error: 'Guardian with this address already exists' });
        return;
      }
    } catch (dbError) {
      console.warn('Database error checking existing guardian, proceeding with creation:', dbError);
    }
    
    // Generate next ID for mock data
    const nextId = mockVetoGuardians.length > 0 
      ? Math.max(...mockVetoGuardians.map(g => g.id)) + 1 
      : 1;
    
    // Create new guardian object
    const newGuardian = {
      id: nextId,
      address,
      name,
      description: description || '',
      isActive: true,
      appointedAt: new Date(),
      activeUntil: activeUntil ? new Date(activeUntil) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 1 year
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    try {
      // Try to insert into database
      const dbInsert = {
        id: nextId,
        address: address,
        name: name,
        description: description || "",
        isActive: true,
        appointedAt: new Date(),
        activeUntil: activeUntil ? new Date(activeUntil) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 1 year
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await db.insert(vetoGuardians).values(dbInsert).returning();
      
      // Return created guardian from DB
      res.status(201).json(result[0]);
    } catch (dbError) {
      console.warn('Database error creating guardian, using mock data:', dbError);
      // Add to mock data if database insertion fails
      // Make sure activeUntil is not null before adding to mock data
      const safeGuardian = {
        ...newGuardian,
        activeUntil: newGuardian.activeUntil || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      };
      mockVetoGuardians.push(safeGuardian);
      res.status(201).json(newGuardian);
    }
  } catch (error) {
    console.error('Error creating veto guardian:', error);
    res.status(500).json({ error: 'Failed to create veto guardian' });
  }
};

/**
 * Update a veto guardian
 */
export const updateVetoGuardian = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isActive, name, description, activeUntil } = req.body;
    
    if (!id || isNaN(parseInt(id))) {
      res.status(400).json({ error: 'Invalid guardian ID' });
      return;
    }
    
    const guardianId = parseInt(id);
    
    let guardian;
    try {
      // Try to get from database first
      const result = await db.select().from(vetoGuardians).where(eq(vetoGuardians.id, guardianId));
      guardian = result[0];
    } catch (dbError) {
      console.warn('Database error finding guardian for update, using mock data:', dbError);
      // Find in mock data if database access fails
      guardian = mockVetoGuardians.find(g => g.id === guardianId);
    }
    
    // If guardian not found in DB, try mock data
    if (!guardian) {
      guardian = mockVetoGuardians.find(g => g.id === guardianId);
    }
    
    if (!guardian) {
      res.status(404).json({ error: 'Veto guardian not found' });
      return;
    }
    
    // Update fields only if provided
    const updateData: any = { updatedAt: new Date() };
    
    if (isActive !== undefined) updateData.isActive = isActive;
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (activeUntil !== undefined) updateData.activeUntil = activeUntil ? new Date(activeUntil) : null;
    
    try {
      // Try to update in database
      const updated = await db.update(vetoGuardians)
        .set(updateData)
        .where(eq(vetoGuardians.id, guardianId))
        .returning();
      
      res.status(200).json(updated[0]);
    } catch (dbError) {
      console.warn('Database error updating guardian, updating mock data:', dbError);
      
      // Update mock data if database update fails
      const index = mockVetoGuardians.findIndex(g => g.id === guardianId);
      
      if (index !== -1) {
        mockVetoGuardians[index] = {
          ...mockVetoGuardians[index],
          ...updateData,
          updatedAt: new Date()
        };
        
        res.status(200).json(mockVetoGuardians[index]);
      } else {
        res.status(404).json({ error: 'Veto guardian not found in mock data' });
      }
    }
  } catch (error) {
    console.error('Error updating veto guardian:', error);
    res.status(500).json({ error: 'Failed to update veto guardian' });
  }
};