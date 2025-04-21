
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { HowItWorks } from "@/components/HowItWorks";
import { AIFeatures } from "@/components/AIFeatures";
import { Testimonials } from "@/components/Testimonials";
import { WhyStudySync } from "@/components/WhyStudySync";
import { CallToAction } from "@/components/CallToAction";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <AIFeatures />
      <Testimonials />
      <WhyStudySync />
      <CallToAction />
      <Footer />
    </div>
  );
};

export default Index;
