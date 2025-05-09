import { eq, and } from 'drizzle-orm';
import { db } from './index';
import { learningModules, learningQuestions, userLearningProgress } from './schema';
import { LearningModule, LearningQuestion, UserLearningProgress } from '@shared/types';

/**
 * Data access object for learning modules, questions, and user progress
 */
export class LearningDao {
  /**
   * Create a new learning module
   * @param module Learning module to create
   * @returns Created learning module
   */
  async createLearningModule(module: LearningModule): Promise<LearningModule> {
    try {
      // Convert module to database format
      const dbModule = {
        id: module.id,
        title: module.title,
        description: module.description,
        difficulty: module.difficulty,
        type: module.type,
        xpReward: module.xpReward,
        tokenReward: module.tokenReward,
        badgeId: module.badgeId,
        completionCriteria: module.completionCriteria
      };

      // Insert module
      await db.insert(learningModules).values(dbModule);
      
      // Return original module
      return module;
    } catch (error) {
      console.error('Error creating learning module:', error);
      throw new Error('Failed to create learning module');
    }
  }

  /**
   * Get learning module by ID
   * @param id Learning module ID
   * @returns Learning module or undefined if not found
   */
  async getLearningModuleById(id: string): Promise<LearningModule | undefined> {
    try {
      const result = await db.select()
        .from(learningModules)
        .where(eq(learningModules.id, id))
        .limit(1);
      
      if (result.length === 0) {
        return undefined;
      }
      
      // Convert database format to LearningModule
      const dbModule = result[0];
      return {
        id: dbModule.id,
        title: dbModule.title,
        description: dbModule.description,
        difficulty: dbModule.difficulty,
        type: dbModule.type,
        xpReward: dbModule.xpReward,
        tokenReward: dbModule.tokenReward,
        badgeId: dbModule.badgeId ?? undefined,
        completionCriteria: dbModule.completionCriteria,
        questions: await this.getQuestionsByModuleId(dbModule.id)
      };
    } catch (error) {
      console.error('Error getting learning module by ID:', error);
      throw new Error('Failed to get learning module');
    }
  }

  /**
   * Get all learning modules
   * @returns Array of learning modules
   */
  async getAllLearningModules(): Promise<LearningModule[]> {
    try {
      const result = await db.select().from(learningModules);
      
      // Convert database format to LearningModule[]
      const modules: LearningModule[] = [];
      for (const dbModule of result) {
        const questions = await this.getQuestionsByModuleId(dbModule.id);
        modules.push({
          id: dbModule.id,
          title: dbModule.title,
          description: dbModule.description,
          difficulty: dbModule.difficulty,
          type: dbModule.type,
          xpReward: dbModule.xpReward,
          tokenReward: dbModule.tokenReward,
          badgeId: dbModule.badgeId ?? undefined,
          completionCriteria: dbModule.completionCriteria,
          questions
        });
      }
      
      return modules;
    } catch (error) {
      console.error('Error getting all learning modules:', error);
      throw new Error('Failed to get learning modules');
    }
  }

  /**
   * Create a new learning question
   * @param question Learning question to create
   * @returns Created learning question
   */
  async createLearningQuestion(question: LearningQuestion): Promise<LearningQuestion> {
    try {
      // Convert question to database format
      const dbQuestion = {
        id: question.id,
        moduleId: question.moduleId,
        text: question.text,
        options: question.options,
        correctOption: question.correctOption,
        explanation: question.explanation
      };

      // Insert question
      await db.insert(learningQuestions).values(dbQuestion);
      
      // Return original question
      return question;
    } catch (error) {
      console.error('Error creating learning question:', error);
      throw new Error('Failed to create learning question');
    }
  }

  /**
   * Get learning questions by module ID
   * @param moduleId Learning module ID
   * @returns Array of learning questions
   */
  async getQuestionsByModuleId(moduleId: string): Promise<LearningQuestion[]> {
    try {
      const result = await db.select()
        .from(learningQuestions)
        .where(eq(learningQuestions.moduleId, moduleId));
      
      // Convert database format to LearningQuestion[]
      return result.map(dbQuestion => ({
        id: dbQuestion.id,
        moduleId: dbQuestion.moduleId,
        text: dbQuestion.text,
        options: dbQuestion.options,
        correctOption: dbQuestion.correctOption,
        explanation: dbQuestion.explanation
      }));
    } catch (error) {
      console.error('Error getting questions by module ID:', error);
      throw new Error('Failed to get learning questions');
    }
  }

  /**
   * Create or update user learning progress
   * @param progress User learning progress to create or update
   * @returns Created or updated user learning progress
   */
  async createOrUpdateUserProgress(progress: UserLearningProgress): Promise<UserLearningProgress> {
    try {
      // Check if progress exists
      const existingProgress = await this.getUserProgressByModuleId(progress.userId, progress.moduleId);
      
      // Convert progress to database format
      const dbProgress = {
        userId: progress.userId,
        moduleId: progress.moduleId,
        completed: progress.completed,
        score: progress.score,
        attemptsCount: progress.attemptsCount,
        lastAttemptDate: BigInt(progress.lastAttemptDate),
        rewardsClaimed: progress.rewardsClaimed
      };

      if (!existingProgress) {
        // Insert progress
        await db.insert(userLearningProgress).values(dbProgress);
      } else {
        // Update progress
        await db.update(userLearningProgress)
          .set(dbProgress)
          .where(
            and(
              eq(userLearningProgress.userId, progress.userId),
              eq(userLearningProgress.moduleId, progress.moduleId)
            )
          );
      }
      
      // Return progress
      return progress;
    } catch (error) {
      console.error('Error creating or updating user learning progress:', error);
      throw new Error('Failed to create or update user learning progress');
    }
  }

  /**
   * Get user learning progress by module ID
   * @param userId User ID
   * @param moduleId Learning module ID
   * @returns User learning progress or undefined if not found
   */
  async getUserProgressByModuleId(userId: string, moduleId: string): Promise<UserLearningProgress | undefined> {
    try {
      const result = await db.select()
        .from(userLearningProgress)
        .where(
          and(
            eq(userLearningProgress.userId, userId),
            eq(userLearningProgress.moduleId, moduleId)
          )
        )
        .limit(1);
      
      if (result.length === 0) {
        return undefined;
      }
      
      // Convert database format to UserLearningProgress
      const dbProgress = result[0];
      return {
        userId: dbProgress.userId,
        moduleId: dbProgress.moduleId,
        completed: dbProgress.completed,
        score: dbProgress.score,
        attemptsCount: dbProgress.attemptsCount,
        lastAttemptDate: Number(dbProgress.lastAttemptDate),
        rewardsClaimed: dbProgress.rewardsClaimed
      };
    } catch (error) {
      console.error('Error getting user progress by module ID:', error);
      throw new Error('Failed to get user learning progress');
    }
  }

  /**
   * Get all user learning progress
   * @param userId User ID
   * @returns Array of user learning progress
   */
  async getAllUserProgress(userId: string): Promise<UserLearningProgress[]> {
    try {
      const result = await db.select()
        .from(userLearningProgress)
        .where(eq(userLearningProgress.userId, userId));
      
      // Convert database format to UserLearningProgress[]
      return result.map(dbProgress => ({
        userId: dbProgress.userId,
        moduleId: dbProgress.moduleId,
        completed: dbProgress.completed,
        score: dbProgress.score,
        attemptsCount: dbProgress.attemptsCount,
        lastAttemptDate: Number(dbProgress.lastAttemptDate),
        rewardsClaimed: dbProgress.rewardsClaimed
      }));
    } catch (error) {
      console.error('Error getting all user progress:', error);
      throw new Error('Failed to get user learning progress');
    }
  }

  /**
   * Get completed modules for a user
   * @param userId User ID
   * @returns Array of user learning progress for completed modules
   */
  async getCompletedModules(userId: string): Promise<UserLearningProgress[]> {
    try {
      const result = await db.select()
        .from(userLearningProgress)
        .where(
          and(
            eq(userLearningProgress.userId, userId),
            eq(userLearningProgress.completed, true)
          )
        );
      
      // Convert database format to UserLearningProgress[]
      return result.map(dbProgress => ({
        userId: dbProgress.userId,
        moduleId: dbProgress.moduleId,
        completed: dbProgress.completed,
        score: dbProgress.score,
        attemptsCount: dbProgress.attemptsCount,
        lastAttemptDate: Number(dbProgress.lastAttemptDate),
        rewardsClaimed: dbProgress.rewardsClaimed
      }));
    } catch (error) {
      console.error('Error getting completed modules:', error);
      throw new Error('Failed to get completed modules');
    }
  }

  /**
   * Mark learning module rewards as claimed
   * @param userId User ID
   * @param moduleId Learning module ID
   * @returns Updated user learning progress
   */
  async markRewardsAsClaimed(userId: string, moduleId: string): Promise<UserLearningProgress | undefined> {
    try {
      // Get existing progress
      const progress = await this.getUserProgressByModuleId(userId, moduleId);
      if (!progress || !progress.completed) {
        return undefined;
      }
      
      // Update rewards claimed flag
      progress.rewardsClaimed = true;
      
      // Save progress
      return await this.createOrUpdateUserProgress(progress);
    } catch (error) {
      console.error('Error marking rewards as claimed:', error);
      throw new Error('Failed to mark rewards as claimed');
    }
  }

  /**
   * Record a learning module attempt
   * @param userId User ID
   * @param moduleId Learning module ID
   * @param score Score achieved
   * @param completed Whether the module was completed
   * @returns Updated user learning progress
   */
  async recordModuleAttempt(
    userId: string,
    moduleId: string,
    score: number,
    completed: boolean
  ): Promise<UserLearningProgress> {
    try {
      // Get existing progress or create new
      let progress = await this.getUserProgressByModuleId(userId, moduleId);
      if (!progress) {
        progress = {
          userId,
          moduleId,
          completed: false,
          score: 0,
          attemptsCount: 0,
          lastAttemptDate: 0,
          rewardsClaimed: false
        };
      }
      
      // Update progress
      progress.score = Math.max(progress.score, score);
      progress.attemptsCount++;
      progress.lastAttemptDate = Date.now();
      
      // Update completed flag
      if (completed && !progress.completed) {
        progress.completed = true;
      }
      
      // Save progress
      return await this.createOrUpdateUserProgress(progress);
    } catch (error) {
      console.error('Error recording module attempt:', error);
      throw new Error('Failed to record module attempt');
    }
  }
}

// Create a singleton instance
export const learningDao = new LearningDao();