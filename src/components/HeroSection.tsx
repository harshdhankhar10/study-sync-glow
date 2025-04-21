
import { ArrowRight } from "lucide-react";

export const HeroSection = () => {
  return (
    <section className="relative py-16 sm:py-24 overflow-hidden">
      {/* Background gradient blob */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-indigo-50 -z-10" />
      <div className="absolute top-0 -left-40 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob" />
      <div className="absolute top-0 -right-40 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-4000" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="w-full lg:w-1/2 text-center lg:text-left">
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Smarter Study, Together.
            </h1>
            <p className="text-gray-700 text-lg sm:text-xl mb-8 max-w-lg mx-auto lg:mx-0">
              AI-powered platform that helps you find the perfect study group, plan your schedule, and ace your goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a
                href="#"
                className="px-8 py-3 text-base font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-500 rounded-lg shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 hover:translate-y-[-2px]"
              >
                Get Started
              </a>
              <a
                href="#how-it-works"
                className="px-8 py-3 text-base font-medium text-indigo-700 bg-white border border-indigo-200 rounded-lg shadow hover:shadow-indigo-500/20 hover:border-indigo-300 transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                See How It Works
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
          <div className="w-full lg:w-1/2 mt-10 lg:mt-0">
            <div className="relative h-64 sm:h-80 lg:h-96 w-full">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl opacity-20"></div>
              <img
                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158"
                alt="AI Study Group"
                className="absolute inset-4 object-cover rounded-lg shadow-xl"
              />
              <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-indigo-500 bg-opacity-20 backdrop-blur-lg rounded-lg flex items-center justify-center">
                <span className="font-heading font-bold text-3xl text-indigo-600">AI</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
