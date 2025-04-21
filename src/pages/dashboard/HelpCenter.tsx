
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FAQSection from '@/components/help/FAQSection';
import ContactSupport from '@/components/help/ContactSupport';

const HelpCenter = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Help Center</h1>
        <p className="text-muted-foreground">Find answers to common questions or reach out for support</p>
      </div>

      <Tabs defaultValue="faqs" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
          <TabsTrigger value="contact">Contact Support</TabsTrigger>
        </TabsList>
        <TabsContent value="faqs">
          <FAQSection />
        </TabsContent>
        <TabsContent value="contact">
          <ContactSupport />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HelpCenter;
