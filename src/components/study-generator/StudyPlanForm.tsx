
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

const formSchema = z.object({
  topic: z.string().min(3, 'Topic must be at least 3 characters'),
  dailyTime: z.coerce.number().min(15, 'Minimum time is 15 minutes').max(480, 'Maximum time is 8 hours'),
  deadline: z.date().min(new Date(), 'Deadline must be in the future'),
  preferredFormat: z.array(z.string()).min(1, 'Select at least one format'),
  additionalNotes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const formatOptions = [
  { id: 'videos', label: 'Videos' },
  { id: 'articles', label: 'Articles' },
  { id: 'books', label: 'Books' },
  { id: 'exercises', label: 'Exercises' },
  { id: 'quizzes', label: 'Quizzes' },
  { id: 'flashcards', label: 'Flashcards' },
];

interface StudyPlanFormProps {
  onSubmit: (data: FormValues) => void;
  isLoading: boolean;
}

export function StudyPlanForm({ onSubmit, isLoading }: StudyPlanFormProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Set default deadline to 14 days from now
  const defaultDeadline = addDays(new Date(), 14);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: '',
      dailyTime: 60,
      deadline: defaultDeadline,
      preferredFormat: ['videos', 'exercises'],
      additionalNotes: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="topic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>What do you want to learn?</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., JavaScript basics, Machine Learning fundamentals" {...field} />
                </FormControl>
                <FormDescription>
                  Be specific about the subject or skill you want to learn
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dailyTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time available daily (minutes)</FormLabel>
                <FormControl>
                  <Input type="number" min={15} max={480} {...field} />
                </FormControl>
                <FormDescription>
                  How much time can you dedicate each day? (15-480 minutes)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="deadline"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Deadline</FormLabel>
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        setIsDatePickerOpen(false);
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  When do you need to complete this learning?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="preferredFormat"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel>Preferred Learning Formats</FormLabel>
                  <FormDescription>
                    Select the types of resources you prefer
                  </FormDescription>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {formatOptions.map((item) => (
                    <FormField
                      key={item.id}
                      control={form.control}
                      name="preferredFormat"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={item.id}
                            className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, item.id])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== item.id
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {item.label}
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="additionalNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any specific requirements, prior knowledge, or preferences..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Share anything that might help tailor your study plan
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating your plan...
            </>
          ) : (
            'Generate AI Study Plan'
          )}
        </Button>
      </form>
    </Form>
  );
}
