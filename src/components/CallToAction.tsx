
import { ArrowRight } from "lucide-react";

export const CallToAction = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 -z-10" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white opacity-10 rounded-full" />
        <div className="absolute top-40 -left-20 w-60 h-60 bg-white opacity-10 rounded-full" />
        <div className="absolute -bottom-40 left-1/2 w-80 h-80 bg-white opacity-10 rounded-full" />
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-white">
            Join 10,000+ students already learning smarter.
          </h2>
          <p className="text-indigo-100 text-lg sm:text-xl mb-8 max-w-2xl mx-auto">
            Don't miss out on the study revolution. Create your profile today and experience the power of AI-matched study groups.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="#" 
              className="px-8 py-4 text-base font-medium text-indigo-600 bg-white rounded-lg shadow-lg hover:shadow-white/20 transition-all duration-300 hover:translate-y-[-2px]"
            >
              Create Free Account
            </a>
            <a 
              href="#" 
              className="px-8 py-4 text-base font-medium text-white border border-white/30 rounded-lg hover:bg-white/10 transition-all duration-300 flex items-center"
            >
              Watch Demo
              <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </div>
          <p className="mt-6 text-indigo-200 text-sm">
            No credit card required. Free forever for basic features.
          </p>
        </div>
      </div>
    </section>
  );
};
