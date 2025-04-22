import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, orderBy, limit as firestoreLimit, Timestamp, increment, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { StreakData } from './streakService';

// Types for the gamification system
export interface UserPoints {
  total: number;
  sessionAttendance: number;
  goalCompletion: number;
  streakMaintenance: number;
  helpingPeers: number;
  resourceSharing: number;
  quizCompletion: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  earnedAt?: Timestamp;
  category: 'attendance' | 'streak' | 'goals' | 'helping' | 'quizzes' | 'general';
  requirement: number; // e.g., attend 5 sessions, maintain 7-day streak
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  photoURL?: string;
  points: number;
  badges: number;
  rank?: number;
}

export interface GamificationProfile {
  userId: string;
  displayName: string;
  photoURL?: string;
  points: UserPoints;
  level: number;
  nextLevelPoints: number;
  badges: Badge[];
  lastUpdated: Timestamp;
}

// Default badges that can be earned
const DEFAULT_BADGES: Badge[] = [
  {
    id: 'session-starter',
    name: 'Session Starter',
    description: 'Attend your first study session',
    imageUrl: '/badges/session-starter.png',
    category: 'attendance',
    requirement: 1
  },
  {
    id: 'session-regular',
    name: 'Regular Attendee',
    description: 'Attend 5 study sessions',
    imageUrl: '/badges/session-regular.png',
    category: 'attendance',
    requirement: 5
  },
  {
    id: 'session-expert',
    name: 'Session Expert',
    description: 'Attend 20 study sessions',
    imageUrl: '/badges/session-expert.png',
    category: 'attendance',
    requirement: 20
  },
  {
    id: 'streak-3day',
    name: 'Consistency Starter',
    description: 'Maintain a 3-day study streak',
    imageUrl: '/badges/streak-3.png',
    category: 'streak',
    requirement: 3
  },
  {
    id: 'streak-7day',
    name: 'Week Warrior',
    description: 'Maintain a 7-day study streak',
    imageUrl: '/badges/streak-7.png',
    category: 'streak',
    requirement: 7
  },
  {
    id: 'streak-30day',
    name: 'Monthly Master',
    description: 'Maintain a 30-day study streak',
    imageUrl: '/badges/streak-30.png',
    category: 'streak',
    requirement: 30
  },
  {
    id: 'goal-starter',
    name: 'Goal Setter',
    description: 'Complete your first goal',
    imageUrl: '/badges/goal-starter.png',
    category: 'goals',
    requirement: 1
  },
  {
    id: 'goal-achiever',
    name: 'Goal Achiever',
    description: 'Complete 5 goals',
    imageUrl: '/badges/goal-achiever.png',
    category: 'goals',
    requirement: 5
  },
  {
    id: 'helping-hand',
    name: 'Helping Hand',
    description: 'Help a peer with their studies',
    imageUrl: '/badges/helping-hand.png',
    category: 'helping',
    requirement: 1
  },
  {
    id: 'community-pillar',
    name: 'Community Pillar',
    description: 'Help 10 peers with their studies',
    imageUrl: '/badges/community-pillar.png',
    category: 'helping',
    requirement: 10
  },
  {
    id: 'quiz-taker',
    name: 'Quiz Taker',
    description: 'Complete your first quiz',
    imageUrl: '/badges/quiz-taker.png',
    category: 'quizzes',
    requirement: 1
  },
  {
    id: 'quiz-master',
    name: 'Quiz Master',
    description: 'Score 100% on 5 quizzes',
    imageUrl: '/badges/quiz-master.png',
    category: 'quizzes',
    requirement: 5
  }
];

const calculateLevel = (points: number): { level: number, nextLevelPoints: number } => {
  const level = Math.floor(points / 100) + 1;
  const nextLevelPoints = level * 100;
  return { level, nextLevelPoints };
};

export const getGamificationProfile = async (userId: string): Promise<GamificationProfile> => {
  if (!userId) {
    throw new Error('User ID is required to get gamification profile');
  }

  try {
    const profileRef = doc(db, 'gamification', userId);
    const profileDoc = await getDoc(profileRef);
    
    if (profileDoc.exists()) {
      return profileDoc.data() as GamificationProfile;
    } else {
      const userRef = doc(db, 'profiles', userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.exists() ? userDoc.data() : null;
      
      const initialPoints: UserPoints = {
        total: 0,
        sessionAttendance: 0,
        goalCompletion: 0,
        streakMaintenance: 0,
        helpingPeers: 0,
        resourceSharing: 0,
        quizCompletion: 0
      };
      
      const levelInfo = calculateLevel(initialPoints.total);
      
      const initialProfile: GamificationProfile = {
        userId,
        displayName: userData?.fullName || 'User',
        photoURL: userData?.photoURL || '',
        points: initialPoints,
        level: levelInfo.level,
        nextLevelPoints: levelInfo.nextLevelPoints,
        badges: DEFAULT_BADGES.map(badge => ({ ...badge })),
        lastUpdated: Timestamp.now()
      };
      
      await setDoc(profileRef, initialProfile);
      return initialProfile;
    }
  } catch (error) {
    console.error('Error getting gamification profile:', error);
    throw error;
  }
};

export const awardPoints = async (
  userId: string, 
  category: keyof UserPoints, 
  amount: number,
  reason?: string
): Promise<GamificationProfile> => {
  if (!userId) {
    throw new Error('User ID is required to award points');
  }

  try {
    const profileRef = doc(db, 'gamification', userId);
    const profile = await getGamificationProfile(userId);
    
    const updatedPoints = {
      ...profile.points,
      [category]: profile.points[category] + amount,
      total: profile.points.total + amount
    };
    
    const { level, nextLevelPoints } = calculateLevel(updatedPoints.total);
    
    const leveledUp = level > profile.level;
    
    const updatedProfile: GamificationProfile = {
      ...profile,
      points: updatedPoints,
      level,
      nextLevelPoints,
      lastUpdated: Timestamp.now()
    };
    
    await updateDoc(profileRef, {
      points: updatedPoints,
      level,
      nextLevelPoints,
      lastUpdated: Timestamp.now()
    });
    
    await logPointActivity(userId, category, amount, reason);
    
    if (leveledUp) {
      await logLevelUpActivity(userId, level);
    }
    
    return updatedProfile;
  } catch (error) {
    console.error('Error awarding points:', error);
    throw error;
  }
};

export const awardBadge = async (userId: string, badgeId: string): Promise<Badge | null> => {
  if (!userId || !badgeId) {
    throw new Error('User ID and badge ID are required to award a badge');
  }

  try {
    const profile = await getGamificationProfile(userId);
    const badgeIndex = profile.badges.findIndex(b => b.id === badgeId);
    
    if (badgeIndex === -1) {
      console.error(`Badge ${badgeId} not found in user's profile`);
      return null;
    }
    
    if (profile.badges[badgeIndex].earnedAt) {
      return profile.badges[badgeIndex];
    }
    
    const updatedBadge = {
      ...profile.badges[badgeIndex],
      earnedAt: Timestamp.now()
    };
    
    const updatedBadges = [...profile.badges];
    updatedBadges[badgeIndex] = updatedBadge;
    
    const profileRef = doc(db, 'gamification', userId);
    await updateDoc(profileRef, {
      badges: updatedBadges,
      lastUpdated: Timestamp.now()
    });
    
    await logBadgeActivity(userId, updatedBadge);
    
    return updatedBadge;
  } catch (error) {
    console.error('Error awarding badge:', error);
    throw error;
  }
};

export const getLeaderboard = async (groupId?: string, limitCount = 10): Promise<LeaderboardEntry[]> => {
  try {
    let leaderboardData: LeaderboardEntry[] = [];
    
    if (groupId) {
      const membershipsRef = collection(db, 'groupMemberships');
      const memberQuery = query(membershipsRef, where('groupId', '==', groupId));
      const memberSnapshot = await getDocs(memberQuery);
      
      const memberIds = memberSnapshot.docs.map(doc => doc.data().userId).filter(id => !!id);
      
      const gamificationPromises = memberIds.map(async (userId) => {
        try {
          const profile = await getGamificationProfile(userId);
          return {
            userId: profile.userId,
            displayName: profile.displayName,
            photoURL: profile.photoURL,
            points: profile.points.total,
            badges: profile.badges.filter(b => b.earnedAt).length,
          } as LeaderboardEntry;
        } catch (error) {
          console.error(`Error getting gamification profile for user ${userId}:`, error);
          return null;
        }
      });
      
      const results = await Promise.all(gamificationPromises);
      leaderboardData = results.filter(entry => entry !== null) as LeaderboardEntry[];
    } else {
      const gamificationRef = collection(db, 'gamification');
      const leaderQuery = query(gamificationRef, orderBy('points.total', 'desc'), firestoreLimit(limitCount));
      const leaderSnapshot = await getDocs(leaderQuery);
      
      leaderboardData = leaderSnapshot.docs.map((doc, index) => {
        const data = doc.data() as GamificationProfile;
        return {
          userId: data.userId,
          displayName: data.displayName,
          photoURL: data.photoURL,
          points: data.points.total,
          badges: data.badges.filter(b => b.earnedAt).length,
          rank: index + 1
        };
      });
    }
    
    leaderboardData.sort((a, b) => b.points - a.points);
    
    leaderboardData.forEach((entry, index) => {
      entry.rank = index + 1;
    });
    
    return leaderboardData;
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    throw error;
  }
};

const logPointActivity = async (
  userId: string, 
  category: keyof UserPoints, 
  amount: number, 
  reason?: string
) => {
  try {
    const activityRef = collection(db, 'activity');
    await setDoc(doc(activityRef), {
      userId,
      type: 'points',
      category,
      amount,
      reason: reason || `Earned ${amount} points in ${category}`,
      timestamp: Timestamp.now()
    });
  } catch (error) {
    console.error('Error logging point activity:', error);
  }
};

const logBadgeActivity = async (userId: string, badge: Badge) => {
  try {
    const activityRef = collection(db, 'activity');
    await setDoc(doc(activityRef), {
      userId,
      type: 'badge',
      badgeId: badge.id,
      badgeName: badge.name,
      badgeCategory: badge.category,
      timestamp: Timestamp.now(),
      title: `Earned the "${badge.name}" badge`,
      details: badge.description
    });
  } catch (error) {
    console.error('Error logging badge activity:', error);
  }
};

const logLevelUpActivity = async (userId: string, newLevel: number) => {
  try {
    const activityRef = collection(db, 'activity');
    await setDoc(doc(activityRef), {
      userId,
      type: 'level_up',
      newLevel,
      timestamp: Timestamp.now(),
      title: `Reached Level ${newLevel}`,
      details: `Congratulations! You've reached level ${newLevel}.`
    });
  } catch (error) {
    console.error('Error logging level up activity:', error);
  }
};

export const checkAndAwardStreakBadges = async (userId: string, streakData: StreakData) => {
  try {
    const currentStreak = streakData.currentStreak;
    
    const streakBadges = [
      { id: 'streak-3day', requirement: 3 },
      { id: 'streak-7day', requirement: 7 },
      { id: 'streak-30day', requirement: 30 }
    ];
    
    await awardPoints(
      userId, 
      'streakMaintenance', 
      5, 
      `Maintained a ${currentStreak}-day study streak`
    );
    
    for (const badge of streakBadges) {
      if (currentStreak >= badge.requirement) {
        await awardBadge(userId, badge.id);
      }
    }
  } catch (error) {
    console.error('Error checking streak badges:', error);
  }
};

export const awardSessionPoints = async (userId: string, sessionLength: number) => {
  try {
    const points = Math.min(Math.floor(sessionLength / 15) * 5, 30);
    const updated = await awardPoints(
      userId,
      'sessionAttendance',
      points,
      `Attended a ${sessionLength} minute study session`
    );
    
    const sessionCounts = {
      1: 'session-starter',
      5: 'session-regular',
      20: 'session-expert'
    };
    
    const estimatedSessions = Math.floor(updated.points.sessionAttendance / 15);
    
    Object.entries(sessionCounts).forEach(([count, badgeId]) => {
      if (estimatedSessions >= parseInt(count)) {
        awardBadge(userId, badgeId).catch(console.error);
      }
    });
    
    return updated;
  } catch (error) {
    console.error('Error awarding session points:', error);
    throw error;
  }
};

export const awardGoalCompletionPoints = async (userId: string, goalDifficulty: 'easy' | 'medium' | 'hard' = 'medium') => {
  try {
    const pointsMap = {
      'easy': 10,
      'medium': 20,
      'hard': 30
    };
    
    const points = pointsMap[goalDifficulty];
    
    const updated = await awardPoints(
      userId,
      'goalCompletion',
      points,
      `Completed a ${goalDifficulty} study goal`
    );
    
    const goalCounts = {
      1: 'goal-starter',
      5: 'goal-achiever'
    };
    
    const estimatedGoals = Math.floor(updated.points.goalCompletion / 20);
    
    Object.entries(goalCounts).forEach(([count, badgeId]) => {
      if (estimatedGoals >= parseInt(count)) {
        awardBadge(userId, badgeId).catch(console.error);
      }
    });
    
    return updated;
  } catch (error) {
    console.error('Error awarding goal completion points:', error);
    throw error;
  }
};

export const awardHelpingPeersPoints = async (userId: string, helpType: 'question' | 'resource' | 'explanation' = 'question') => {
  try {
    const pointsMap = {
      'question': 5,
      'resource': 10,
      'explanation': 15
    };
    
    const points = pointsMap[helpType];
    
    const updated = await awardPoints(
      userId,
      'helpingPeers',
      points,
      `Helped a peer with a ${helpType}`
    );
    
    const helpingCounts = {
      1: 'helping-hand',
      10: 'community-pillar'
    };
    
    const estimatedHelps = Math.floor(updated.points.helpingPeers / 10);
    
    Object.entries(helpingCounts).forEach(([count, badgeId]) => {
      if (estimatedHelps >= parseInt(count)) {
        awardBadge(userId, badgeId).catch(console.error);
      }
    });
    
    return updated;
  } catch (error) {
    console.error('Error awarding helping peers points:', error);
    throw error;
  }
};

export const getEarnedBadges = async (userId: string): Promise<Badge[]> => {
  try {
    const profile = await getGamificationProfile(userId);
    return profile.badges.filter(badge => badge.earnedAt);
  } catch (error) {
    console.error('Error getting earned badges:', error);
    throw error;
  }
};
