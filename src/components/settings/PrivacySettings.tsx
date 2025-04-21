
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

const PrivacySettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    publicProfile: true,
    shareProgress: true,
    allowAIAnalysis: true,
    shareStudyHabits: true,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [key]: !prev[key] };
      toast({
        title: "Privacy settings updated",
        description: "Your privacy preferences have been saved.",
      });
      return newSettings;
    });
  };

  const handleDeleteData = () => {
    // Implement data deletion logic here
    toast({
      title: "Request received",
      description: "Your data deletion request has been submitted.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Privacy Settings</CardTitle>
          <CardDescription>Control your data and privacy preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="public-profile">Public Profile</Label>
              <p className="text-sm text-muted-foreground">
                Make your profile visible to other users
              </p>
            </div>
            <Switch
              id="public-profile"
              checked={settings.publicProfile}
              onCheckedChange={() => handleToggle('publicProfile')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="share-progress">Share Progress</Label>
              <p className="text-sm text-muted-foreground">
                Allow others to see your learning progress
              </p>
            </div>
            <Switch
              id="share-progress"
              checked={settings.shareProgress}
              onCheckedChange={() => handleToggle('shareProgress')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ai-analysis">AI Analysis</Label>
              <p className="text-sm text-muted-foreground">
                Allow AI to analyze your study patterns for better recommendations
              </p>
            </div>
            <Switch
              id="ai-analysis"
              checked={settings.allowAIAnalysis}
              onCheckedChange={() => handleToggle('allowAIAnalysis')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="study-habits">Share Study Habits</Label>
              <p className="text-sm text-muted-foreground">
                Share your study habits for group matching
              </p>
            </div>
            <Switch
              id="study-habits"
              checked={settings.shareStudyHabits}
              onCheckedChange={() => handleToggle('shareStudyHabits')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Manage your personal data</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleDeleteData}
          >
            Request Data Deletion
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacySettings;
