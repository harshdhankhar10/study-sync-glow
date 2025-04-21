
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon, Link } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CalendarSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CalendarSyncDialog({ open, onOpenChange }: CalendarSyncDialogProps) {
  const [selectedCalendar, setSelectedCalendar] = useState<string>('google');
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Calendar connected",
        description: `Your ${selectedCalendar === 'google' ? 'Google' : 'Outlook'} calendar has been successfully connected.`,
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: "There was an error connecting to your calendar. Please try again.",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connect Calendar</DialogTitle>
          <DialogDescription>
            Sync your study sessions with your preferred calendar service.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <RadioGroup value={selectedCalendar} onValueChange={setSelectedCalendar}>
            <div className="flex items-center space-x-2 mb-4">
              <RadioGroupItem value="google" id="google" />
              <Label htmlFor="google" className="flex items-center cursor-pointer">
                <div className="w-6 h-6 mr-2 bg-red-500 rounded flex items-center justify-center text-white font-bold">
                  G
                </div>
                Google Calendar
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="outlook" id="outlook" />
              <Label htmlFor="outlook" className="flex items-center cursor-pointer">
                <div className="w-6 h-6 mr-2 bg-blue-500 rounded flex items-center justify-center text-white font-bold">
                  O
                </div>
                Outlook Calendar
              </Label>
            </div>
          </RadioGroup>
          
          <div className="mt-6 p-3 bg-gray-50 rounded-md text-sm border text-gray-600">
            <div className="flex items-start gap-2">
              <Link className="h-5 w-5 mt-0.5 text-gray-500" />
              <div>
                <p>Connecting will:</p>
                <ul className="list-disc ml-4 mt-1 space-y-1">
                  <li>Import your existing calendar events (to avoid conflicts)</li>
                  <li>Add study sessions to your calendar</li>
                  <li>Keep everything in sync automatically</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleConnect} 
            disabled={isConnecting}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            {isConnecting ? "Connecting..." : "Connect Calendar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
