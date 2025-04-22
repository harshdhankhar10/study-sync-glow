
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TaskForm } from './TaskForm';
import { TaskFormData } from '@/types/tasks';

interface TaskDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => void;
  initialData?: Partial<TaskFormData>;
  isSubmitting: boolean;
  type: 'create' | 'edit';
}

export function TaskDialog({
  open,
  onClose,
  onSubmit,
  initialData,
  isSubmitting,
  type,
}: TaskDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {type === 'create' ? 'Add New Task' : 'Edit Task'}
          </DialogTitle>
          <DialogDescription>
            {type === 'create' 
              ? 'Create a new task for your study plan.' 
              : 'Make changes to your existing task.'}
          </DialogDescription>
        </DialogHeader>
        <TaskForm
          initialData={initialData}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
