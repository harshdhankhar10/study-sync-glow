
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Quiz } from '@/types/quiz';

interface QuizCreationDialogProps {
  onCreateQuiz: (topic: string, difficulty: Quiz['difficulty'], questionCount: number, timeLimit: number) => Promise<void>;
}

export function QuizCreationDialog({ onCreateQuiz }: QuizCreationDialogProps) {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Quiz['difficulty']>('beginner');
  const [questionCount, setQuestionCount] = useState(5);
  const [timeLimit, setTimeLimit] = useState(10);
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateQuiz(topic, difficulty, questionCount, timeLimit);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">Take New Quiz</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Custom Quiz</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Topic</label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter quiz topic"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Difficulty</label>
            <Select value={difficulty} onValueChange={(value: Quiz['difficulty']) => setDifficulty(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Number of Questions</label>
            <Input
              type="number"
              min={1}
              max={20}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Time Limit (minutes)</label>
            <Input
              type="number"
              min={1}
              max={60}
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value))}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Generate Quiz
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
