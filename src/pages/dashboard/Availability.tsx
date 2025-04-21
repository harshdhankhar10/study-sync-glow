
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { auth } from '@/lib/firebase';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const db = getFirestore();

interface TimeSlot {
  day: string;
  time: string;
  selected: boolean;
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const timeSlots = [
  '8:00 AM - 10:00 AM',
  '10:00 AM - 12:00 PM',
  '12:00 PM - 2:00 PM',
  '2:00 PM - 4:00 PM',
  '4:00 PM - 6:00 PM',
  '6:00 PM - 8:00 PM',
  '8:00 PM - 10:00 PM',
];

export default function Availability() {
  const [isLoading, setIsLoading] = useState(false);
  const [availability, setAvailability] = useState<TimeSlot[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize all possible time slots
    const initialTimeSlots: TimeSlot[] = [];
    days.forEach(day => {
      timeSlots.forEach(time => {
        initialTimeSlots.push({
          day,
          time,
          selected: false,
        });
      });
    });
    setAvailability(initialTimeSlots);

    // Fetch availability data
    const fetchAvailability = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const docRef = doc(db, 'availability', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.timeSlots) {
            setAvailability(data.timeSlots);
          }
        }
      } catch (error) {
        console.error('Error fetching availability data:', error);
      }
    };

    fetchAvailability();
  }, []);

  const toggleTimeSlot = (dayIndex: number, timeIndex: number) => {
    setAvailability(prev => {
      const newAvailability = [...prev];
      const index = dayIndex * timeSlots.length + timeIndex;
      newAvailability[index].selected = !newAvailability[index].selected;
      return newAvailability;
    });
  };

  const saveAvailability = async () => {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No authenticated user');

      await setDoc(doc(db, 'availability', user.uid), {
        timeSlots: availability,
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: 'Availability updated',
        description: 'Your availability has been saved successfully',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error updating availability',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Set Your Availability
        </h2>
        <p className="text-gray-500 mt-1">
          Let us know when you're available for study sessions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
          <CardDescription>
            Select all time slots when you are typically available to study with a group
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-2 border bg-gray-50"></th>
                  {days.map((day) => (
                    <th key={day} className="p-2 border bg-gray-50 font-medium">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((time, timeIndex) => (
                  <tr key={time}>
                    <td className="p-2 border bg-gray-50 font-medium whitespace-nowrap text-sm">
                      {time}
                    </td>
                    {days.map((day, dayIndex) => {
                      const index = dayIndex * timeSlots.length + timeIndex;
                      return (
                        <td key={`${day}-${time}`} className="p-2 border text-center">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={availability[index]?.selected || false}
                              onCheckedChange={() => toggleTimeSlot(dayIndex, timeIndex)}
                              id={`${day}-${time}`}
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center mt-4 space-x-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="all-day" />
              <Label htmlFor="all-day">Select all day</Label>
            </div>
            <div className="flex items-center space-x-2 ml-6">
              <Checkbox id="clear-all" />
              <Label htmlFor="clear-all">Clear all</Label>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button 
              onClick={saveAvailability} 
              disabled={isLoading}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              {isLoading ? 'Saving...' : 'Save Availability'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
