import { Request, Response } from 'express';
import { db } from '../db';
import { vetoActions, vetoGuardians } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Create a new veto action
 */
export const createVetoAction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { guardianId, proposalId, reason } = req.body;
    
    if (!guardianId || !proposalId || !reason) {
      res.status(400).json({ error: 'Guardian ID, proposal ID, and reason are required' });
      return;
    }
    
    // Check if guardian exists and is active
    try {
      const result = await db.select().from(vetoGuardians).where(eq(vetoGuardians.id, guardianId));
      const guardian = result[0];
      
      if (!guardian) {
        res.status(404).json({ error: 'Veto guardian not found' });
        return;
      }
      
      if (!guardian.isActive) {
        res.status(403).json({ error: 'Veto guardian is not active' });
        return;
      }
    } catch (dbError) {
      console.error('Database error checking guardian:', dbError);
      res.status(500).json({ error: 'Failed to verify veto guardian' });
      return;
    }
    
    // Create veto action
    try {
      // Match the schema fields correctly
      const [vetoAction] = await db.insert(vetoActions).values({
        guardianId: guardianId,
        proposalId: proposalId,
        reason: reason,
        actionDate: new Date()
      }).returning();
      
      res.status(201).json(vetoAction);
    } catch (insertError) {
      console.error('Database error creating veto action:', insertError);
      res.status(500).json({ error: 'Failed to create veto action' });
    }
  } catch (error) {
    console.error('Error creating veto action:', error);
    res.status(500).json({ error: 'Failed to process veto action' });
  }
};

/**
 * Get veto actions for a proposal
 */
export const getVetoActionsByProposal = async (req: Request, res: Response): Promise<void> => {
  try {
    const { proposalId } = req.params;
    
    if (!proposalId) {
      res.status(400).json({ error: 'Proposal ID is required' });
      return;
    }
    
    const vetoActionsForProposal = await db.select().from(vetoActions)
      .where(eq(vetoActions.proposalId, proposalId));
    
    // Enrich with guardian information
    const enrichedActions = await Promise.all(
      vetoActionsForProposal.map(async (action) => {
        const [guardian] = await db.select().from(vetoGuardians)
          .where(eq(vetoGuardians.id, action.guardianId));
        
        return {
          ...action,
          guardian: guardian ? {
            id: guardian.id,
            name: guardian.name,
            address: guardian.address
          } : null
        };
      })
    );
    
    res.status(200).json(enrichedActions);
  } catch (error) {
    console.error('Error getting veto actions by proposal:', error);
    res.status(500).json({ error: 'Failed to fetch veto actions' });
  }
};

/**
 * Get veto actions by guardian
 */
export const getVetoActionsByGuardian = async (req: Request, res: Response): Promise<void> => {
  try {
    const { guardianId } = req.params;
    
    if (!guardianId || isNaN(parseInt(guardianId))) {
      res.status(400).json({ error: 'Valid guardian ID is required' });
      return;
    }
    
    const parsedGuardianId = parseInt(guardianId);
    
    const vetoActionsForGuardian = await db.select().from(vetoActions)
      .where(eq(vetoActions.guardianId, parsedGuardianId));
    
    res.status(200).json(vetoActionsForGuardian);
  } catch (error) {
    console.error('Error getting veto actions by guardian:', error);
    res.status(500).json({ error: 'Failed to fetch veto actions' });
  }
};