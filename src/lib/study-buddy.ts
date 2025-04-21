
import { GEMINI_API_KEY, GEMINI_ENDPOINT } from '@/lib/ai';

/**
 * Generate an AI response based on user message, conversation history and user context
 */
export async function generateAIResponse(
  userMessage: string,
  conversationHistory: {role: string, content: string}[],
  userContext: any
): Promise<string> {
  try {
    // Extract relevant information from user context
    const subjects = userContext?.skills?.subjects || [];
    const skills = userContext?.skills?.skills || [];
    const goals = userContext?.goals?.goals || [];
    const major = userContext?.profile?.major || 'Unknown';
    const year = userContext?.profile?.year || 'Unknown';
    
    // Recent notes titles if available
    const recentNoteTitles = userContext?.recentNotes?.map((note: any) => note.title) || [];
    
    // Upcoming session titles if available
    const upcomingSessions = userContext?.upcomingSessions?.map((session: any) => 
      `${session.title} (${session.date instanceof Date 
        ? session.date.toISOString().split('T')[0] 
        : 'upcoming'})`
    ) || [];
    
    // Build system message with context
    const systemMessage = `
      You are StudyBuddy, an AI learning assistant for a student with the following profile:
      
      ${major !== 'Unknown' ? `- Studying: ${major}` : ''}
      ${year !== 'Unknown' ? `- Year: ${year}` : ''}
      ${subjects.length > 0 ? `- Current subjects: ${subjects.join(', ')}` : ''}
      ${skills.length > 0 ? `- Skills: ${skills.join(', ')}` : ''}
      ${goals.length > 0 ? `- Learning goals: ${goals.join(', ')}` : ''}
      ${recentNoteTitles.length > 0 ? `- Recent notes about: ${recentNoteTitles.join(', ')}` : ''}
      ${upcomingSessions.length > 0 ? `- Upcoming study sessions: ${upcomingSessions.join(', ')}` : ''}
      
      As StudyBuddy, your goal is to:
      1. Be a supportive and knowledgeable study companion
      2. Explain concepts clearly and at the appropriate educational level
      3. Provide personalized advice based on the student's profile
      4. Help with study planning, concept understanding, and exam preparation
      5. Respond in a friendly, encouraging manner
      6. Keep responses concise but thorough (under 400 words unless a detailed explanation is requested)
      
      When asked about subjects not in your context, still provide helpful information.
      Avoid making up specifics about the student's classes, assignments or exams unless mentioned previously.
      
      Your tone should be: friendly, supportive, clear, and slightly casual while remaining educational.
    `;

    // Prepare the messages array for the API request
    const messages = [
      { role: 'system', content: systemMessage },
      ...conversationHistory.slice(-10), // Include up to 10 recent messages
      { role: 'user', content: userMessage }
    ];
    
    // Make API call to Gemini
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: messages.map(m => ({
          role: m.role,
          parts: [{ text: m.content }]
        })),
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
          topP: 0.95,
          topK: 40,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponseText = data.candidates[0].content.parts[0].text;
    
    return aiResponseText;
  } catch (error) {
    console.error("Error generating AI response:", error);
    return "I'm sorry, I encountered an error while processing your request. Please try again.";
  }
}
