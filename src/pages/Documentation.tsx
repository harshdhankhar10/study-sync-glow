
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink } from "@/components/ui/navigation-menu";
import { Separator } from "@/components/ui/separator";
import { Book, Settings, Menu } from "lucide-react";

export default function Documentation() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          StudySync Documentation
        </h1>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Learn how to use all the features of StudySync to enhance your learning experience.
        </p>

        <div className="grid gap-12">
          {/* Dashboard Features */}
          <section id="dashboard" className="space-y-6">
            <h2 className="text-2xl font-bold">Dashboard Features</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <FeatureCard
                title="AI Learning Hub"
                icon={Book}
                description="Access personalized AI-powered learning materials, including flashcards and quizzes tailored to your study goals."
                features={[
                  "Dynamic content generation",
                  "Topic-specific flashcards",
                  "AI-generated quizzes",
                  "Progress tracking"
                ]}
              />
              <FeatureCard
                title="Study Planning"
                icon={Menu}
                description="Organize your study sessions and track your progress with our comprehensive planning tools."
                features={[
                  "Weekly schedule view",
                  "Study session tracking",
                  "Goal setting",
                  "Progress metrics"
                ]}
              />
              <FeatureCard
                title="Personalization"
                icon={Settings}
                description="Customize your learning experience with personalized settings and preferences."
                features={[
                  "User profile customization",
                  "Learning preferences",
                  "Notification settings",
                  "Study reminders"
                ]}
              />
            </div>
          </section>

          <Separator />

          {/* AI Features */}
          <section id="ai-features" className="space-y-6">
            <h2 className="text-2xl font-bold">AI-Powered Features</h2>
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-xl font-semibold mb-4">Flashcards & Quizzes</h3>
                <ul className="space-y-3">
                  <li className="flex gap-2">
                    <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-600 text-sm">1</span>
                    </div>
                    <span>Select from curated study topics</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-600 text-sm">2</span>
                    </div>
                    <span>Generate personalized flashcards based on your profile</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-600 text-sm">3</span>
                    </div>
                    <span>Take AI-generated quizzes to test your knowledge</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-600 text-sm">4</span>
                    </div>
                    <span>Track your progress and review history</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ 
  title, 
  icon: Icon, 
  description, 
  features 
}: { 
  title: string;
  icon: any;
  description: string;
  features: string[];
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <Icon className="w-5 h-5 text-indigo-600" />
        </div>
        <h3 className="text-xl font-semibold">{title}</h3>
      </div>
      <p className="text-gray-600 mb-4">{description}</p>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
            <div className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}
