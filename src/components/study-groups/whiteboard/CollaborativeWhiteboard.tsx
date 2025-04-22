
import React, { useEffect, useRef, useState } from 'react';
import { Canvas, Circle, Rect, IText, Path, StaticCanvas } from 'fabric';
import { WhiteboardToolbar } from './WhiteboardToolbar';
import { UserCursor } from './UserCursor';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, setDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';

interface CollaborativeWhiteboardProps {
  groupId: string;
  socket: any;
}

type WhiteboardCursor = {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  lastUpdate: number;
};

export function CollaborativeWhiteboard({ groupId, socket }: CollaborativeWhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [activeTool, setActiveTool] = useState<string>('select');
  const [activeColor, setActiveColor] = useState<string>('#000000');
  const [brushSize, setBrushSize] = useState<number>(2);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [cursors, setCursors] = useState<WhiteboardCursor[]>([]);
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  // Track last event to prevent duplicates
  const lastEventRef = useRef<string>('');
  const mousePositionRef = useRef<{ x: number, y: number }>({ x: 0, y: 0 });
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  
  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || canvas) return;
    
    const fabricCanvas = new Canvas(canvasRef.current, {
      width: canvasRef.current.offsetWidth,
      height: 500,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
      isDrawingMode: false,
    });
    
    // Set up basic drawing brush
    fabricCanvas.freeDrawingBrush.color = activeColor;
    fabricCanvas.freeDrawingBrush.width = brushSize;
    
    setCanvas(fabricCanvas);
    
    // Emit join event
    if (socket && currentUser) {
      socket.emit('whiteboard-join', {
        groupId,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email
      });
      
      // Save whiteboard session to Firestore
      const whiteboardSessionRef = doc(collection(db, 'whiteboardSessions'), `${groupId}-${Date.now()}`);
      setDoc(whiteboardSessionRef, {
        groupId,
        createdAt: Timestamp.now(),
        participants: [{
          userId: currentUser.uid,
          name: currentUser.displayName || currentUser.email,
          joinedAt: Timestamp.now()
        }],
        objects: [],
      }).catch(err => console.error("Error saving whiteboard session:", err));
    }
    
    // Handle window resize
    const handleResize = () => {
      if (canvasRef.current && fabricCanvas) {
        fabricCanvas.setDimensions({
          width: canvasRef.current.offsetWidth,
          height: 500
        });
        fabricCanvas.renderAll();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      fabricCanvas.dispose();
      window.removeEventListener('resize', handleResize);
      
      // Emit leave event
      if (socket && currentUser) {
        socket.emit('whiteboard-leave', {
          groupId,
          userId: currentUser.uid
        });
      }
    };
  }, [canvasRef, groupId, socket, currentUser]);
  
  // Set up socket listeners
  useEffect(() => {
    if (!socket || !canvas) return;
    
    // Handle object added event
    socket.on('whiteboard-object-added', (data: any) => {
      if (data.userId === currentUser?.uid) return; // Skip if I'm the sender
      
      if (lastEventRef.current === JSON.stringify(data)) return; // Skip duplicates
      
      try {
        // Add object to canvas based on type
        switch (data.objectType) {
          case 'rect':
            const rect = new Rect({
              left: data.left,
              top: data.top,
              width: data.width,
              height: data.height,
              fill: data.fill,
              stroke: data.stroke,
              strokeWidth: data.strokeWidth,
            });
            canvas.add(rect);
            break;
            
          case 'circle':
            const circle = new Circle({
              left: data.left,
              top: data.top,
              radius: data.radius,
              fill: data.fill,
              stroke: data.stroke,
              strokeWidth: data.strokeWidth,
            });
            canvas.add(circle);
            break;
            
          case 'text':
            const text = new IText(data.text, {
              left: data.left,
              top: data.top,
              fill: data.fill,
              fontSize: data.fontSize,
              fontFamily: data.fontFamily,
            });
            canvas.add(text);
            break;
            
          case 'path':
            const path = new Path(data.path, {
              stroke: data.stroke,
              strokeWidth: data.strokeWidth,
              fill: null,
            });
            canvas.add(path);
            break;
            
          default:
            console.log("Unknown object type received:", data);
        }
        
        canvas.renderAll();
      } catch (error) {
        console.error("Error handling whiteboard object:", error);
      }
    });
    
    // Handle clear event
    socket.on('whiteboard-clear', (data: any) => {
      if (data.userId === currentUser?.uid) return; // Skip if I'm the sender
      canvas.clear();
      canvas.backgroundColor = '#ffffff';
      canvas.renderAll();
    });
    
    // Handle cursor updates
    socket.on('whiteboard-cursor-update', (data: WhiteboardCursor) => {
      if (data.id === currentUser?.uid) return; // Skip if it's my cursor
      
      setCursors(prevCursors => {
        // Check if cursor already exists
        const existingCursorIndex = prevCursors.findIndex(c => c.id === data.id);
        
        if (existingCursorIndex >= 0) {
          // Update existing cursor
          const newCursors = [...prevCursors];
          newCursors[existingCursorIndex] = data;
          return newCursors;
        } else {
          // Add new cursor
          return [...prevCursors, data];
        }
      });
    });
    
    // Clean up on disconnect
    socket.on('whiteboard-user-left', (data: { userId: string }) => {
      setCursors(prevCursors => prevCursors.filter(cursor => cursor.id !== data.userId));
    });
    
    return () => {
      socket.off('whiteboard-object-added');
      socket.off('whiteboard-clear');
      socket.off('whiteboard-cursor-update');
      socket.off('whiteboard-user-left');
    };
  }, [socket, canvas, currentUser]);
  
  // Handle tool changes
  useEffect(() => {
    if (!canvas) return;
    
    canvas.isDrawingMode = activeTool === 'draw';
    
    if (activeTool === 'draw') {
      canvas.freeDrawingBrush.color = activeColor;
      canvas.freeDrawingBrush.width = brushSize;
    }
    
  }, [activeTool, activeColor, brushSize, canvas]);
  
  // Mouse move handler for cursor position
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasContainerRef.current || !socket || !currentUser) return;
    
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    mousePositionRef.current = { x, y };
    
    // Only emit cursor updates occasionally to avoid flooding
    socket.emit('whiteboard-cursor-update', {
      groupId,
      cursor: {
        id: currentUser.uid,
        name: currentUser.displayName || currentUser.email,
        color: '#9b87f5', // Use a consistent color for now
        x,
        y,
        lastUpdate: Date.now()
      }
    });
  };
  
  // Handle tool changes
  const handleToolChange = (tool: string) => {
    setActiveTool(tool);
    
    if (tool === 'text' && canvas) {
      // Add a text object at the center of the canvas
      const text = new IText("Text", {
        left: canvas.width! / 2,
        top: canvas.height! / 2,
        fontSize: 20,
        fill: activeColor,
        fontFamily: 'Arial',
        editable: true,
      });
      
      canvas.add(text);
      canvas.setActiveObject(text);
      text.enterEditing();
      text.selectAll();
      
      // Emit text object
      socket.emit('whiteboard-object-added', {
        groupId,
        userId: currentUser?.uid,
        objectType: 'text',
        left: text.left,
        top: text.top,
        text: text.text,
        fill: activeColor,
        fontSize: 20,
        fontFamily: 'Arial',
      });
    } else if (tool === 'rect' && canvas) {
      // Create a rectangle at the mouse position
      const rect = new Rect({
        left: mousePositionRef.current.x - 50,
        top: mousePositionRef.current.y - 50,
        width: 100,
        height: 100,
        fill: activeColor,
        stroke: activeColor,
        strokeWidth: 2,
      });
      
      canvas.add(rect);
      canvas.setActiveObject(rect);
      
      // Emit rectangle object
      socket.emit('whiteboard-object-added', {
        groupId,
        userId: currentUser?.uid,
        objectType: 'rect',
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        fill: activeColor,
        stroke: activeColor,
        strokeWidth: 2,
      });
    } else if (tool === 'circle' && canvas) {
      // Create a circle at the mouse position
      const circle = new Circle({
        left: mousePositionRef.current.x - 50,
        top: mousePositionRef.current.y - 50,
        radius: 50,
        fill: activeColor,
        stroke: activeColor,
        strokeWidth: 2,
      });
      
      canvas.add(circle);
      canvas.setActiveObject(circle);
      
      // Emit circle object
      socket.emit('whiteboard-object-added', {
        groupId,
        userId: currentUser?.uid,
        objectType: 'circle',
        left: circle.left,
        top: circle.top,
        radius: circle.radius,
        fill: activeColor,
        stroke: activeColor,
        strokeWidth: 2,
      });
    }
  };
  
  // Handle color changes
  const handleColorChange = (color: string) => {
    setActiveColor(color);
    
    if (canvas) {
      canvas.freeDrawingBrush.color = color;
      
      // Update selected object color if applicable
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        if (activeObject.type === 'i-text') {
          (activeObject as IText).set('fill', color);
        } else {
          activeObject.set('fill', color);
          activeObject.set('stroke', color);
        }
        canvas.renderAll();
      }
    }
  };
  
  // Handle brush size changes
  const handleBrushSizeChange = (size: number) => {
    setBrushSize(size);
    
    if (canvas) {
      canvas.freeDrawingBrush.width = size;
      
      // Update selected object stroke width if applicable
      const activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type !== 'i-text') {
        activeObject.set('strokeWidth', size);
        canvas.renderAll();
      }
    }
  };
  
  // Handle clear canvas
  const handleClearCanvas = () => {
    if (!canvas || !socket || !currentUser) return;
    
    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    canvas.renderAll();
    
    socket.emit('whiteboard-clear', {
      groupId,
      userId: currentUser.uid,
    });
    
    toast({
      title: "Whiteboard cleared",
      description: "All users can now see the clean whiteboard",
    });
  };
  
  // Canvas path creation handler
  useEffect(() => {
    if (!canvas || !socket || !currentUser) return;
    
    canvas.on('path:created', (e) => {
      const path = e.path;
      
      // Emit the path to other clients
      socket.emit('whiteboard-object-added', {
        groupId,
        userId: currentUser.uid,
        objectType: 'path',
        path: path.path,
        stroke: path.stroke,
        strokeWidth: path.strokeWidth,
      });
      
      // Save to lastEventRef to avoid duplicates
      lastEventRef.current = JSON.stringify({
        groupId,
        userId: currentUser.uid,
        objectType: 'path',
        path: path.path,
        stroke: path.stroke,
        strokeWidth: path.strokeWidth,
      });
    });
    
    return () => {
      canvas.off('path:created');
    };
  }, [canvas, socket, currentUser, groupId]);
  
  // Clean up stale cursors
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setCursors(prevCursors => 
        prevCursors.filter(cursor => now - cursor.lastUpdate < 10000) // Remove cursors inactive for more than 10 seconds
      );
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="flex flex-col gap-2">
      <WhiteboardToolbar
        activeTool={activeTool}
        activeColor={activeColor}
        brushSize={brushSize}
        onToolChange={handleToolChange}
        onColorChange={handleColorChange}
        onBrushSizeChange={handleBrushSizeChange}
        onClear={handleClearCanvas}
      />
      
      <div 
        className="relative border rounded-md overflow-hidden bg-white"
        ref={canvasContainerRef}
        onMouseMove={handleMouseMove}
      >
        <canvas ref={canvasRef} />
        
        {/* Render user cursors */}
        {cursors.map((cursor) => (
          <UserCursor
            key={cursor.id}
            user={{
              id: cursor.id,
              name: cursor.name,
              color: cursor.color
            }}
            position={{
              x: cursor.x,
              y: cursor.y
            }}
          />
        ))}
        
        {/* Active users indicator */}
        <div className="absolute top-2 right-2 flex -space-x-2">
          {[...new Set([...cursors.map(c => c.id), currentUser?.uid])].slice(0, 5).map((userId, index) => {
            const cursor = cursors.find(c => c.id === userId);
            const name = cursor?.name || (userId === currentUser?.uid ? (currentUser?.displayName || currentUser?.email) : 'Unknown');
            const initials = name
              .split(' ')
              .map(name => name.charAt(0))
              .join('')
              .toUpperCase();
              
            return (
              <Avatar key={userId || index} className="h-6 w-6 border-2 border-white">
                <AvatarFallback 
                  className="text-xs"
                  style={{ 
                    backgroundColor: userId === currentUser?.uid ? '#9b87f5' : cursor?.color || '#ccc',
                    color: 'white'
                  }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
            );
          })}
        </div>
      </div>
    </div>
  );
}
