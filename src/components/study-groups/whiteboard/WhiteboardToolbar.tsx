import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Pencil, Square, Circle, Trash, Text, Shapes, Brush } from 'lucide-react';

interface WhiteboardToolbarProps {
  activeTool: string;
  activeColor: string;
  brushSize: number;
  onToolChange: (tool: string) => void;
  onColorChange: (color: string) => void;
  onBrushSizeChange: (size: number) => void;
  onClear: () => void;
}

const colorOptions = [
  { name: 'Black', value: '#000000' },
  { name: 'Red', value: '#FF0000' },
  { name: 'Green', value: '#00FF00' },
  { name: 'Blue', value: '#0000FF' },
  { name: 'Yellow', value: '#FFFF00' },
  { name: 'Purple', value: '#800080' },
  { name: 'Orange', value: '#FFA500' },
];

const brushSizes = [
  { name: 'Small', value: 2 },
  { name: 'Medium', value: 5 },
  { name: 'Large', value: 10 },
];

export function WhiteboardToolbar({
  activeTool,
  activeColor,
  brushSize,
  onToolChange,
  onColorChange,
  onBrushSizeChange,
  onClear
}: WhiteboardToolbarProps) {
  return (
    <div className="flex items-center p-1 bg-white rounded-md shadow-sm border">
      <Button
        size="sm"
        variant={activeTool === 'select' ? 'default' : 'outline'}
        onClick={() => onToolChange('select')}
        className="flex items-center gap-1 h-8"
      >
        <Pencil className="h-4 w-4" />
        <span className="sr-only">Select</span>
      </Button>
      
      <Button
        size="sm"
        variant={activeTool === 'draw' ? 'default' : 'outline'}
        onClick={() => onToolChange('draw')}
        className="flex items-center gap-1 h-8 ml-1"
      >
        <Brush className="h-4 w-4" />
        <span className="sr-only">Draw</span>
      </Button>
      
      <Separator orientation="vertical" className="mx-2 h-6" />
      
      <Button
        size="sm"
        variant={activeTool === 'rect' ? 'default' : 'outline'}
        onClick={() => onToolChange('rect')}
        className="flex items-center gap-1 h-8"
      >
        <Square className="h-4 w-4" />
        <span className="sr-only">Rectangle</span>
      </Button>
      
      <Button
        size="sm"
        variant={activeTool === 'circle' ? 'default' : 'outline'}
        onClick={() => onToolChange('circle')}
        className="flex items-center gap-1 h-8 ml-1"
      >
        <Circle className="h-4 w-4" />
        <span className="sr-only">Circle</span>
      </Button>
      
      <Button
        size="sm"
        variant={activeTool === 'text' ? 'default' : 'outline'}
        onClick={() => onToolChange('text')}
        className="flex items-center gap-1 h-8 ml-1"
      >
        <Text className="h-4 w-4" />
        <span className="sr-only">Text</span>
      </Button>
      
      <Separator orientation="vertical" className="mx-2 h-6" />
      
      {/* Color Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" className="flex items-center gap-1 h-8">
            <Pencil className="h-4 w-4" />
            <div 
              className="h-4 w-4 rounded-full border border-gray-300" 
              style={{ backgroundColor: activeColor }}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <div className="grid grid-cols-4 gap-1 p-1">
            {colorOptions.map((color) => (
              <div
                key={color.value}
                className="h-6 w-6 rounded-full cursor-pointer hover:scale-110 transition-transform border border-gray-300"
                style={{ backgroundColor: color.value }}
                onClick={() => onColorChange(color.value)}
                title={color.name}
              />
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Brush Size */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" className="flex items-center gap-1 h-8 ml-1">
            <Shapes className="h-4 w-4" />
            <span className="text-xs">{brushSize}px</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {brushSizes.map((size) => (
            <DropdownMenuItem key={size.value} onClick={() => onBrushSizeChange(size.value)}>
              {size.name} ({size.value}px)
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      
      <div className="flex-1" />
      
      <Button
        size="sm"
        variant="destructive"
        onClick={onClear}
        className="flex items-center gap-1 h-8"
      >
        <Trash className="h-4 w-4" />
        <span className="sr-only md:not-sr-only md:inline-block">Clear</span>
      </Button>
    </div>
  );
}
