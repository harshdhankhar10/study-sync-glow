
import React, { useEffect, useState, useCallback } from 'react';
import { Excalidraw, exportToBlob, serializeAsJSON } from "@excalidraw/excalidraw";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CollaborativeWhiteboardProps {
  groupId: string;
  socket: any;
}

export function CollaborativeWhiteboard({ groupId, socket }: CollaborativeWhiteboardProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [elements, setElements] = useState<ExcalidrawElement[]>([]);
  const [collaborators, setCollaborators] = useState(new Map());

  useEffect(() => {
    if (!socket || !currentUser) return;

    // Join whiteboard room
    socket.emit('whiteboard-join', {
      groupId,
      userId: currentUser.uid,
      userName: currentUser.displayName || currentUser.email
    });

    // Listen for whiteboard updates from other users
    socket.on('whiteboard-update', (data: { elements: ExcalidrawElement[] }) => {
      if (excalidrawAPI) {
        excalidrawAPI.updateScene({ elements: data.elements });
      }
    });

    // Listen for collaborator updates
    socket.on('whiteboard-collaborator-update', (data: any) => {
      setCollaborators(new Map(Object.entries(data.collaborators)));
    });

    return () => {
      socket.off('whiteboard-update');
      socket.off('whiteboard-collaborator-update');
      socket.emit('whiteboard-leave', { groupId, userId: currentUser.uid });
    };
  }, [socket, groupId, currentUser, excalidrawAPI]);

  const onChange = useCallback((elements: ExcalidrawElement[]) => {
    setElements(elements);
    if (socket && currentUser) {
      socket.emit('whiteboard-update', {
        groupId,
        userId: currentUser.uid,
        elements
      });
    }
  }, [socket, currentUser, groupId]);

  const onSaveWhiteboard = async () => {
    try {
      if (!excalidrawAPI) return;

      const blob = await exportToBlob({
        elements,
        mimeType: 'image/png',
        appState: excalidrawAPI.getAppState(),
        files: excalidrawAPI.getFiles(),
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `whiteboard-${groupId}-${new Date().toISOString()}.png`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Whiteboard saved",
        description: "Your whiteboard has been saved as an image",
      });
    } catch (error) {
      console.error('Error saving whiteboard:', error);
      toast({
        title: "Error saving whiteboard",
        description: "There was an error saving your whiteboard. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="h-full w-full">
      <div className="h-[calc(100%-2rem)] w-full rounded-lg border bg-white">
        <Excalidraw
          onChange={onChange}
          excalidrawAPI={(api) => setExcalidrawAPI(api)}
          initialData={{
            elements: elements,
            appState: {
              viewBackgroundColor: "#ffffff",
              currentItemStrokeColor: "#000000",
              currentItemBackgroundColor: "#ffffff",
              theme: "light"
            }
          }}
          UIOptions={{
            canvasActions: {
              saveAsImage: true,
              changeViewBackgroundColor: true,
              export: {
                saveFileToDisk: true
              },
              loadScene: true,
              saveToActiveFile: true,
              toggleTheme: true,
              users: true
            }
          }}
        />
      </div>
    </div>
  );
}
