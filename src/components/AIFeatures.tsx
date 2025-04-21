
import { Star, BookOpen, Calendar, Clock } from "lucide-react";

const features = [
  {
    title: "Smart Group Matching",
    description: "Our AI analyzes learning styles, goals, and schedules to create the most effective study groups.",
    icon: Users,
    color: "bg-gradient-to-br from-purple-500 to-indigo-500",
  },
  {
    title: "Personalized Study Plans",
    description: "Get AI-generated study plans tailored to your group's collective goals and individual strengths.",
    icon: BookOpen,
    color: "bg-gradient-to-br from-indigo-500 to-blue-500",
  },
  {
    title: "Weekly Feedback & Analysis",
    description: "Receive personalized insights on your progress and areas for improvement from our AI assistant.",
    icon: Star,
    color: "bg-gradient-to-br from-blue-500 to-cyan-500",
  },
  {
    title: "Note Summarizer & Quiz Generator",
    description: "Upload your study materials and let AI create summaries and practice quizzes for your group.",
    icon: Calendar,
    color: "bg-gradient-to-br from-cyan-500 to-teal-500",
  },
];

import { Users } from "lucide-react";

export const AIFeatures = () => {
  return (
    <section id="features" className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">AI-Powered Features</h2>
          <p className="text-gray-600">
            StudySync leverages artificial intelligence to enhance your study experience and help you achieve better results.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:translate-y-[-5px] border border-gray-100"
            >
              <div className={`w-14 h-14 rounded-full mb-6 flex items-center justify-center ${feature.color}`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-heading text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 lg:p-12">
          <div className="grid md:grid-cols-5 gap-8 items-center">
            <div className="md:col-span-3">
              <h3 className="font-heading text-2xl font-bold mb-4">
                Powered by the latest in AI technology
              </h3>
              <p className="text-gray-700 mb-6">
                Our platform uses advanced machine learning algorithms to understand each student's unique learning pattern and create optimal study environments.
              </p>
              <a 
                href="#" 
                className="inline-flex items-center px-6 py-3 text-white bg-gradient-to-r from-indigo-600 to-purple-500 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-600 transition-colors"
              >
                Explore our AI capabilities
              </a>
            </div>
            <div className="md:col-span-2">
              <div className="aspect-video bg-white rounded-lg shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-200 to-purple-100"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <img 
                    src="https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7" 
                    alt="AI Technology" 
                    className="w-full h-full object-cover opacity-70 mix-blend-overlay"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                      <span className="font-heading font-bold text-3xl bg-gradient-to-r from-indigo-600 to-purple-500 bg-clip-text text-transparent">AI</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
