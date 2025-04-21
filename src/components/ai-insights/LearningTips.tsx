
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, ExternalLink } from 'lucide-react';

interface LearningTipProps {
  tips?: {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    resourceLinks?: string[];
  }[];
}

export default function LearningTips({ tips }: LearningTipProps) {
  if (!tips || tips.length === 0) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'medium':
        return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
      case 'low':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <Lightbulb className="mr-2 h-5 w-5 text-indigo-500" />
            Learning Tips
          </CardTitle>
          <CardDescription>
            Actionable insights to enhance your study effectiveness
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tips.map((tip, index) => (
          <Card key={index} className="flex flex-col h-full">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{tip.title}</CardTitle>
                <Badge className={getPriorityColor(tip.priority)} variant="outline">
                  {tip.priority} priority
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-muted-foreground">{tip.description}</p>
            </CardContent>
            {tip.resourceLinks && tip.resourceLinks.length > 0 && (
              <CardFooter className="pt-0 border-t">
                <div className="w-full">
                  <h4 className="text-sm font-medium mb-2">Resources:</h4>
                  <ul className="space-y-1">
                    {tip.resourceLinks.map((link, idx) => (
                      <li key={idx} className="flex items-center text-sm">
                        <ExternalLink className="h-3 w-3 mr-2 text-indigo-500" />
                        <a 
                          href={link.startsWith('http') ? link : `https://${link}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline overflow-hidden overflow-ellipsis"
                        >
                          {link.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardFooter>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
