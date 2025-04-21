
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare,
  Mail,
  MessageCircle,
} from "lucide-react";

const ContactSupport = () => {
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Here you would typically send the message to your support system
    toast({
      title: "Message sent",
      description: "We'll get back to you as soon as possible.",
    });
    
    setMessage("");
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="flex flex-col items-center p-6 bg-card rounded-lg border">
          <MessageSquare className="h-6 w-6 mb-4" />
          <h3 className="font-medium mb-2">Chat Support</h3>
          <p className="text-sm text-center text-muted-foreground">
            Start a live chat with our support team
          </p>
          <Button variant="link" className="mt-4">
            Start Chat
          </Button>
        </div>
        
        <div className="flex flex-col items-center p-6 bg-card rounded-lg border">
          <Mail className="h-6 w-6 mb-4" />
          <h3 className="font-medium mb-2">Email Support</h3>
          <p className="text-sm text-center text-muted-foreground">
            Send us an email anytime
          </p>
          <Button variant="link" className="mt-4">
            support@studysync.com
          </Button>
        </div>

        <div className="flex flex-col items-center p-6 bg-card rounded-lg border">
          <MessageCircle className="h-6 w-6 mb-4" />
          <h3 className="font-medium mb-2">Community Forum</h3>
          <p className="text-sm text-center text-muted-foreground">
            Get help from the community
          </p>
          <Button variant="link" className="mt-4">
            Visit Forum
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h3 className="text-lg font-medium mb-2">Send us a message</h3>
          <p className="text-sm text-muted-foreground mb-4">
            We typically respond within 24 hours
          </p>
          <Textarea
            placeholder="Describe your issue or question..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[150px]"
          />
        </div>
        <Button type="submit">Send Message</Button>
      </form>
    </div>
  );
};

export default ContactSupport;
