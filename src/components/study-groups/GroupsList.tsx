
import React from 'react';
import { StudyGroup } from '@/types/studyGroups';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';

interface GroupsListProps {
  groups: StudyGroup[];
  onSelectGroup: (group: StudyGroup) => void;
  currentGroupId?: string;
  loading: boolean;
}

export default function GroupsList({ 
  groups, 
  onSelectGroup, 
  currentGroupId,
  loading 
}: GroupsListProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center space-x-2 p-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-6">
        <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          You haven't joined any study groups yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {groups.map((group) => (
        <Button
          key={group.id}
          variant={currentGroupId === group.id ? "secondary" : "ghost"}
          className={`w-full justify-start text-left h-auto py-2 px-3 ${
            currentGroupId === group.id ? "bg-secondary" : ""
          }`}
          onClick={() => onSelectGroup(group)}
        >
          <div className="flex flex-col items-start">
            <span className="font-medium">{group.name}</span>
            <span className="text-xs text-muted-foreground">
              {group.membersCount} {group.membersCount === 1 ? 'member' : 'members'}
            </span>
          </div>
        </Button>
      ))}
    </div>
  );
}
