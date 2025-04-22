
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Book, LineChart } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type JournalEntry = {
  id: string;
  content: string;
  mood: number;
  aiReflection: string;
  createdAt: Timestamp;
  userId: string;
};

export default function JournalPage() {
  const [entry, setEntry] = useState("");
  const [mood, setMood] = useState(5);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadEntries();
  }, [currentUser]);

  const loadEntries = async () => {
    if (!currentUser) return;
    
    try {
      const entriesRef = collection(db, 'journal_entries');
      const q = query(
        entriesRef,
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const loadedEntries = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as JournalEntry[];
      
      setEntries(loadedEntries);
    } catch (error) {
      console.error('Error loading entries:', error);
      toast({
        title: "Error loading entries",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const generateAIReflection = (content: string): string => {
    // Simplified AI reflection generation
    const reflections = [
      "I notice you're making great progress in your studies.",
      "You seem to be developing good learning habits.",
      "Your dedication to improvement is clear.",
      "Consider breaking down complex topics into smaller parts.",
      "Try connecting these concepts to real-world applications.",
    ];
    return reflections[Math.floor(Math.random() * reflections.length)];
  };

  const handleSubmit = async () => {
    if (!currentUser || !entry.trim()) return;

    setIsSubmitting(true);
    try {
      const aiReflection = generateAIReflection(entry);
      
      await addDoc(collection(db, 'journal_entries'), {
        content: entry,
        mood,
        aiReflection,
        createdAt: Timestamp.now(),
        userId: currentUser.uid
      });

      toast({
        title: "Entry saved!",
        description: "Your journal entry has been recorded",
      });

      setEntry("");
      loadEntries();
    } catch (error) {
      console.error('Error saving entry:', error);
      toast({
        title: "Error saving entry",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMoodData = () => {
    return entries.map(entry => ({
      date: new Date(entry.createdAt.toDate()).toLocaleDateString(),
      mood: entry.mood
    })).reverse();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Personal Growth Journal</h2>
          <p className="text-gray-500">Record your thoughts and track your progress</p>
        </div>
        <Book className="h-8 w-8 text-gray-400" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>New Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                placeholder="Write your thoughts for today..."
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
                className="min-h-[150px]"
              />
              <div className="space-y-2">
                <label className="text-sm font-medium">Mood (1-10)</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={mood}
                  onChange={(e) => setMood(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>😔 1</span>
                  <span>😊 10</span>
                </div>
              </div>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !entry.trim()}
                className="w-full"
              >
                Save Entry
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              Mood Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={getMoodData()}>
                  <XAxis dataKey="date" />
                  <YAxis domain={[1, 10]} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="mood" 
                    stroke="#6366f1"
                    strokeWidth={2} 
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {entries.map((entry) => (
              <div 
                key={entry.id}
                className="p-4 border rounded-lg space-y-2"
              >
                <p className="text-sm text-gray-600">{entry.content}</p>
                <div className="text-sm text-indigo-600 bg-indigo-50 p-3 rounded-md">
                  <strong>AI Reflection:</strong> {entry.aiReflection}
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Mood: {entry.mood}/10</span>
                  <span>
                    {entry.createdAt.toDate().toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
