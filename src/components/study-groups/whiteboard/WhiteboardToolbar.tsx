
import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Pencil, Square, Circle, Trash, Text, Shapes, Brush, Hand, Download, Save, Copy, Eraser } from 'lucide-react';

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
  { name: 'Pink', value: '#FFC0CB' },
  { name: 'Brown', value: '#A52A2A' },
  { name: 'Teal', value: '#008080' },
  { name: 'Navy', value: '#000080' },
  { name: 'Gray', value: '#808080' },
];

const brushSizes = [
  { name: 'Extra Small', value: 1 },
  { name: 'Small', value: 2 },
  { name: 'Medium', value: 5 },
  { name: 'Large', value: 10 },
  { name: 'Extra Large', value: 15 },
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
    <div className="flex flex-wrap items-center p-1 bg-white rounded-md shadow-sm border">
      <Button
        size="sm"
        variant={activeTool === 'select' ? 'default' : 'outline'}
        onClick={() => onToolChange('select')}
        className="flex items-center gap-1 h-8"
        title="Select Tool"
      >
        <Hand className="h-4 w-4" />
        <span className="sr-only md:not-sr-only md:inline-block">Select</span>
      </Button>
      
      <Button
        size="sm"
        variant={activeTool === 'draw' ? 'default' : 'outline'}
        onClick={() => onToolChange('draw')}
        className="flex items-center gap-1 h-8 ml-1"
        title="Draw Tool"
      >
        <Brush className="h-4 w-4" />
        <span className="sr-only md:not-sr-only md:inline-block">Draw</span>
      </Button>
      
      <Separator orientation="vertical" className="mx-2 h-6" />
      
      <Button
        size="sm"
        variant={activeTool === 'rect' ? 'default' : 'outline'}
        onClick={() => onToolChange('rect')}
        className="flex items-center gap-1 h-8"
        title="Rectangle Tool"
      >
        <Square className="h-4 w-4" />
        <span className="sr-only md:not-sr-only md:inline-block">Rectangle</span>
      </Button>
      
      <Button
        size="sm"
        variant={activeTool === 'circle' ? 'default' : 'outline'}
        onClick={() => onToolChange('circle')}
        className="flex items-center gap-1 h-8 ml-1"
        title="Circle Tool"
      >
        <Circle className="h-4 w-4" />
        <span className="sr-only md:not-sr-only md:inline-block">Circle</span>
      </Button>
      
      <Button
        size="sm"
        variant={activeTool === 'text' ? 'default' : 'outline'}
        onClick={() => onToolChange('text')}
        className="flex items-center gap-1 h-8 ml-1"
        title="Text Tool"
      >
        <Text className="h-4 w-4" />
        <span className="sr-only md:not-sr-only md:inline-block">Text</span>
      </Button>
      
      <Separator orientation="vertical" className="mx-2 h-6" />
      
      {/* Color Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" className="flex items-center gap-1 h-8" title="Color Picker">
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
          <Button size="sm" variant="outline" className="flex items-center gap-1 h-8 ml-1" title="Brush Size">
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
        title="Clear Canvas"
      >
        <Trash className="h-4 w-4" />
        <span className="sr-only md:not-sr-only md:inline-block">Clear</span>
      </Button>
    </div>
  );
}
