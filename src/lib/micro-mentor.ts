
import { GEMINI_API_KEY, GEMINI_ENDPOINT } from '@/lib/ai';

type MentorMode = 'explain' | 'debate' | 'memes' | 'quiz' | 'custom';

interface MicroMentorHistory {
  role: 'user' | 'assistant';
  content: string;
}

export async function generateMicroMentorResponse(
  topic: string,
  userMessage: string,
  mode: MentorMode,
  conversationHistory: MicroMentorHistory[]
): Promise<string> {
  try {
    // Generate a prompt based on the selected mode
    const systemPrompt = generateSystemPrompt(topic, mode);
    
    // Prepare messages for the API
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-6), // Include up to 6 recent messages for context
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
          role: m.role === 'system' ? 'user' : m.role, // Gemini uses 'user' for system messages
          parts: [{ text: m.content }]
        })),
        generationConfig: {
          temperature: getModeTemperature(mode),
          maxOutputTokens: 800,
          topK: 40,
          topP: 0.95,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
      throw new Error("Invalid response format from API");
    }
    
    const aiResponseText = data.candidates[0].content.parts[0].text;
    
    return aiResponseText;
  } catch (error) {
    console.error("Error generating MicroMentor response:", error);
    return "I'm sorry, I encountered an error while processing your request. Please try again.";
  }
}

function generateSystemPrompt(topic: string, mode: MentorMode): string {
  const basePrompt = `You are MicroMentor, an AI learning assistant specializing in "${topic}". You provide concise, engaging 5-minute learning boosts. Keep responses under 200 words and focused on the specific topic.`;
  
  switch (mode) {
    case 'explain':
      return `${basePrompt}
      
      You explain complex topics in simple terms that a 5-year-old could understand. Use analogies, simple vocabulary, and concrete examples. Break down complex ideas into their most fundamental elements.
      
      For example, if asked about photosynthesis, explain it like: "Plants are like little chefs that make their own food! They use sunlight like we use an oven, water like we use ingredients, and carbon dioxide (the air we breathe out) to cook up their meals. The plant's green parts called leaves are like solar panels that catch the sun's energy. And just like when we cook, plants make something extra - oxygen - which is like their 'thank you' gift to animals and people!"`;
      
    case 'debate':
      return `${basePrompt}
      
      You present balanced debates on the topic by showing different perspectives. Present exactly two opposing viewpoints on the topic in a structured format:
      
      Perspective 1: [First perspective with 2-3 key points]
      Perspective 2: [Second perspective with 2-3 key points]
      
      Be balanced and fair to both sides. Do not reveal your own opinion on which side is right.`;
      
    case 'memes':
      return `${basePrompt}
      
      You creatively explain concepts through text-based memes and humor. Describe 3-5 memes that could explain key aspects of the topic. For each meme, describe:
      
      1. The meme template/format
      2. The text that would appear on the meme
      3. Why this helps understand the concept
      
      Keep it educational but entertaining. Use popular, widely-recognized meme formats.`;
      
    case 'quiz':
      return `${basePrompt}
      
      Create a quick mini-quiz on the topic with 3-5 multiple choice questions. Format each question as:
      
      Q1: [Question]
      A) [Option A]
      B) [Option B]
      C) [Option C]
      D) [Option D]
      
      After presenting all questions, provide the answers and brief explanations.`;
      
    case 'custom':
    default:
      return `${basePrompt}
      
      Be adaptive and responsive to the specific request from the student. If they don't specify a format, provide a concise but comprehensive explanation of the topic, focusing on the core concepts and their practical applications.`;
  }
}

function getModeTemperature(mode: MentorMode): number {
  switch (mode) {
    case 'explain':
      return 0.5; // More focused and concrete
    case 'debate':
      return 0.7; // Balanced perspectives
    case 'memes':
      return 0.9; // More creative and varied
    case 'quiz':
      return 0.4; // More factual and precise
    case 'custom':
    default:
      return 0.7; // Moderate temperature for general responses
  }
}
