
import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Task, TaskFormData } from '@/types/tasks';

const TASKS_COLLECTION = 'tasks';

export const createTask = async (userId: string, taskData: TaskFormData): Promise<string> => {
  try {
    const taskToCreate = {
      ...taskData,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      dueDate: taskData.dueDate ? Timestamp.fromDate(new Date(taskData.dueDate)) : null
    };
    
    const docRef = await addDoc(collection(db, TASKS_COLLECTION), taskToCreate);
    return docRef.id;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

export const updateTask = async (taskId: string, taskData: Partial<TaskFormData>): Promise<void> => {
  try {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    const updateData = {
      ...taskData,
      updatedAt: Timestamp.now(),
      ...(taskData.dueDate ? { dueDate: Timestamp.fromDate(new Date(taskData.dueDate)) } : {})
    };
    
    await updateDoc(taskRef, updateData);
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

export const deleteTask = async (taskId: string): Promise<void> => {
  try {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    await deleteDoc(taskRef);
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

export const getUserTasks = async (userId: string): Promise<Task[]> => {
  try {
    const tasksRef = collection(db, TASKS_COLLECTION);
    const q = query(
      tasksRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
        dueDate: data.dueDate?.toDate?.() || null
      } as Task;
    });
  } catch (error) {
    console.error('Error getting user tasks:', error);
    throw error;
  }
};

export const updateTaskStatus = async (taskId: string, status: Task['status']): Promise<void> => {
  try {
    await updateTask(taskId, { status });
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
};

export const getTasksByStatus = async (userId: string, status: Task['status']): Promise<Task[]> => {
  try {
    const tasksRef = collection(db, TASKS_COLLECTION);
    const q = query(
      tasksRef,
      where('userId', '==', userId),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
        dueDate: data.dueDate?.toDate?.() || null
      } as Task;
    });
  } catch (error) {
    console.error('Error getting tasks by status:', error);
    throw error;
  }
};
