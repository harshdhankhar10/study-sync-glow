
import { db } from '@/lib/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  increment, 
  serverTimestamp, 
  Timestamp 
} from 'firebase/firestore';
import { differenceInCalendarDays } from 'date-fns';

// Type definitions for the streak data
export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: Timestamp | null;
  totalDaysStudied: number;
  milestones: Array<{
    streakDays: number;
    achieved: boolean;
    achievedAt?: Timestamp;
  }>;
  rewards: Array<{
    id: string;
    type: 'badge' | 'points' | 'unlockable';
    name: string;
    description: string;
    unlocked: boolean;
    unlockedAt?: Timestamp;
  }>;
}

// Default milestones for streak achievements
const DEFAULT_MILESTONES = [
  { streakDays: 3, achieved: false },
  { streakDays: 7, achieved: false },
  { streakDays: 14, achieved: false },
  { streakDays: 30, achieved: false },
  { streakDays: 60, achieved: false },
  { streakDays: 100, achieved: false },
];

// Default rewards that can be unlocked
const DEFAULT_REWARDS = [
  {
    id: 'badge-3day',
    type: 'badge' as const,
    name: 'Consistency Starter',
    description: 'Studied for 3 days in a row',
    unlocked: false,
  },
  {
    id: 'badge-7day',
    type: 'badge' as const,
    name: 'Week Warrior',
    description: 'Maintained a 7-day study streak',
    unlocked: false,
  },
  {
    id: 'badge-14day',
    type: 'badge' as const,
    name: 'Dedication Master',
    description: 'Maintained a 14-day study streak',
    unlocked: false,
  },
  {
    id: 'unlockable-themes',
    type: 'unlockable' as const,
    name: 'Custom Themes',
    description: 'Unlock custom themes for your dashboard',
    unlocked: false,
  },
  {
    id: 'unlockable-analytics',
    type: 'unlockable' as const,
    name: 'Advanced Analytics',
    description: 'Unlock advanced study analytics tools',
    unlocked: false,
  },
];

/**
 * Get or initialize a user's streak data
 */
export const getStreakData = async (userId: string): Promise<StreakData> => {
  if (!userId) {
    throw new Error('User ID is required to get streak data');
  }

  const streakRef = doc(db, 'streaks', userId);
  const streakDoc = await getDoc(streakRef);

  if (streakDoc.exists()) {
    return streakDoc.data() as StreakData;
  } else {
    // Initialize streak data for new users
    const initialData: StreakData = {
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: null,
      totalDaysStudied: 0,
      milestones: DEFAULT_MILESTONES,
      rewards: DEFAULT_REWARDS,
    };
    
    // Save the initial data
    await setDoc(streakRef, initialData);
    return initialData;
  }
};

/**
 * Record a study session and update streak data
 */
export const recordStudySession = async (userId: string): Promise<StreakData> => {
  if (!userId) {
    throw new Error('User ID is required to record a study session');
  }

  const streakRef = doc(db, 'streaks', userId);
  const streakDoc = await getDoc(streakRef);
  const today = Timestamp.now();
  
  if (!streakDoc.exists()) {
    // First time studying - initialize with a streak of 1
    const initialData: StreakData = {
      currentStreak: 1,
      longestStreak: 1,
      lastStudyDate: today,
      totalDaysStudied: 1,
      milestones: DEFAULT_MILESTONES,
      rewards: DEFAULT_REWARDS,
    };
    
    await setDoc(streakRef, initialData);
    return initialData;
  }
  
  const currentData = streakDoc.data() as StreakData;
  const lastStudyDate = currentData.lastStudyDate?.toDate();
  
  // If no previous study date, this is the first session
  if (!lastStudyDate) {
    const updatedData: StreakData = {
      ...currentData,
      currentStreak: 1,
      longestStreak: 1,
      lastStudyDate: today,
      totalDaysStudied: 1,
    };
    
    await setDoc(streakRef, updatedData);
    return updatedData;
  }
  
  // Calculate days since last study
  const daysSinceLastStudy = differenceInCalendarDays(
    today.toDate(),
    lastStudyDate
  );
  
  // Already studied today - don't increment streak
  if (daysSinceLastStudy === 0) {
    return currentData;
  }
  
  // Consecutive day - increment streak
  if (daysSinceLastStudy === 1) {
    const newStreak = currentData.currentStreak + 1;
    const newLongestStreak = Math.max(newStreak, currentData.longestStreak);
    
    // Check for milestones and update them
    const updatedMilestones = currentData.milestones.map(milestone => {
      if (!milestone.achieved && newStreak >= milestone.streakDays) {
        return {
          ...milestone,
          achieved: true,
          achievedAt: today,
        };
      }
      return milestone;
    });
    
    // Check for rewards to unlock
    const updatedRewards = currentData.rewards.map(reward => {
      // For the 3-day streak reward
      if (reward.id === 'badge-3day' && !reward.unlocked && newStreak >= 3) {
        return {
          ...reward,
          unlocked: true,
          unlockedAt: today,
        };
      }
      // For the 7-day streak reward
      if (reward.id === 'badge-7day' && !reward.unlocked && newStreak >= 7) {
        return {
          ...reward,
          unlocked: true,
          unlockedAt: today,
        };
      }
      // For the 14-day streak reward
      if (reward.id === 'badge-14day' && !reward.unlocked && newStreak >= 14) {
        return {
          ...reward,
          unlocked: true,
          unlockedAt: today,
        };
      }
      // For the themes unlockable at 30 days
      if (reward.id === 'unlockable-themes' && !reward.unlocked && newStreak >= 30) {
        return {
          ...reward,
          unlocked: true,
          unlockedAt: today,
        };
      }
      // For the analytics unlockable at 60 days
      if (reward.id === 'unlockable-analytics' && !reward.unlocked && newStreak >= 60) {
        return {
          ...reward,
          unlocked: true,
          unlockedAt: today,
        };
      }
      return reward;
    });
    
    const updatedData: StreakData = {
      ...currentData,
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      lastStudyDate: today,
      totalDaysStudied: currentData.totalDaysStudied + 1,
      milestones: updatedMilestones,
      rewards: updatedRewards,
    };
    
    await setDoc(streakRef, updatedData);
    return updatedData;
  }
  
  // Missed a day - reset streak to 1
  const updatedData: StreakData = {
    ...currentData,
    currentStreak: 1,
    lastStudyDate: today,
    totalDaysStudied: currentData.totalDaysStudied + 1,
  };
  
  await setDoc(streakRef, updatedData);
  return updatedData;
};

/**
 * Check if a user has a streak for today
 */
export const hasStudiedToday = async (userId: string): Promise<boolean> => {
  if (!userId) return false;

  const streakData = await getStreakData(userId);
  if (!streakData.lastStudyDate) return false;

  const lastStudyDate = streakData.lastStudyDate.toDate();
  const today = new Date();
  
  return (
    lastStudyDate.getDate() === today.getDate() &&
    lastStudyDate.getMonth() === today.getMonth() &&
    lastStudyDate.getFullYear() === today.getFullYear()
  );
};

/**
 * Get unlocked rewards for a user
 */
export const getUnlockedRewards = async (userId: string) => {
  const streakData = await getStreakData(userId);
  return streakData.rewards.filter(reward => reward.unlocked);
};
