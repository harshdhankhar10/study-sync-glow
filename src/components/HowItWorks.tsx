
import { BookOpen, Users, LightbulbOff as Lightbulb } from "lucide-react";

const steps = [
  {
    title: "Create Your Profile",
    description: "Tell us your goals, subjects, and available times to study.",
    icon: BookOpen,
    color: "from-purple-600 to-indigo-600",
  },
  {
    title: "Get Matched by AI",
    description: "Our AI algorithm finds your ideal study partners based on compatibility.",
    icon: Lightbulb,
    color: "from-indigo-600 to-blue-600",
  },
  {
    title: "Start Studying with Your Group",
    description: "Meet virtually or in-person, follow AI-generated study plans, and track progress.",
    icon: Users,
    color: "from-blue-600 to-cyan-600",
  },
];

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">How StudySync Works</h2>
          <p className="text-gray-600">
            Getting started is easy! Follow these simple steps to find your perfect study group.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-shadow duration-300"
            >
              <div className={`w-14 h-14 rounded-lg mb-6 flex items-center justify-center bg-gradient-to-br ${step.color}`}>
                <step.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-heading text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-heading font-bold">
                  {index + 1}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <a 
            href="#" 
            className="inline-flex items-center px-6 py-3 border border-indigo-300 text-indigo-600 bg-white rounded-lg hover:bg-indigo-50 transition-colors font-medium"
          >
            Learn more about our matching algorithm
            <ArrowRight className="w-4 h-4 ml-2" />
          </a>
        </div>
      </div>
    </section>
  );
};

import { ArrowRight } from "lucide-react";
