
import { getFirestore, collection, addDoc, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const GEMINI_API_KEY = "AIzaSyDSRbZYHWLdncHiadycyFvKyyuMu_BPIv8";
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

interface TimeSlot {
  day: string;
  time: string;
  selected: boolean;
}

interface Profile {
  fullName?: string;
  major?: string;
  school?: string;
  year?: string;
}

interface StudySession {
  title: string;
  description: string;
  date: Date;
  startTime: string;
  endTime: string;
  participants: string[];
  topic: string;
  location: string;
  isAiGenerated: boolean;
}

export async function generateStudyPlan(userId: string, availabilitySlots: TimeSlot[]) {
  try {
    // Get user profile data
    const profileRef = doc(db, 'profiles', userId);
    const profileSnap = await getDoc(profileRef);
    const profileData = profileSnap.exists() ? profileSnap.data() as Profile : null;

    // Get user's skills and interests
    let skills: string[] = [];
    try {
      const skillsRef = doc(db, 'skills', userId);
      const skillsSnap = await getDoc(skillsRef);
      if (skillsSnap.exists()) {
        skills = skillsSnap.data()?.skills || [];
      }
    } catch (error) {
      console.error("Error fetching skills:", error);
    }

    // Get user's learning goals
    let goals: string[] = [];
    try {
      const goalsRef = doc(db, 'goals', userId);
      const goalsSnap = await getDoc(goalsRef);
      if (goalsSnap.exists()) {
        goals = goalsSnap.data()?.goals || [];
      }
    } catch (error) {
      console.error("Error fetching goals:", error);
    }

    // Filter selected time slots
    const selectedSlots = availabilitySlots.filter(slot => slot.selected);
    
    // Check if there are any available slots
    if (selectedSlots.length === 0) {
      throw new Error("No available time slots found");
    }

    // Get existing study sessions
    const sessionsRef = collection(db, 'studySessions');
    const q = query(sessionsRef, where('participants', 'array-contains', userId));
    const querySnapshot = await getDocs(q);
    const existingSessions = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        title: data.title,
        date: data.date.toDate(),
        startTime: data.startTime,
        endTime: data.endTime
      };
    });

    // Format data for AI
    const prompt = {
      availability: selectedSlots,
      profile: profileData,
      skills: skills,
      goals: goals,
      existingSessions: existingSessions,
    };

    // Make API call to Gemini
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Generate a personalized study plan based on the following user data:
                
                User Profile: ${JSON.stringify(profileData)}
                Skills/Interests: ${JSON.stringify(skills)}
                Learning Goals: ${JSON.stringify(goals)}
                Available Time Slots: ${JSON.stringify(selectedSlots.map(slot => `${slot.day} at ${slot.time}`))}
                Existing Study Sessions: ${JSON.stringify(existingSessions)}
                
                Create 3-5 study sessions for the next two weeks. For each session, include:
                1. Session title (brief but descriptive)
                2. Session description (1-2 sentences)
                3. Day and date (within next 14 days)
                4. Start and end time (1-2 hours duration, must be within available time slots)
                5. Topic (specific subject to study)
                6. Location (e.g., "Online", "Library", "Study room")
                
                Return ONLY valid JSON that matches this structure exactly:
                {
                  "studySessions": [
                    {
                      "title": "string",
                      "description": "string",
                      "day": "string",
                      "date": "YYYY-MM-DD",
                      "startTime": "HH:MM",
                      "endTime": "HH:MM",
                      "topic": "string",
                      "location": "string"
                    }
                  ]
                }`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract the JSON from the text response
    let jsonText = data.candidates[0].content.parts[0].text;
    
    // Find JSON content (between curly braces)
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse AI response");
    }
    
    const jsonData = JSON.parse(jsonMatch[0]);
    
    // Create study sessions in Firestore
    if (jsonData.studySessions && Array.isArray(jsonData.studySessions)) {
      const now = new Date();
      for (const session of jsonData.studySessions) {
        // Convert date string to Date object
        const sessionDate = new Date(session.date);
        
        // Create session document
        await addDoc(collection(db, 'studySessions'), {
          title: session.title,
          description: session.description,
          date: sessionDate,
          startTime: session.startTime,
          endTime: session.endTime,
          topic: session.topic,
          location: session.location,
          participants: [userId],
          createdAt: now,
          isAiGenerated: true,
        });
      }
      
      return jsonData.studySessions;
    } else {
      throw new Error("Invalid response format from AI");
    }
    
  } catch (error: any) {
    console.error("Error generating study plan:", error);
    throw new Error(`Failed to generate study plan: ${error.message}`);
  }
}

export async function generateNoteSummary(noteContent: string, title: string): Promise<string> {
  try {
    // Make API call to Gemini
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Summarize the following note titled "${title}" into key points and main ideas:
                
                ${noteContent}
                
                Format the summary as a concise list of the most important points. 
                Focus on clarity and preserving the most essential information.
                The summary should be no longer than 30% of the original text.`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const summaryText = data.candidates[0].content.parts[0].text;
    
    return summaryText;
    
  } catch (error: any) {
    console.error("Error generating note summary:", error);
    throw new Error(`Failed to generate summary: ${error.message}`);
  }
}

interface GroupMatch {
  groupId: string;
  groupName: string;
  matchScore: number;
  reasonsForMatch: string[];
}

export async function generateGroupMatches(
  userId: string,
  skillsData: any,
  goalsData: any,
  profileData: any
): Promise<GroupMatch[]> {
  try {
    // Get all public study groups
    const groupsRef = collection(db, 'studyGroups');
    const groupsQuery = query(groupsRef, where('isPublic', '==', true));
    const groupsSnapshot = await getDocs(groupsQuery);
    
    const groups = groupsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Skip if no groups found
    if (groups.length === 0) {
      return [];
    }
    
    // Get existing memberships to filter out groups user is already in
    const membershipsRef = collection(db, 'groupMemberships');
    const membershipQuery = query(
      membershipsRef,
      where('userId', '==', userId)
    );
    const membershipDocs = await getDocs(membershipQuery);
    const userGroupIds = membershipDocs.docs.map(doc => doc.data().groupId);
    
    // Filter out groups user already belongs to
    const availableGroups = groups.filter(group => !userGroupIds.includes(group.id));
    
    if (availableGroups.length === 0) {
      return [];
    }
    
    // Prepare user data for AI matching
    const userData = {
      skills: skillsData?.skills || [],
      interests: skillsData?.interests || [],
      subjects: skillsData?.subjects || [],
      goals: goalsData?.goals || [],
      major: profileData?.major || '',
      school: profileData?.school || '',
      year: profileData?.year || ''
    };
    
    // Make API call to Gemini for group matching
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Match a student with suitable study groups based on the following data:
                
                Student Information:
                - Skills: ${JSON.stringify(userData.skills)}
                - Interests: ${JSON.stringify(userData.interests)}
                - Subjects: ${JSON.stringify(userData.subjects)}
                - Learning Goals: ${JSON.stringify(userData.goals)}
                - Major: ${userData.major}
                - School: ${userData.school}
                - Year: ${userData.year}
                
                Available Study Groups:
                ${availableGroups.map(group => `
                Group ID: ${group.id}
                Group Name: ${group.name}
                Subject: ${group.subject || 'Not specified'}
                Purpose: ${group.purpose || 'General study'}
                Description: ${group.description || 'No description'}
                `).join("\n")}
                
                For each group, calculate a match score (0.0 to 1.0) based on compatibility with the student's profile.
                Provide 2-3 specific reasons why each group would be a good match.
                Only include groups with a match score of 0.5 or higher.
                Limit to top 5 matches.
                
                Return ONLY a valid JSON array in this format:
                [
                  {
                    "groupId": "string",
                    "groupName": "string",
                    "matchScore": number,
                    "reasonsForMatch": ["string", "string"]
                  }
                ]
                `
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract the JSON from the text response
    let jsonText = data.candidates[0].content.parts[0].text;
    
    // Find JSON content (between square brackets)
    const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Could not parse AI response");
    }
    
    const matchedGroups = JSON.parse(jsonMatch[0]);
    
    return matchedGroups;
    
  } catch (error: any) {
    console.error("Error generating group matches:", error);
    throw new Error(`Failed to generate group matches: ${error.message}`);
  }
}
