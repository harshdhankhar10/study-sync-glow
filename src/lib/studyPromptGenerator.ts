
import { db } from './firebase';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { GEMINI_API_KEY, GEMINI_ENDPOINT } from './ai';

export interface StudyPlanInput {
  userId: string;
  topic: string;
  dailyTime: number;
  deadline: Date;
  preferredFormat: string[];
  additionalNotes?: string;
}

export interface StudyDayPlan {
  day: number;
  date: string;
  title: string;
  description: string;
  tasks: StudyTask[];
  estimatedTimeMinutes: number;
  resources: StudyResource[];
}

export interface StudyTask {
  id: string;
  description: string;
  estimatedTimeMinutes: number;
  completed: boolean;
}

export interface StudyResource {
  title: string;
  url?: string;
  type: 'video' | 'article' | 'book' | 'exercise' | 'other';
  description: string;
}

export interface StudyPlan {
  id?: string;
  userId: string;
  topic: string;
  dailyTime: number;
  deadline: Date;
  preferredFormat: string[];
  additionalNotes?: string;
  createdAt: Date;
  overallDescription: string;
  keyLearningPoints: string[];
  days: StudyDayPlan[];
  completed: boolean;
  progress: number;
}

export async function generateStudyPlan(input: StudyPlanInput): Promise<StudyPlan> {
  try {
    // Calculate number of days between now and deadline
    const today = new Date();
    const deadline = new Date(input.deadline);
    const diffTime = Math.abs(deadline.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Get user skills and goals if available
    let skills: string[] = [];
    let goals: string[] = [];
    
    try {
      const skillsRef = doc(db, 'skills', input.userId);
      const skillsSnap = await getDoc(skillsRef);
      if (skillsSnap.exists()) {
        skills = skillsSnap.data()?.skills || [];
      }
    } catch (error) {
      console.error("Error fetching skills:", error);
    }

    try {
      const goalsRef = doc(db, 'goals', input.userId);
      const goalsSnap = await getDoc(goalsRef);
      if (goalsSnap.exists()) {
        goals = goalsSnap.data()?.goals || [];
      }
    } catch (error) {
      console.error("Error fetching goals:", error);
    }

    // Fetch previous study plans to avoid duplication
    const plansRef = collection(db, 'studyPlans');
    const q = query(plansRef, where('userId', '==', input.userId));
    const querySnapshot = await getDocs(q);
    const previousPlans = querySnapshot.docs.map(doc => doc.data().topic);

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
                text: `Generate a personalized study plan based on the following information:
                
                Topic: ${input.topic}
                Daily available time: ${input.dailyTime} minutes
                Deadline: ${input.deadline.toISOString().split('T')[0]} (${diffDays} days from now)
                Preferred learning formats: ${input.preferredFormat.join(', ')}
                Additional notes: ${input.additionalNotes || 'None'}
                
                User's existing skills: ${skills.join(', ') || 'Not provided'}
                User's learning goals: ${goals.join(', ') || 'Not provided'}
                Previously studied topics: ${previousPlans.join(', ') || 'None'}
                
                Create a day-by-day study plan that:
                1. Breaks down the topic into logical learning sequences
                2. Provides specific tasks for each day with time estimates
                3. Includes relevant resources (URLs when possible)
                4. Has measurable learning objectives
                5. Gradually builds complexity
                
                CRITICAL INSTRUCTIONS: Return ONLY a valid JSON object with this exact structure. Do NOT include any markdown formatting, explanation text, or codeblocks around the JSON. The response must start with { and end with } and be properly formatted JSON:

                {
                  "overallDescription": "Brief description of the entire study plan",
                  "keyLearningPoints": ["Key point 1", "Key point 2"],
                  "days": [
                    {
                      "day": 1,
                      "date": "YYYY-MM-DD",
                      "title": "Day 1 focus topic",
                      "description": "What you'll learn today",
                      "tasks": [
                        {
                          "id": "unique-id-1",
                          "description": "Task description",
                          "estimatedTimeMinutes": 30,
                          "completed": false
                        }
                      ],
                      "estimatedTimeMinutes": 60,
                      "resources": [
                        {
                          "title": "Resource title",
                          "url": "https://example.com/resource", 
                          "type": "video|article|book|exercise|other",
                          "description": "Brief description"
                        }
                      ]
                    }
                  ]
                }
                
                IMPORTANT JSON FORMATTING RULES:
                - Use double quotes for all keys and string values
                - Do NOT use trailing commas after the last item in arrays or objects
                - Ensure all arrays and objects are properly closed
                - Make sure all string values are properly escaped
                - Each "day" object must have all the required fields (day, date, title, description, tasks, estimatedTimeMinutes, resources)
                - Each "task" must have all the required fields (id, description, estimatedTimeMinutes, completed)
                - Each "resource" must have all the required fields (title, type, description) and url when available
                
                Ensure:
                - Each day's total estimated time is approximately ${input.dailyTime} minutes
                - The plan spans ${diffDays} days maximum
                - Resources are relevant and varied according to the preferred formats: ${input.preferredFormat.join(', ')}
                - Tasks are specific and actionable
                - IDs for tasks are truly unique strings
                - Type for resources must be one of: "video", "article", "book", "exercise", or "other"`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
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
    
    // Log the raw response for debugging
    console.log("Raw AI response:", jsonText);
    
    // Advanced JSON extraction and cleaning
    let cleanJsonText = '';
    
    try {
      // First attempt: Simple extraction
      if (jsonText.trim().startsWith('{') && jsonText.trim().endsWith('}')) {
        cleanJsonText = jsonText.trim();
      } else {
        // Second attempt: Find the JSON using regex
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanJsonText = jsonMatch[0];
        } else {
          throw new Error("Could not extract valid JSON from AI response");
        }
      }
      
      // Clean up common JSON issues
      // Remove trailing commas which are common AI mistakes
      cleanJsonText = cleanJsonText.replace(/,(\s*[\]}])/g, '$1');
      
      // Replace any invalid control characters
      cleanJsonText = cleanJsonText.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
      
      // Extra safety: ensure proper JSON structure
      cleanJsonText = cleanJsonText
        .replace(/\][\s\n]*\}/g, ']}') // Fix array closing at the end of object
        .replace(/\}[\s\n]*\]/g, ']}') // Fix object closing at the end of array
        .replace(/\}\s*\{/g, '},{'); // Fix adjacent objects
      
      console.log("Cleaned JSON:", cleanJsonText);
      
      // Parse the JSON
      const planData = JSON.parse(cleanJsonText);
      
      // Validate required properties
      if (!planData.overallDescription || !Array.isArray(planData.keyLearningPoints) || !Array.isArray(planData.days)) {
        throw new Error("AI response missing required properties");
      }
      
      // Deep validation for potential issues
      for (const day of planData.days) {
        if (!day.day || !day.date || !day.title || !day.description || 
            !Array.isArray(day.tasks) || !day.estimatedTimeMinutes || !Array.isArray(day.resources)) {
          throw new Error(`Invalid day structure in AI response: ${JSON.stringify(day)}`);
        }
        
        for (const task of day.tasks) {
          if (!task.id || !task.description || typeof task.estimatedTimeMinutes !== 'number' || 
              typeof task.completed !== 'boolean') {
            throw new Error(`Invalid task structure in AI response: ${JSON.stringify(task)}`);
          }
        }
        
        for (const resource of day.resources) {
          if (!resource.title || !resource.type || !resource.description) {
            throw new Error(`Invalid resource structure in AI response: ${JSON.stringify(resource)}`);
          }
        }
      }
      
      // Create the study plan object
      const studyPlan: StudyPlan = {
        userId: input.userId,
        topic: input.topic,
        dailyTime: input.dailyTime,
        deadline: deadline,
        preferredFormat: input.preferredFormat,
        additionalNotes: input.additionalNotes,
        createdAt: new Date(),
        overallDescription: planData.overallDescription,
        keyLearningPoints: planData.keyLearningPoints,
        days: planData.days,
        completed: false,
        progress: 0
      };
      
      // Save to Firestore
      const docRef = await addDoc(collection(db, 'studyPlans'), studyPlan);
      
      // Return the plan with the ID
      return {
        ...studyPlan,
        id: docRef.id,
      };
      
    } catch (parseError: any) {
      console.error("JSON parse error:", parseError);
      
      // If we still have issues, try a more aggressive approach to fix the JSON
      try {
        // Last resort: Manual fixing of common JSON errors
        // This is very aggressive but might work in desperate cases
        if (parseError.message.includes("position")) {
          const posMatch = parseError.message.match(/position (\d+)/);
          if (posMatch && posMatch[1]) {
            const errorPos = parseInt(posMatch[1]);
            
            // Get the problematic area (20 chars before and after)
            const startPos = Math.max(0, errorPos - 20);
            const endPos = Math.min(jsonText.length, errorPos + 20);
            const problematicArea = jsonText.substring(startPos, endPos);
            
            console.error(`JSON parse error near: "${problematicArea}"`);
            
            // Try to identify and fix common issues
            // For example, if error is about missing comma, we might try to insert it
            // Or if it's about unexpected comma, we might try to remove it
            
            // Create a more sanitized version by replacing problematic characters
            const sanitizedJsonText = jsonText
              .replace(/'/g, '"')  // Replace single quotes with double quotes
              .replace(/,\s*[\]}]/g, '$1') // Remove trailing commas
              .replace(/\\/g, '\\\\') // Escape backslashes
              .replace(/\n/g, ' ') // Replace newlines with spaces
              .replace(/"\s*\}/g, '"}') // Fix spacing issues
              .replace(/\}\s*"/g, '},"'); // Fix missing commas between objects
            
            console.log("Last resort sanitized JSON:", sanitizedJsonText);
            
            // Extract JSON using a more flexible approach
            const flexibleJsonMatch = sanitizedJsonText.match(/\{[\s\S]*\}/);
            if (flexibleJsonMatch) {
              const planData = JSON.parse(flexibleJsonMatch[0]);
              
              // Create a basic valid study plan structure
              const studyPlan: StudyPlan = {
                userId: input.userId,
                topic: input.topic,
                dailyTime: input.dailyTime,
                deadline: deadline,
                preferredFormat: input.preferredFormat,
                additionalNotes: input.additionalNotes,
                createdAt: new Date(),
                overallDescription: planData.overallDescription || "Study plan for " + input.topic,
                keyLearningPoints: Array.isArray(planData.keyLearningPoints) ? planData.keyLearningPoints : [],
                days: Array.isArray(planData.days) ? planData.days : [],
                completed: false,
                progress: 0
              };
              
              // Save to Firestore
              const docRef = await addDoc(collection(db, 'studyPlans'), studyPlan);
              
              // Return the plan with the ID
              return {
                ...studyPlan,
                id: docRef.id,
              };
            }
          }
        }
      } catch (lastResortError) {
        console.error("Failed even with last resort parsing:", lastResortError);
      }
      
      // If all else fails, throw a clear error
      throw new Error(`Failed to parse AI response: ${parseError.message}`);
    }
  } catch (error: any) {
    console.error("Error generating study plan:", error);
    throw new Error(`Failed to generate study plan: ${error.message}`);
  }
}

export async function updateTaskStatus(planId: string, dayIndex: number, taskId: string, completed: boolean): Promise<void> {
  try {
    // Get the current plan
    const planRef = doc(db, 'studyPlans', planId);
    const planSnap = await getDoc(planRef);
    
    if (!planSnap.exists()) {
      throw new Error("Study plan not found");
    }
    
    const plan = planSnap.data() as StudyPlan;
    
    // Update the task status
    const updatedDays = [...plan.days];
    const dayToUpdate = updatedDays[dayIndex];
    
    if (!dayToUpdate) {
      throw new Error("Day not found in plan");
    }
    
    const taskIndex = dayToUpdate.tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) {
      throw new Error("Task not found in day plan");
    }
    
    dayToUpdate.tasks[taskIndex] = {
      ...dayToUpdate.tasks[taskIndex],
      completed
    };
    
    // Calculate new progress percentage
    const totalTasks = updatedDays.reduce((count, day) => count + day.tasks.length, 0);
    const completedTasks = updatedDays.reduce((count, day) => 
      count + day.tasks.filter(task => task.completed).length, 0);
    
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Update plan in Firestore
    await updateDoc(planRef, {
      days: updatedDays,
      progress,
      completed: progress === 100
    });
    
  } catch (error: any) {
    console.error("Error updating task status:", error);
    throw new Error(`Failed to update task: ${error.message}`);
  }
}

export async function getStudyPlan(planId: string): Promise<StudyPlan | null> {
  try {
    const planRef = doc(db, 'studyPlans', planId);
    const planSnap = await getDoc(planRef);
    
    if (!planSnap.exists()) {
      return null;
    }
    
    const planData = planSnap.data();
    return {
      ...planData,
      id: planSnap.id,
      deadline: planData.deadline.toDate(),
      createdAt: planData.createdAt.toDate()
    } as StudyPlan;
    
  } catch (error: any) {
    console.error("Error fetching study plan:", error);
    throw new Error(`Failed to fetch study plan: ${error.message}`);
  }
}

export async function getUserStudyPlans(userId: string): Promise<StudyPlan[]> {
  try {
    const plansRef = collection(db, 'studyPlans');
    const q = query(plansRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const plans: StudyPlan[] = [];
    
    querySnapshot.forEach(doc => {
      const data = doc.data();
      plans.push({
        ...data,
        id: doc.id,
        deadline: data.deadline.toDate(),
        createdAt: data.createdAt.toDate()
      } as StudyPlan);
    });
    
    // Sort by creation date (newest first)
    return plans.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
  } catch (error: any) {
    console.error("Error fetching user study plans:", error);
    throw new Error(`Failed to fetch study plans: ${error.message}`);
  }
}
