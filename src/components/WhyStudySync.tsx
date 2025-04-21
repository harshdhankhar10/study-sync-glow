
import { Check } from "lucide-react";

const comparisonPoints = [
  {
    studySync: "AI-powered group matching",
    traditional: "Random group formation",
  },
  {
    studySync: "Personalized study plans",
    traditional: "Generic study guides",
  },
  {
    studySync: "Intelligent scheduling",
    traditional: "Manual coordination",
  },
  {
    studySync: "Progress tracking & insights",
    traditional: "No performance analytics",
  },
  {
    studySync: "Note summarizer & quiz generator",
    traditional: "Manual note-taking",
  },
];

export const WhyStudySync = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">Why StudySync?</h2>
          <p className="text-gray-600">
            See how our AI-powered platform compares to traditional study groups.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4">
            <div className="col-span-1 px-6 font-medium">Comparison</div>
            <div className="col-span-1 px-6 font-medium text-center">StudySync</div>
            <div className="col-span-1 px-6 font-medium text-center">Traditional Study Groups</div>
          </div>
          
          {/* Table Body */}
          {comparisonPoints.map((point, index) => (
            <div 
              key={index} 
              className={`grid grid-cols-3 py-4 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
            >
              <div className="col-span-1 px-6 font-medium text-gray-700">
                {Object.keys(point)[0].replace(/([A-Z])/g, ' $1').trim()}
              </div>
              <div className="col-span-1 px-6 text-center text-gray-800 flex items-center justify-center">
                <div className="flex items-center">
                  <div className="bg-indigo-100 text-indigo-600 rounded-full p-1 mr-2">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>{point.studySync}</span>
                </div>
              </div>
              <div className="col-span-1 px-6 text-center text-gray-600">
                {point.traditional}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-lg text-gray-700 mb-6">
            Join thousands of students who are already experiencing the benefits of AI-powered studying.
          </p>
          <a 
            href="#" 
            className="inline-flex items-center px-8 py-3 text-base font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-500 rounded-lg shadow-lg hover:shadow-indigo-500/30 transition-all duration-300"
          >
            Get Started for Free
          </a>
        </div>
      </div>
    </section>
  );
};
