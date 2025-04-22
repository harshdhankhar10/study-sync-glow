import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white/90 backdrop-blur-sm sticky top-0 z-50 w-full border-b border-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <a href="/" className="flex-shrink-0">
              <span className="font-heading font-bold text-2xl bg-gradient-to-r from-indigo-600 to-purple-500 bg-clip-text text-transparent">
                StudySync
              </span>
            </a>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <a href="#features" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">
                How It Works
              </a>
              <a href="/documentation" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">
                Documentation
              </a>
              <a href="#testimonials" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">
                Testimonials
              </a>
              <a href="#pricing" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">
                Pricing
              </a>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="flex items-center space-x-4">
              <Link to="/login" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">
                Login
              </Link>
              <Link to="/signup" className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-500 rounded-md hover:from-indigo-700 hover:to-purple-600 transition-colors">
                Sign Up
              </Link>
            </div>
          </div>
          
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white">
            <a href="#features" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600 transition-colors">
              How It Works
            </a>
            <a href="/documentation" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600 transition-colors">
              Documentation
            </a>
            <a href="#testimonials" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600 transition-colors">
              Testimonials
            </a>
            <a href="#pricing" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600 transition-colors">
              Pricing
            </a>
            <div className="pt-4 border-t border-gray-200 flex flex-col space-y-3">
              <a href="/login" className="px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600 transition-colors">
                Login
              </a>
              <a href="/signup" className="mx-3 py-2 text-center font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-500 rounded-md hover:from-indigo-700 hover:to-purple-600 transition-colors">
                Sign Up
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
