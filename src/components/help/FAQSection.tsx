
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQSection = () => {
  const faqs = [
    {
      question: "How do I get started with StudySync?",
      answer: "Start by setting up your profile and adding your study goals. Then, create your first study session or join a study group. Our AI will help guide you through the process and provide personalized recommendations."
    },
    {
      question: "How does AI assist my learning?",
      answer: "Our AI analyzes your study patterns, performance, and goals to provide personalized recommendations, identify skill gaps, and suggest effective learning strategies. It also helps track your progress and adapts to your learning style."
    },
    {
      question: "Can I customize my notification preferences?",
      answer: "Yes! You can customize all notifications in Settings > Notification Preferences. This includes study reminders, AI insights, and group activity notifications."
    },
    {
      question: "How do I join or create a study group?",
      answer: "Navigate to the Study Groups section to browse existing groups or create your own. You can filter groups by subject, level, and availability to find the perfect match for your study needs."
    },
  ];

  return (
    <div className="space-y-6">
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger>{faq.question}</AccordionTrigger>
            <AccordionContent>{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default FAQSection;
