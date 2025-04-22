
import { Quiz, QuizQuestion, QuizAttempt, QuizAnswer, QuizAnalytics } from '@/types/quiz';
import { GEMINI_API_KEY, GEMINI_ENDPOINT } from '@/lib/ai';

export async function generateQuiz(topic: string, difficulty: Quiz['difficulty'], userContext: any): Promise<Quiz> {
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
                text: `Generate a ${difficulty} level quiz about ${topic}. Consider:
                User's Major: ${userContext.major || 'Not specified'}
                Skills: ${JSON.stringify(userContext.skills || [])}
                Goals: ${JSON.stringify(userContext.goals || [])}
                Number of Questions: ${userContext.questionCount || 5}
                Time Limit: ${userContext.timeLimit || 10} minutes
                
                Create a quiz that:
                - Has exactly ${userContext.questionCount || 5} questions
                - Is appropriate for the ${difficulty} level
                - Can be completed in ${userContext.timeLimit || 10} minutes
                - Includes varied question types
                - Provides detailed explanations
                - Tests critical thinking
                - Relates to real-world applications
                
                Return ONLY a valid JSON object in this format:
                {
                  "title": "string",
                  "description": "string",
                  "topic": "string",
                  "difficulty": "${difficulty}",
                  "duration": ${userContext.timeLimit || 10},
                  "questions": [
                    {
                      "id": "string",
                      "type": "multiple-choice|true-false",
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

export async function generateQuizAnalytics(attempts: QuizAttempt[]): Promise<QuizAnalytics> {
  if (!attempts.length) {
    return {
      totalAttempts: 0,
      averageScore: 0,
      averageTimeSpent: 0,
      weakestTopics: [],
      strongestTopics: [],
      recommendedTopics: [],
      improvement: 0,
    };
  }

  const totalScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
  const totalTime = attempts.reduce((sum, attempt) => sum + attempt.timeSpent, 0);

  return {
    totalAttempts: attempts.length,
    averageScore: totalScore / attempts.length,
    averageTimeSpent: totalTime / attempts.length,
    weakestTopics: calculateWeakTopics(attempts),
    strongestTopics: calculateStrongTopics(attempts),
    recommendedTopics: generateRecommendedTopics(attempts),
    improvement: calculateImprovement(attempts),
  };
}

function calculateWeakTopics(attempts: QuizAttempt[]): string[] {
  // Implementation for calculating weak topics based on wrong answers
  return [];
}

function calculateStrongTopics(attempts: QuizAttempt[]): string[] {
  // Implementation for calculating strong topics based on correct answers
  return [];
}

function generateRecommendedTopics(attempts: QuizAttempt[]): string[] {
  // Implementation for generating recommended topics based on performance
  return [];
}

function calculateImprovement(attempts: QuizAttempt[]): number {
  if (attempts.length < 2) return 0;
  const sortedAttempts = [...attempts].sort((a, b) => 
    a.completedAt.getTime() - b.completedAt.getTime()
  );
  const firstScore = sortedAttempts[0].score;
  const lastScore = sortedAttempts[sortedAttempts.length - 1].score;
  return ((lastScore - firstScore) / firstScore) * 100;
}
