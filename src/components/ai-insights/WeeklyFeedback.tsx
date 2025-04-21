
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Check, AlertTriangle, ArrowRight } from 'lucide-react';

interface WeeklyFeedbackProps {
  feedback?: {
    summary: string;
    strengths: string[];
    improvements: string[];
    nextSteps: string[];
  };
}

export default function WeeklyFeedback({ feedback }: WeeklyFeedbackProps) {
  if (!feedback) return null;
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-indigo-500" />
            Weekly Learning Overview
          </CardTitle>
          <CardDescription>
            An AI-generated summary of your recent study activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground whitespace-pre-line">{feedback.summary}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Strengths */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Check className="mr-2 h-4 w-4 text-green-500" />
              Your Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {feedback.strengths.map((strength, index) => (
                <li key={index} className="flex">
                  <span className="text-green-500 mr-2 font-medium">+</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Areas for Improvement */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
              Areas to Improve
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {feedback.improvements.map((improvement, index) => (
                <li key={index} className="flex">
                  <span className="text-amber-500 mr-2 font-medium">△</span>
                  <span>{improvement}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <ArrowRight className="mr-2 h-4 w-4 text-blue-500" />
              Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {feedback.nextSteps.map((step, index) => (
                <li key={index} className="flex">
                  <span className="text-blue-500 mr-2 font-medium">→</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
