import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Trash2, Upload, ArrowRight, Brain, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";
import { toast } from "sonner";
import { Note, addNote, deleteNote, generateSummaryForNote, getUserNotes, updateNote, uploadNoteFile, MAX_FILE_SIZE } from "@/lib/noteService";

const Notes = () => {
  const { currentUser } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteTags, setNewNoteTags] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filterTag, setFilterTag] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchNotes();
    }
  }, [currentUser]);

  const fetchNotes = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const fetchedNotes = await getUserNotes(currentUser.uid);
      setNotes(fetchedNotes);
      
      if (fetchedNotes.length > 0 && !activeNote) {
        setActiveNote(fetchedNotes[0]);
      }
    } catch (error) {
      toast.error("Failed to fetch notes");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!currentUser) return;
    if (!newNoteTitle.trim()) {
      toast.error("Please enter a title for your note");
      return;
    }

    setIsCreating(true);
    try {
      const tags = newNoteTags
        .split(",")
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      let fileUrl = "";
      let fileName = "";
      let fileType = "";
      let fileSize = 0;
      
      if (selectedFile) {
        fileUrl = await uploadNoteFile(currentUser.uid, selectedFile);
        fileName = selectedFile.name;
        fileType = selectedFile.type;
        fileSize = selectedFile.size;
      }
      
      const newNote: Omit<Note, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: currentUser.uid,
        title: newNoteTitle,
        content: newNoteContent,
        tags,
        fileUrl,
        fileName,
        fileType,
        fileSize
      };
      
      const noteId = await addNote(newNote);
      
      setNewNoteTitle("");
      setNewNoteContent("");
      setNewNoteTags("");
      setSelectedFile(null);
      setIsCreating(false);
      
      fetchNotes();
      
      toast.success("Note created successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to create note");
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteNote = async (noteId: string, fileUrl?: string) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    
    try {
      await deleteNote(noteId, fileUrl);
      
      setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
      
      if (activeNote && activeNote.id === noteId) {
        setActiveNote(null);
      }
      
      toast.success("Note deleted successfully");
    } catch (error) {
      toast.error("Failed to delete note");
      console.error(error);
    }
  };

  const handleGenerateSummary = async (noteId: string) => {
    setIsGeneratingSummary(true);
    try {
      await generateSummaryForNote(noteId);
      
      await fetchNotes();
      
      toast.success("Summary generated successfully");
    } catch (error) {
      toast.error("Failed to generate summary");
      console.error(error);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File size exceeds the maximum limit of 5MB");
      return;
    }
    
    setSelectedFile(file);
  };

  const filteredNotes = notes
    .filter(note => {
      if (filterTag && !note.tags.includes(filterTag)) {
        return false;
      }
      
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          note.title.toLowerCase().includes(searchLower) ||
          note.content.toLowerCase().includes(searchLower) ||
          note.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }
      
      return true;
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const allTags = Array.from(new Set(notes.flatMap(note => note.tags))).sort();

  const openSummaryInNewTab = (summary: string, title: string) => {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>Summary: ${title}</title>
            <style>
              body { 
                font-family: system-ui; 
                padding: 2rem; 
                max-width: 800px; 
                margin: 0 auto; 
                line-height: 1.8;
                color: #333;
                background: #F8F9FC;
              }
              h1 { 
                color: #6E59A5; 
                font-size: 2rem;
                margin-bottom: 2rem;
                border-bottom: 2px solid #E5DEFF;
                padding-bottom: 1rem;
              }
              .metadata {
                color: #666;
                font-size: 0.9rem;
                margin-bottom: 2rem;
              }
              .content { 
                white-space: pre-wrap; 
                line-height: 1.8;
                background: white;
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
              }
              .highlight {
                background: #E5DEFF;
                padding: 0.2rem 0.4rem;
                border-radius: 4px;
                font-weight: 500;
              }
              .key-point {
                border-left: 3px solid #6E59A5;
                padding-left: 1rem;
                margin: 1rem 0;
              }
            </style>
          </head>
          <body>
            <h1>AI Summary: ${title}</h1>
            <div class="metadata">
              Generated on ${format(new Date(), 'MMMM d, yyyy • h:mm a')}
            </div>
            <div class="content">${summary}</div>
          </body>
        </html>
      `);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Notes & Tools</h1>
          <p className="text-muted-foreground">Smart note management powered by Gemini AI</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={16} />
              New Note
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>Create New Note</DialogTitle>
              <DialogDescription>
                Create a new note or upload a file to take advantage of AI-powered summarization.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Note title"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Write your note here..."
                  className="min-h-[200px]"
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  placeholder="study, math, lecture"
                  value={newNoteTags}
                  onChange={(e) => setNewNoteTags(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="file">Attach File (Max 5MB)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.txt,.md,.ppt,.pptx"
                  />
                </div>
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={handleCreateNote} 
                disabled={isCreating || !newNoteTitle.trim()}
              >
                {isCreating ? "Creating..." : "Create Note"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="my-notes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-notes">My Notes</TabsTrigger>
          <TabsTrigger value="ai-tools">AI Tools</TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-notes" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle>Notes</CardTitle>
                    <Badge variant="outline">{notes.length}</Badge>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Input
                      placeholder="Search notes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <ScrollArea className="h-14 w-full">
                      <div className="flex flex-wrap gap-1">
                        <Badge 
                          variant={filterTag === "" ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => setFilterTag("")}
                        >
                          All
                        </Badge>
                        {allTags.map(tag => (
                          <Badge 
                            key={tag}
                            variant={filterTag === tag ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => setFilterTag(tag === filterTag ? "" : tag)}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center">Loading notes...</div>
                  ) : filteredNotes.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No notes found</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4"
                        onClick={() => {
                          setFilterTag("");
                          setSearchTerm("");
                        }}
                      >
                        Clear filters
                      </Button>
                    </div>
                  ) : (
                    <ScrollArea className="h-[60vh]">
                      <div className="space-y-2">
                        {filteredNotes.map(note => (
                          <div 
                            key={note.id} 
                            className={`p-3 rounded-md cursor-pointer border transition-all hover:bg-accent ${
                              activeNote?.id === note.id ? "bg-accent" : ""
                            }`}
                            onClick={() => setActiveNote(note)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3 className="font-medium truncate">{note.title}</h3>
                                <p className="text-sm text-muted-foreground truncate">
                                  {note.content.slice(0, 60)}{note.content.length > 60 ? "..." : ""}
                                </p>
                                <div className="flex items-center gap-1 mt-2">
                                  {note.tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                                  ))}
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (note.id) {
                                    handleDeleteNote(note.id, note.fileUrl);
                                  }
                                }}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              {note.updatedAt && format(new Date(note.updatedAt), "MMM d, yyyy • h:mm a")}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-2">
              <Card className="h-full">
                {activeNote ? (
                  <>
                    <CardHeader>
                      <CardTitle>{activeNote.title}</CardTitle>
                      <CardDescription>
                        Last updated: {format(new Date(activeNote.updatedAt), "MMMM d, yyyy • h:mm a")}
                      </CardDescription>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {activeNote.tags.map(tag => (
                          <Badge key={tag} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                      {activeNote.fileName && (
                        <Alert className="mt-2">
                          <FileText className="h-4 w-4" />
                          <AlertTitle>Attached File</AlertTitle>
                          <AlertDescription>
                            <a 
                              href={activeNote.fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary underline"
                            >
                              {activeNote.fileName} ({(activeNote.fileSize! / 1024 / 1024).toFixed(2)} MB)
                            </a>
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[40vh]">
                        <div className="space-y-4">
                          <div className="whitespace-pre-wrap">{activeNote.content}</div>
                          
                          {activeNote.summary && (
                            <div className="mt-6 space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                                  <Brain size={20} />
                                  AI-Generated Summary
                                </h3>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openSummaryInNewTab(activeNote.summary!, activeNote.title)}
                                  className="hover:bg-primary/10"
                                >
                                  <ExternalLink size={16} className="mr-2" />
                                  Open in New Tab
                                </Button>
                              </div>
                              <Separator className="my-2" />
                              <div className="bg-primary p-6 rounded-lg border border-primary/20 space-y-4">
                                <div className="prose prose-slate max-w-none">
                                  {activeNote.summary.split('\n').map((paragraph, index) => {
                                    if (paragraph.startsWith('•')) {
                                      return (
                                        <p key={index} className="text-primary-foreground flex items-start gap-2">
                                          <span className="text-primary-foreground/80">•</span>
                                          <span className="flex-1">{paragraph.substring(1)}</span>
                                        </p>
                                      );
                                    }
                                    
                                    if (paragraph.includes(':')) {
                                      const [title, content] = paragraph.split(':');
                                      return (
                                        <p key={index} className="text-primary-foreground">
                                          <strong className="text-primary-foreground/90 font-bold">
                                            {title}:
                                          </strong>
                                          <span className="ml-2">{content}</span>
                                        </p>
                                      );
                                    }
                                    
                                    if (paragraph.toLowerCase().includes('key point') || 
                                        paragraph.toLowerCase().includes('important') ||
                                        paragraph.toLowerCase().includes('conclusion')) {
                                      return (
                                        <p key={index} className="text-primary-foreground font-semibold border-l-4 border-primary-foreground/20 pl-4">
                                          {paragraph}
                                        </p>
                                      );
                                    }
                                    
                                    return (
                                      <p key={index} className="text-primary-foreground leading-relaxed">
                                        {paragraph}
                                      </p>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                    <CardFooter>
                      <Button
                        onClick={() => activeNote.id && handleGenerateSummary(activeNote.id)}
                        disabled={isGeneratingSummary || !activeNote.content}
                        className="ml-auto"
                      >
                        {isGeneratingSummary ? "Generating..." : activeNote.summary ? "Regenerate Summary" : "Generate AI Summary"}
                      </Button>
                    </CardFooter>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[70vh]">
                    <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-medium mb-2">No note selected</h3>
                    <p className="text-muted-foreground text-center max-w-md mb-4">
                      Select a note from the list to view its content or create a new note to get started.
                    </p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus size={16} className="mr-2" />
                          Create New Note
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[625px]">
                        <DialogHeader>
                          <DialogTitle>Create New Note</DialogTitle>
                          <DialogDescription>
                            Create a new note or upload a file to take advantage of AI-powered summarization.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                              id="title"
                              placeholder="Note title"
                              value={newNoteTitle}
                              onChange={(e) => setNewNoteTitle(e.target.value)}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="content">Content</Label>
                            <Textarea
                              id="content"
                              placeholder="Write your note here..."
                              className="min-h-[200px]"
                              value={newNoteContent}
                              onChange={(e) => setNewNoteContent(e.target.value)}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="tags">Tags (comma separated)</Label>
                            <Input
                              id="tags"
                              placeholder="study, lecture, document"
                              value={newNoteTags}
                              onChange={(e) => setNewNoteTags(e.target.value)}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="file">Attach File (Max 5MB)</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="file"
                                type="file"
                                onChange={handleFileSelect}
                                accept=".pdf,.doc,.docx,.txt,.md,.ppt,.pptx"
                              />
                            </div>
                            {selectedFile && (
                              <p className="text-sm text-muted-foreground">
                                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                              </p>
                            )}
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            onClick={handleCreateNote} 
                            disabled={isCreating || !newNoteTitle.trim()}
                          >
                            {isCreating ? "Creating..." : "Create Note"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="ai-tools" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload & Summarize</CardTitle>
                <CardDescription>
                  Upload notes or documents and get AI-powered summaries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Drag and drop your file here, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Supports PDF, DOCX, TXT, MD (Max: 5MB)
                    </p>
                    <Input 
                      id="file-upload" 
                      type="file" 
                      className="hidden" 
                      onChange={handleFileSelect} 
                      accept=".pdf,.doc,.docx,.txt,.md,.ppt,.pptx"
                    />
                    <label htmlFor="file-upload">
                      <Button variant="outline" size="sm" className="cursor-pointer" asChild>
                        <span>Choose File</span>
                      </Button>
                    </label>
                  </div>
                  
                  {selectedFile && (
                    <Alert>
                      <FileText className="h-4 w-4" />
                      <AlertTitle>Selected File</AlertTitle>
                      <AlertDescription>
                        {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedFile(null)}
                  disabled={!selectedFile}
                >
                  Clear
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button disabled={!selectedFile}>
                      Continue
                      <ArrowRight size={16} className="ml-1" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Note From File</DialogTitle>
                      <DialogDescription>
                        Add details to create a new note with your uploaded file
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="upload-title">Title</Label>
                        <Input
                          id="upload-title"
                          placeholder="Note title"
                          value={newNoteTitle}
                          onChange={(e) => setNewNoteTitle(e.target.value)}
                          defaultValue={selectedFile?.name.split(".")[0] || ""}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="upload-tags">Tags (comma separated)</Label>
                        <Input
                          id="upload-tags"
                          placeholder="study, lecture, document"
                          value={newNoteTags}
                          onChange={(e) => setNewNoteTags(e.target.value)}
                        />
                      </div>
                      <Alert>
                        <FileText className="h-4 w-4" />
                        <AlertTitle>Selected File</AlertTitle>
                        <AlertDescription>
                          {selectedFile?.name} ({selectedFile ? (selectedFile.size / 1024 / 1024).toFixed(2) : 0} MB)
                        </AlertDescription>
                      </Alert>
                      {activeNote?.summary && (
                        <div className="mt-4">
                          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                            <Brain size={18} />
                            Generated Summary
                          </h3>
                          <div className="bg-accent/50 p-4 rounded-md">
                            <div className="whitespace-pre-wrap">{activeNote.summary}</div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => openSummaryInNewTab(activeNote.summary!, activeNote.title)}
                            >
                              <ExternalLink size={16} className="mr-1" />
                              Open in New Tab
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button 
                        onClick={handleCreateNote} 
                        disabled={isCreating || !newNoteTitle.trim() || !selectedFile}
                      >
                        {isCreating ? "Creating..." : "Create Note & Generate Summary"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Summary Generator</CardTitle>
                <CardDescription>
                  Convert long notes into concise summaries with key points
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-3">
                    <Label htmlFor="summary-input">Paste text to summarize</Label>
                    <Textarea
                      id="summary-input"
                      placeholder="Paste or type the text you want to summarize..."
                      className="min-h-[180px]"
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setNewNoteContent("")}
                  disabled={!newNoteContent}
                >
                  Clear
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button disabled={!newNoteContent}>
                      Summarize
                      <Brain size={16} className="ml-1" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Save & Summarize</DialogTitle>
                      <DialogDescription>
                        Save your text as a note and generate an AI summary
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="summary-title">Title</Label>
                        <Input
                          id="summary-title"
                          placeholder="Note title"
                          value={newNoteTitle}
                          onChange={(e) => setNewNoteTitle(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="summary-tags">Tags (comma separated)</Label>
                        <Input
                          id="summary-tags"
                          placeholder="summary, ai, notes"
                          value={newNoteTags}
                          onChange={(e) => setNewNoteTags(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        onClick={handleCreateNote} 
                        disabled={isCreating || !newNoteTitle.trim() || !newNoteContent}
                      >
                        {isCreating ? "Creating..." : "Save & Generate Summary"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
              <CardDescription>
                Learn how to get the most out of AI-powered note tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium">1. Create or Upload Notes</h3>
                  <p className="text-sm text-muted-foreground">
                    Create notes manually or upload files up to 5MB in various formats including PDF, DOCX, and TXT.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                    <Brain className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium">2. Generate AI Summaries</h3>
                  <p className="text-sm text-muted-foreground">
                    Our AI instantly analyzes your notes and creates concise summaries focusing on key points and main ideas.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                    <ArrowRight className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium">3. Review & Organize</h3>
                  <p className="text-sm text-muted-foreground">
                    Easily access both your original notes and AI summaries, organized with tags for quick reference and review.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Notes;
