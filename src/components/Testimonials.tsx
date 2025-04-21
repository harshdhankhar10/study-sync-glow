
import { Star } from "lucide-react";
import { useState } from "react";

const testimonials = [
  {
    name: "Alex Johnson",
    role: "Computer Science Student",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    quote: "StudySync helped me connect with the perfect study partners for my AI course. Our group's diverse backgrounds actually helped us tackle problems from different angles.",
    stars: 5,
  },
  {
    name: "Sophia Lee",
    role: "Pre-Med Student",
    image: "https://randomuser.me/api/portraits/women/44.jpg",
    quote: "The personalized study plans were a game-changer for our biochem group. We've all seen our grades improve significantly since using the platform.",
    stars: 5,
  },
  {
    name: "Marcus Williams",
    role: "MBA Student",
    image: "https://randomuser.me/api/portraits/men/22.jpg",
    quote: "As a working professional pursuing my MBA, finding time to study was challenging. StudySync matched me with others on a similar schedule, making group sessions actually possible.",
    stars: 4,
  },
  {
    name: "Priya Patel",
    role: "Engineering Student",
    image: "https://randomuser.me/api/portraits/women/63.jpg",
    quote: "The AI quiz generator is incredible! It helped our group prepare for exams by focusing on the concepts we struggled with most. Highly recommend!",
    stars: 5,
  },
];

export const Testimonials = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const nextTestimonial = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section id="testimonials" className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">What Students Are Saying</h2>
          <p className="text-gray-600">
            Don't just take our word for it. Hear from students who have transformed their study experiences.
          </p>
        </div>

        {/* Desktop Testimonials Grid */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
              <div className="flex-1">
                <div className="flex space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${i < testimonial.stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <p className="text-gray-600 italic mb-6">"{testimonial.quote}"</p>
              </div>
              <div className="flex items-center mt-4">
                <img 
                  src={testimonial.image} 
                  alt={testimonial.name} 
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <p className="font-medium text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Testimonials Carousel */}
        <div className="md:hidden">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex space-x-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-4 h-4 ${i < testimonials[activeIndex].stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <p className="text-gray-600 italic mb-6">"{testimonials[activeIndex].quote}"</p>
            <div className="flex items-center mt-4">
              <img 
                src={testimonials[activeIndex].image} 
                alt={testimonials[activeIndex].name} 
                className="w-12 h-12 rounded-full mr-4"
              />
              <div>
                <p className="font-medium text-gray-900">{testimonials[activeIndex].name}</p>
                <p className="text-sm text-gray-500">{testimonials[activeIndex].role}</p>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button 
                onClick={prevTestimonial}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button 
                onClick={nextTestimonial}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
