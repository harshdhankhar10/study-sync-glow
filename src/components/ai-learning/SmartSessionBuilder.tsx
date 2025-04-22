
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { generateStudyPlan } from '@/lib/ai';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, MapPin, Brain } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TimeSlot {
  day: string;
  time: string;
  selected: boolean;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', 
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

export function SmartSessionBuilder() {
  const { currentUser } = useAuth();
  const [availabilitySlots, setAvailabilitySlots] = useState<TimeSlot[]>(
    DAYS.flatMap(day => 
      TIME_SLOTS.map(time => ({
        day,
        time,
        selected: false
      }))
    )
  );
  const [loading, setLoading] = useState(false);

  const toggleSlot = (day: string, time: string) => {
    setAvailabilitySlots(slots =>
      slots.map(slot =>
        slot.day === day && slot.time === time
          ? { ...slot, selected: !slot.selected }
          : slot
      )
    );
  };

  const handleGeneratePlan = async () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "Please log in to generate a study plan",
        variant: "destructive",
      });
      return;
    }

    const selectedSlots = availabilitySlots.filter(slot => slot.selected);
    if (selectedSlots.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one time slot",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const sessions = await generateStudyPlan(currentUser.uid, availabilitySlots);
      toast({
        title: "Success!",
        description: `Created ${sessions.length} study sessions based on your availability`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate study plan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Smart Session Builder</CardTitle>
          <CardDescription>
            Select your available time slots and let AI create a personalized study plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 border"></th>
                    {TIME_SLOTS.map(time => (
                      <th key={time} className="p-2 border text-sm">
                        {time}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map(day => (
                    <tr key={day}>
                      <td className="p-2 border font-medium">{day}</td>
                      {TIME_SLOTS.map(time => {
                        const slot = availabilitySlots.find(
                          s => s.day === day && s.time === time
                        );
                        return (
                          <td key={`${day}-${time}`} className="p-2 border text-center">
                            <button
                              onClick={() => toggleSlot(day, time)}
                              className={`w-6 h-6 rounded ${
                                slot?.selected
                                  ? 'bg-blue-500'
                                  : 'bg-gray-100'
                              }`}
                              aria-label={`Select ${day} at ${time}`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleGeneratePlan} 
            disabled={loading || !availabilitySlots.some(slot => slot.selected)}
            className="w-full"
          >
            {loading ? "Generating Study Plan..." : "Generate AI Study Plan"}
          </Button>
        </CardFooter>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Brain className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">AI-Powered</p>
                <p className="text-lg font-semibold">Personalized Plans</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Flexible</p>
                <p className="text-lg font-semibold">Schedule</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Optimized</p>
                <p className="text-lg font-semibold">Time Slots</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-pink-100 rounded-lg">
                <MapPin className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Smart</p>
                <p className="text-lg font-semibold">Location</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
