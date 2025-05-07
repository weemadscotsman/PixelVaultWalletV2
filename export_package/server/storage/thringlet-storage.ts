import { ThringletEmotionState } from '@shared/types';
import * as fs from 'fs';
import * as path from 'path';

// Thringlet type for storage
export interface Thringlet {
  id: string;
  name: string;
  owner: string;
  createdAt: number;
  lastInteraction: number;
  emotionalState: ThringletEmotionState;
  level: number;
  experience: number;
  abilities: string[];
  visual: {
    baseColor: string;
    eyeColor: string;
    appendages: number;
    specialFeatures: string[];
  };
  stateHistory: {
    state: ThringletEmotionState;
    timestamp: number;
    trigger: string;
  }[];
}

// Serializable storage state
interface StorageState {
  thringlets: [string, Thringlet][];
}

// Path for persisting thringlet data
const DATA_FILE_PATH = './data/thringlet-data.json';

// In-memory thringlet data storage with file persistence
export class ThringletStorage {
  private thringlets: Map<string, Thringlet> = new Map();
  
  constructor() {
    // Create test data if empty
    this.loadFromFile();
    this.addTestThringlets();
  }
  
  // Add some test thringlets
  private addTestThringlets() {
    if (this.thringlets.size === 0) {
      const testThringlet1: Thringlet = {
        id: "test-thringlet-1",
        name: "Nebula",
        owner: "PVX_1e1ee32c2770a6af3ca119759c539907",
        createdAt: Date.now(),
        lastInteraction: Date.now(),
        emotionalState: ThringletEmotionState.HAPPY,
        level: 3,
        experience: 250,
        abilities: ['basic_movement', 'teleport'],
        visual: {
          baseColor: 'purple',
          eyeColor: 'teal',
          appendages: 4,
          specialFeatures: ['glowing_eyes', 'crystal_growths']
        },
        stateHistory: [{
          state: ThringletEmotionState.NEUTRAL,
          timestamp: Date.now() - 86400000,
          trigger: 'creation'
        }, {
          state: ThringletEmotionState.HAPPY,
          timestamp: Date.now(),
          trigger: 'user interaction'
        }]
      };
      
      const testThringlet2: Thringlet = {
        id: "test-thringlet-2",
        name: "Spark",
        owner: "PVX_f5ba480b7db6010eecb453eca8e67ff0",
        createdAt: Date.now() - 172800000,
        lastInteraction: Date.now() - 36000000,
        emotionalState: ThringletEmotionState.EXCITED,
        level: 5,
        experience: 490,
        abilities: ['basic_movement', 'invisibility', 'energy_burst'],
        visual: {
          baseColor: 'orange',
          eyeColor: 'blue',
          appendages: 6,
          specialFeatures: ['smoke', 'wings']
        },
        stateHistory: [{
          state: ThringletEmotionState.NEUTRAL,
          timestamp: Date.now() - 172800000,
          trigger: 'creation'
        }, {
          state: ThringletEmotionState.EXCITED,
          timestamp: Date.now() - 36000000,
          trigger: 'level up'
        }]
      };
      
      this.thringlets.set(testThringlet1.id, testThringlet1);
      this.thringlets.set(testThringlet2.id, testThringlet2);
      
      // Save the test data
      this.saveToFile();
    }
  }
  
  // Save data to file
  private async saveToFile() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(DATA_FILE_PATH);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Prepare data for serialization
      const data: StorageState = {
        thringlets: Array.from(this.thringlets.entries())
      };
      
      // Write to file
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2));
      console.log("Thringlet data saved to file");
    } catch (error) {
      console.error("Failed to save thringlet data:", error);
    }
  }
  
  // Load data from file
  private loadFromFile() {
    try {
      if (fs.existsSync(DATA_FILE_PATH)) {
        const data = JSON.parse(fs.readFileSync(DATA_FILE_PATH, 'utf8')) as StorageState;
        
        // Restore thringlets
        this.thringlets = new Map(data.thringlets || []);
        
        console.log("Thringlet data loaded from file");
      } else {
        console.log("No thringlet data file found, starting with empty state");
      }
    } catch (error) {
      console.error("Failed to load thringlet data:", error);
    }
  }
  
  // Thringlet methods
  async getThringlet(id: string): Promise<Thringlet | undefined> {
    return this.thringlets.get(id);
  }
  
  async getAllThringlets(): Promise<Thringlet[]> {
    return Array.from(this.thringlets.values());
  }
  
  async createThringlet(thringlet: Thringlet): Promise<Thringlet> {
    this.thringlets.set(thringlet.id, thringlet);
    await this.saveToFile();
    return thringlet;
  }
  
  async updateThringlet(id: string, updates: Partial<Thringlet>): Promise<Thringlet | undefined> {
    const thringlet = this.thringlets.get(id);
    if (!thringlet) return undefined;
    
    const updatedThringlet = { ...thringlet, ...updates };
    this.thringlets.set(id, updatedThringlet);
    await this.saveToFile();
    return updatedThringlet;
  }
  
  async deleteThringlet(id: string): Promise<boolean> {
    const success = this.thringlets.delete(id);
    if (success) {
      await this.saveToFile();
    }
    return success;
  }
  
  async getThringletsByOwner(ownerAddress: string): Promise<Thringlet[]> {
    return Array.from(this.thringlets.values()).filter(t => t.owner === ownerAddress);
  }
}

// Export singleton instance
export const thringletStorage = new ThringletStorage();