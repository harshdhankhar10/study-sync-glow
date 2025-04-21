
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, Users, Search, MapPin } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

// Mock data for demonstration purposes
const MOCK_LEARNERS = [
  { id: 1, name: "Emma Johnson", location: "London, UK", skill: "React Development", lat: 51.5074, lng: -0.1278, online: true },
  { id: 2, name: "Carlos Rodriguez", location: "Madrid, Spain", skill: "Data Science", lat: 40.4168, lng: -3.7038, online: true },
  { id: 3, name: "Aisha Patel", location: "Mumbai, India", skill: "UI/UX Design", lat: 19.0760, lng: 72.8777, online: false },
  { id: 4, name: "Liu Wei", location: "Beijing, China", skill: "Machine Learning", lat: 39.9042, lng: 116.4074, online: true },
  { id: 5, name: "James Smith", location: "New York, USA", skill: "JavaScript", lat: 40.7128, lng: -74.0060, online: true },
  { id: 6, name: "Sofia Costa", location: "Rio de Janeiro, Brazil", skill: "Python", lat: -22.9068, lng: -43.1729, online: false },
  { id: 7, name: "Hiroshi Tanaka", location: "Tokyo, Japan", skill: "Mobile Development", lat: 35.6762, lng: 139.6503, online: true },
  { id: 8, name: "Fatima Al-Farsi", location: "Dubai, UAE", skill: "Blockchain", lat: 25.2048, lng: 55.2708, online: true },
  { id: 9, name: "Alejandro Gomez", location: "Mexico City, Mexico", skill: "Web Design", lat: 19.4326, lng: -99.1332, online: false },
  { id: 10, name: "Sarah Kim", location: "Seoul, South Korea", skill: "Data Analysis", lat: 37.5665, lng: 126.9780, online: true },
  { id: 11, name: "David Nguyen", location: "Sydney, Australia", skill: "Cloud Computing", lat: -33.8688, lng: 151.2093, online: true },
  { id: 12, name: "Isabella Rossi", location: "Rome, Italy", skill: "Digital Marketing", lat: 41.9028, lng: 12.4964, online: false },
];

// Grouping skills by type for filtering
const SKILL_CATEGORIES = [
  { name: "Programming", skills: ["JavaScript", "Python", "React Development", "Mobile Development"] },
  { name: "Data", skills: ["Data Science", "Data Analysis", "Machine Learning"] },
  { name: "Design", skills: ["UI/UX Design", "Web Design"] },
  { name: "Business", skills: ["Digital Marketing", "Blockchain", "Cloud Computing"] },
];

const SkillMatchGrid = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const { toast } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [filteredLearners, setFilteredLearners] = useState(MOCK_LEARNERS);
  const [selectedLearner, setSelectedLearner] = useState<any>(null);

  useEffect(() => {
    // In a real implementation, this would be replaced with actual Mapbox integration
    const initializeMap = async () => {
      if (!mapContainer.current) return;
      
      try {
        // Simulate map loading with a colored div
        const mapEl = document.createElement('div');
        mapEl.className = 'w-full h-full rounded-lg bg-gradient-to-r from-indigo-500/10 to-purple-500/10';
        mapEl.style.position = 'relative';
        mapContainer.current.innerHTML = '';
        mapContainer.current.appendChild(mapEl);
        
        // Add placeholder dots for users
        MOCK_LEARNERS.forEach(learner => {
          const dot = document.createElement('div');
          dot.className = `absolute w-3 h-3 rounded-full ${learner.online ? 'bg-green-500' : 'bg-gray-400'} animate-pulse cursor-pointer`;
          
          // Convert geo coordinates to relative positions in the div
          // This is a simplified calculation for demonstration
          const left = ((learner.lng + 180) / 360) * 100;
          const top = ((90 - learner.lat) / 180) * 100;
          
          dot.style.left = `${left}%`;
          dot.style.top = `${top}%`;
          
          dot.addEventListener('click', () => {
            setSelectedLearner(learner);
            toast({
              title: `${learner.name}`,
              description: `Studies ${learner.skill} in ${learner.location}`,
            });
          });
          
          mapEl.appendChild(dot);
        });
        
        // Add a legend
        const legend = document.createElement('div');
        legend.className = 'absolute bottom-2 right-2 bg-white bg-opacity-80 p-2 rounded text-xs';
        legend.innerHTML = '<div class="flex items-center mb-1"><div class="w-2 h-2 bg-green-500 rounded-full mr-1"></div> Online</div><div class="flex items-center"><div class="w-2 h-2 bg-gray-400 rounded-full mr-1"></div> Offline</div>';
        mapEl.appendChild(legend);
        
        toast({
          title: "Map Loaded",
          description: "Click on dots to see learner details",
        });
      } catch (error) {
        console.error('Error initializing map:', error);
        toast({
          title: "Error",
          description: "Could not load the map. Please try again later.",
          variant: "destructive",
        });
      }
    };

    initializeMap();

    // Simulate real-time updates
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * MOCK_LEARNERS.length);
      toast({
        title: "New Learner Online",
        description: `${MOCK_LEARNERS[randomIndex].name} just started studying ${MOCK_LEARNERS[randomIndex].skill}`,
      });
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [toast]);

  // Apply filters when search input or category changes
  useEffect(() => {
    let results = [...MOCK_LEARNERS];
    
    // Apply category filter
    if (activeCategory !== "all") {
      const categorySkills = SKILL_CATEGORIES.find(cat => cat.name === activeCategory)?.skills || [];
      results = results.filter(learner => categorySkills.includes(learner.skill));
    }
    
    // Apply search filter
    if (searchInput) {
      const searchTerm = searchInput.toLowerCase();
      results = results.filter(
        learner => 
          learner.name.toLowerCase().includes(searchTerm) || 
          learner.skill.toLowerCase().includes(searchTerm) ||
          learner.location.toLowerCase().includes(searchTerm)
      );
    }
    
    setFilteredLearners(results);
  }, [searchInput, activeCategory]);

  const handleConnect = (learner: any) => {
    toast({
      title: "Connection Request Sent",
      description: `You've sent a connection request to ${learner.name}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">SkillMatch Grid</h1>
        <p className="text-muted-foreground">
          Connect with students around the world learning similar topics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Globe className="h-5 w-5 text-indigo-500" />
                  Global Learning Map
                </CardTitle>
                <CardDescription>
                  Discover students studying similar topics worldwide
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-indigo-50 border-indigo-200">
                {filteredLearners.filter(l => l.online).length} Online
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full relative rounded-lg overflow-hidden border" ref={mapContainer}>
              {/* Map will be rendered here */}
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-muted-foreground">Loading map...</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-500" />
              Learners
            </CardTitle>
            <CardDescription>
              Filter students by skills and interests
            </CardDescription>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name, skill or location..."
                className="pl-8"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="mb-4">
              <TabsList className="w-full">
                <TabsTrigger value="all" onClick={() => setActiveCategory("all")}>All</TabsTrigger>
                {SKILL_CATEGORIES.map(category => (
                  <TabsTrigger 
                    key={category.name} 
                    value={category.name}
                    onClick={() => setActiveCategory(category.name)}
                  >
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-2">
              {filteredLearners.length > 0 ? (
                filteredLearners.map(learner => (
                  <div 
                    key={learner.id} 
                    className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 transition-colors"
                    onClick={() => setSelectedLearner(learner)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${learner.online ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <div>
                        <p className="font-medium text-sm">{learner.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {learner.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-100 mb-1">
                        {learner.skill}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 text-xs"
                        onClick={() => handleConnect(learner)}
                      >
                        Connect
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No learners match your current filters.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SkillMatchGrid;
