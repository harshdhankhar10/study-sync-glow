
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  deleteDoc,
  doc,
  serverTimestamp, 
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Book, ExternalLink, File, FileText, Link2, Plus, Trash2, Upload } from 'lucide-react';
import { StudyGroupResource } from '@/types/studyGroups';

interface GroupResourcesProps {
  groupId: string;
}

export default function GroupResources({ groupId }: GroupResourcesProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<StudyGroupResource[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [resourceTab, setResourceTab] = useState('documents');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'document',
    url: '',
    file: null as File | null
  });
  const [uploading, setUploading] = useState(false);

  // Load resources
  useEffect(() => {
    async function loadResources() {
      if (!currentUser || !groupId) return;
      
      try {
        setLoading(true);
        
        // Fetch resources
        const resourcesRef = collection(db, 'groupResources');
        const resourcesQuery = query(
          resourcesRef,
          where('groupId', '==', groupId),
          orderBy('addedAt', 'desc')
        );
        
        const resourcesSnapshot = await getDocs(resourcesQuery);
        const resourcesData = resourcesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            description: data.description || '',
            type: data.type,
            url: data.url,
            fileId: data.fileId,
            addedBy: data.addedBy,
            addedAt: data.addedAt.toDate()
          } as StudyGroupResource;
        });
        
        setResources(resourcesData);
      } catch (error) {
        console.error("Error loading resources:", error);
        toast({
          title: "Failed to load resources",
          description: "There was an error loading the group resources. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
    
    loadResources();
  }, [currentUser, groupId, toast]);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle file input changes
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, file: e.target.files![0] }));
    }
  };

  // Handle resource type change
  const handleTypeChange = (value: string) => {
    setFormData(prev => ({ ...prev, type: value }));
  };

  // Add new resource
  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !groupId) return;
    
    try {
      setUploading(true);
      
      // Validate form data
      if (!formData.title.trim()) {
        toast({
          title: "Title required",
          description: "Please provide a title for the resource.",
          variant: "destructive"
        });
        return;
      }
      
      if (formData.type === 'link' && !formData.url.trim()) {
        toast({
          title: "URL required",
          description: "Please provide a URL for the link.",
          variant: "destructive"
        });
        return;
      }
      
      if (formData.type === 'file' && !formData.file) {
        toast({
          title: "File required",
          description: "Please select a file to upload.",
          variant: "destructive"
        });
        return;
      }
      
      let fileId = null;
      let fileUrl = null;
      
      // If it's a file, upload it to storage first
      if (formData.type === 'file' && formData.file) {
        const fileExtension = formData.file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
        const filePath = `groups/${groupId}/files/${fileName}`;
        const fileRef = ref(storage, filePath);
        
        await uploadBytes(fileRef, formData.file);
        fileUrl = await getDownloadURL(fileRef);
        fileId = filePath;
      }
      
      // Create the resource document
      await addDoc(collection(db, 'groupResources'), {
        groupId,
        title: formData.title,
        description: formData.description,
        type: formData.type,
        url: formData.type === 'link' ? formData.url : (fileUrl || ''),
        fileId: fileId,
        addedBy: currentUser.uid,
        addedByName: currentUser.displayName || currentUser.email,
        addedAt: serverTimestamp()
      });
      
      // Reset form and close dialog
      setFormData({
        title: '',
        description: '',
        type: 'document',
        url: '',
        file: null
      });
      setAddDialogOpen(false);
      
      // Refresh resources
      const resourcesRef = collection(db, 'groupResources');
      const resourcesQuery = query(
        resourcesRef,
        where('groupId', '==', groupId),
        orderBy('addedAt', 'desc')
      );
      
      const resourcesSnapshot = await getDocs(resourcesQuery);
      const resourcesData = resourcesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          description: data.description || '',
          type: data.type,
          url: data.url,
          fileId: data.fileId,
          addedBy: data.addedBy,
          addedAt: data.addedAt.toDate()
        } as StudyGroupResource;
      });
      
      setResources(resourcesData);
      
      toast({
        title: "Resource added",
        description: `"${formData.title}" has been added to the group resources.`
      });
    } catch (error) {
      console.error("Error adding resource:", error);
      toast({
        title: "Failed to add resource",
        description: "There was an error adding the resource. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  // Delete resource
  const handleDeleteResource = async (resourceId: string) => {
    if (!currentUser || !groupId) return;
    
    try {
      // Delete the resource document
      await deleteDoc(doc(db, 'groupResources', resourceId));
      
      // Update the resources list
      setResources(prev => prev.filter(r => r.id !== resourceId));
      
      toast({
        title: "Resource deleted",
        description: "The resource has been removed from the group."
      });
    } catch (error) {
      console.error("Error deleting resource:", error);
      toast({
        title: "Failed to delete resource",
        description: "There was an error deleting the resource. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'link':
        return <Link2 className="h-5 w-5 text-green-500" />;
      case 'file':
        return <File className="h-5 w-5 text-orange-500" />;
      default:
        return <Book className="h-5 w-5 text-gray-500" />;
    }
  };

  const getResourcesByType = (type: string) => {
    return resources.filter(r => r.type === type);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-20 bg-gray-200 rounded animate-pulse mt-6"></div>
        <div className="h-20 bg-gray-200 rounded animate-pulse mt-3"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Group Resources</h3>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Resource
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <form onSubmit={handleAddResource}>
              <DialogHeader>
                <DialogTitle>Add Resource</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Title
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Resource title"
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Type
                  </Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={handleTypeChange}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="document">Document / Note</SelectItem>
                      <SelectItem value="link">External Link</SelectItem>
                      <SelectItem value="file">Upload File</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {formData.type === 'link' && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="url" className="text-right">
                      URL
                    </Label>
                    <Input
                      id="url"
                      name="url"
                      type="url"
                      value={formData.url}
                      onChange={handleInputChange}
                      placeholder="https://example.com"
                      className="col-span-3"
                      required
                    />
                  </div>
                )}
                
                {formData.type === 'file' && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="file" className="text-right">
                      File
                    </Label>
                    <div className="col-span-3">
                      <Input
                        id="file"
                        name="file"
                        type="file"
                        onChange={handleFileChange}
                        className="col-span-3"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Max file size: 10MB
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="description" className="text-right pt-2">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Optional description"
                    className="col-span-3"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)} disabled={uploading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? (
                    <>
                      <Upload className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Add Resource'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Tabs defaultValue="all" onValueChange={setResourceTab} value={resourceTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {resources.length === 0 ? (
            <div className="text-center py-10">
              <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Resources Yet</h3>
              <p className="text-muted-foreground mb-6">
                Add documents, links, or files to share with your group.
              </p>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Resource
              </Button>
            </div>
          ) : (
            resources.map((resource) => (
              <Card key={resource.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <div className="flex items-center space-x-2">
                      {getResourceIcon(resource.type)}
                      <CardTitle className="text-base">{resource.title}</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteResource(resource.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription>
                    Added on {formatDate(resource.addedAt)}
                  </CardDescription>
                </CardHeader>
                {resource.description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{resource.description}</p>
                  </CardContent>
                )}
                <CardFooter>
                  {resource.type === 'link' && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={resource.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Link
                      </a>
                    </Button>
                  )}
                  {resource.type === 'file' && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={resource.url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Download File
                      </a>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))
          )}
        </TabsContent>
        
        <TabsContent value="documents" className="space-y-4">
          {getResourcesByType('document').length === 0 ? (
            <div className="text-center py-10">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Documents Yet</h3>
              <p className="text-muted-foreground mb-6">
                Add documents or notes to share with your group.
              </p>
              <Button onClick={() => {
                setFormData(prev => ({ ...prev, type: 'document' }));
                setAddDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Document
              </Button>
            </div>
          ) : (
            getResourcesByType('document').map((resource) => (
              <Card key={resource.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <CardTitle className="text-base">{resource.title}</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteResource(resource.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription>
                    Added on {formatDate(resource.addedAt)}
                  </CardDescription>
                </CardHeader>
                {resource.description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{resource.description}</p>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>
        
        <TabsContent value="links" className="space-y-4">
          {getResourcesByType('link').length === 0 ? (
            <div className="text-center py-10">
              <Link2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Links Yet</h3>
              <p className="text-muted-foreground mb-6">
                Add links to external resources to share with your group.
              </p>
              <Button onClick={() => {
                setFormData(prev => ({ ...prev, type: 'link' }));
                setAddDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Link
              </Button>
            </div>
          ) : (
            getResourcesByType('link').map((resource) => (
              <Card key={resource.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <div className="flex items-center space-x-2">
                      <Link2 className="h-5 w-5 text-green-500" />
                      <CardTitle className="text-base">{resource.title}</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteResource(resource.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription>
                    Added on {formatDate(resource.addedAt)}
                  </CardDescription>
                </CardHeader>
                {resource.description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{resource.description}</p>
                  </CardContent>
                )}
                <CardFooter>
                  <Button variant="outline" size="sm" asChild>
                    <a href={resource.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Link
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </TabsContent>
        
        <TabsContent value="files" className="space-y-4">
          {getResourcesByType('file').length === 0 ? (
            <div className="text-center py-10">
              <File className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Files Yet</h3>
              <p className="text-muted-foreground mb-6">
                Upload files to share with your group.
              </p>
              <Button onClick={() => {
                setFormData(prev => ({ ...prev, type: 'file' }));
                setAddDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Upload File
              </Button>
            </div>
          ) : (
            getResourcesByType('file').map((resource) => (
              <Card key={resource.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <div className="flex items-center space-x-2">
                      <File className="h-5 w-5 text-orange-500" />
                      <CardTitle className="text-base">{resource.title}</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteResource(resource.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription>
                    Added on {formatDate(resource.addedAt)}
                  </CardDescription>
                </CardHeader>
                {resource.description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{resource.description}</p>
                  </CardContent>
                )}
                <CardFooter>
                  <Button variant="outline" size="sm" asChild>
                    <a href={resource.url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Fix missing Download icon
import { Download } from 'lucide-react';
