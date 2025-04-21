
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BookOpen, List } from 'lucide-react';

interface SkillGapAnalysisProps {
  analysis?: {
    skillArea: string;
    currentLevel: number;
    targetLevel: number;
    gap: number;
    suggestions: string[];
  }[];
}

export default function SkillGapAnalysis({ analysis }: SkillGapAnalysisProps) {
  if (!analysis || analysis.length === 0) return null;
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <BookOpen className="mr-2 h-5 w-5 text-indigo-500" />
            Skill Gap Analysis
          </CardTitle>
          <CardDescription>
            Understanding where you are and where you need to be
          </CardDescription>
        </CardHeader>
      </Card>

      {analysis.map((skill, index) => (
        <Card key={index} className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{skill.skillArea}</CardTitle>
            <div className="flex justify-between text-sm mt-1">
              <span>Current: {skill.currentLevel}/10</span>
              <span>Target: {skill.targetLevel}/10</span>
            </div>
            <div className="relative pt-1">
              <div className="h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-2 rounded-full bg-indigo-500" 
                  style={{ width: `${(skill.currentLevel / 10) * 100}%` }}
                />
                <div 
                  className="h-4 w-4 rounded-full bg-purple-600 absolute top-0 transform -translate-y-1/4"
                  style={{ left: `${(skill.targetLevel / 10) * 100}%`, marginLeft: '-8px' }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <h4 className="text-sm font-medium mb-2 flex items-center">
              <List className="mr-2 h-4 w-4 text-indigo-500" />
              Improvement Suggestions
            </h4>
            <ul className="space-y-2 pl-6 list-disc text-gray-700">
              {skill.suggestions.map((suggestion, idx) => (
                <li key={idx}>{suggestion}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
