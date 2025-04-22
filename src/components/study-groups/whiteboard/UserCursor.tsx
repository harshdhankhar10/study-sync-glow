
import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface UserCursorProps {
  user: {
    id: string;
    name: string;
    color?: string;
  };
  position: {
    x: number;
    y: number;
  };
}

export function UserCursor({ user, position }: UserCursorProps) {
  const cursorColor = user.color || '#9b87f5';
  const initials = user.name
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase();

  return (
    <div 
      className="absolute pointer-events-none transition-all duration-100 ease-out"
      style={{ 
        left: position.x, 
        top: position.y, 
        transform: 'translate(-50%, -50%)',
        zIndex: 9999
      }}
    >
      <div className="flex flex-col items-center">
        <div 
          className="w-0 h-0 mb-1"
          style={{
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderBottom: `12px solid ${cursorColor}`
          }}
        />
        <Avatar className="h-6 w-6">
          <AvatarFallback 
            style={{ backgroundColor: cursorColor, color: 'white', fontSize: '10px' }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}
