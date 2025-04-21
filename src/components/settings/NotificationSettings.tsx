
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

const NotificationSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    aiUpdates: true,
    sessionAlerts: true,
    emailNotifications: true,
    studyReminders: true,
    groupInvites: true,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [key]: !prev[key] };
      toast({
        title: "Preferences updated",
        description: "Your notification preferences have been saved.",
      });
      return newSettings;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Choose what notifications you want to receive</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="ai-updates">AI Updates</Label>
            <p className="text-sm text-muted-foreground">
              Receive updates about AI-powered insights and recommendations
            </p>
          </div>
          <Switch
            id="ai-updates"
            checked={settings.aiUpdates}
            onCheckedChange={() => handleToggle('aiUpdates')}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="session-alerts">Session Alerts</Label>
            <p className="text-sm text-muted-foreground">
              Get notified about upcoming study sessions
            </p>
          </div>
          <Switch
            id="session-alerts"
            checked={settings.sessionAlerts}
            onCheckedChange={() => handleToggle('sessionAlerts')}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="email-notifications">Email Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive important updates via email
            </p>
          </div>
          <Switch
            id="email-notifications"
            checked={settings.emailNotifications}
            onCheckedChange={() => handleToggle('emailNotifications')}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="study-reminders">Study Reminders</Label>
            <p className="text-sm text-muted-foreground">
              Get reminded about your study goals and deadlines
            </p>
          </div>
          <Switch
            id="study-reminders"
            checked={settings.studyReminders}
            onCheckedChange={() => handleToggle('studyReminders')}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="group-invites">Group Invites</Label>
            <p className="text-sm text-muted-foreground">
              Receive notifications about study group invitations
            </p>
          </div>
          <Switch
            id="group-invites"
            checked={settings.groupInvites}
            onCheckedChange={() => handleToggle('groupInvites')}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
