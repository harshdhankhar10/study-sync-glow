
import { Quiz, Flashcard } from '@/types/flashcards';
import { GEMINI_API_KEY, GEMINI_ENDPOINT } from '@/lib/ai';

export async function generateFlashcardsForTopic(topic: string, userContext: any): Promise<Flashcard[]> {
  try {
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
                text: `Generate 5 flashcards for a student studying ${topic}. Consider their context:
                Major: ${userContext.major || 'Not specified'}
                Current Skills: ${JSON.stringify(userContext.skills || [])}
                Learning Goals: ${JSON.stringify(userContext.goals || [])}
                
                Create flashcards that are:
                - Specific to the topic
                - Progressive in difficulty
                - Focused on key concepts
                
                Return ONLY a valid JSON array in this format:
                [
                  {
                    "question": "string",
                    "answer": "string",
                    "difficulty": "easy|medium|hard",
                    "topic": "string"
                  }
                ]`
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
      throw new Error('Failed to generate flashcards');
    }

    const data = await response.json();
    const jsonMatch = data.candidates[0].content.parts[0].text.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }

    const flashcardsData = JSON.parse(jsonMatch[0]);
    
    return flashcardsData.map((card: any, index: number) => ({
      id: `card-${Date.now()}-${index}`,
      ...card,
      timesReviewed: 0,
      lastReviewed: new Date(),
      nextReview: new Date(),
    }));

  } catch (error) {
    console.error('Error generating flashcards:', error);
    throw error;
  }
}

export async function generateQuizForTopic(topic: string, userContext: any): Promise<Quiz> {
  try {
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
                text: `Generate a quiz about ${topic} for a student. Consider their context:
                Major: ${userContext.major || 'Not specified'}
                Current Skills: ${JSON.stringify(userContext.skills || [])}
                Learning Goals: ${JSON.stringify(userContext.goals || [])}
                
                Create a quiz that:
                - Tests understanding of key concepts
                - Includes varied question types
                - Provides helpful explanations
                
                Return ONLY a valid JSON object in this format:
                {
                  "title": "string",
                  "topic": "string",
                  "duration": number,
                  "questions": [
                    {
                      "id": "string",
                      "question": "string",
                      "options": ["string"],
                      "correctAnswer": "string",
                      "explanation": "string"
                    }
                  ]
                }`
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
      throw new Error('Failed to generate quiz');
    }

    const data = await response.json();
    const jsonMatch = data.candidates[0].content.parts[0].text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }

    const quizData = JSON.parse(jsonMatch[0]);
    
    return {
      ...quizData,
      id: `quiz-${Date.now()}`,
      createdAt: new Date(),
    };

  } catch (error) {
    console.error('Error generating quiz:', error);
    throw error;
  }
}
