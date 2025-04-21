
export interface StudyGroupMember {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
}

export interface StudyGroupResource {
  id: string;
  title: string;
  description?: string;
  type: 'document' | 'link' | 'file';
  url?: string;
  fileId?: string;
  addedBy: string;
  addedAt: Date;
}

export interface StudyGroupMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  isSystemMessage?: boolean;
}

export interface StudyGroupSummary {
  id: string;
  content: string;
  topicsCovered: string[];
  generatedAt: Date;
  period: 'weekly' | 'monthly' | 'custom';
}

export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  subject: string;
  purpose: string;
  createdAt: Date;
  updatedAt: Date;
  membersCount: number;
  ownerId: string;
  isPublic: boolean;
  members?: StudyGroupMember[];
  resources?: StudyGroupResource[];
  messages?: StudyGroupMessage[];
  summaries?: StudyGroupSummary[];
}
