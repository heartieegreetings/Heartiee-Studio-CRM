
export enum LeadStatus {
  NEW = 'New Inquiry',
  CONTACTED = 'Contacted',
  PROPOSAL = 'Proposal Sent',
  DEPOSIT_PAID = 'Conversion / Deposit',
  CONCEPT = 'Concept Approval',
  DESIGN = 'Design Stage',
  PRINTING = 'Printing Stage',
  COMPLETED = 'Completed',
  CLOSED_LOST = 'Closed Lost'
}

export enum Platform {
  WHATSAPP = 'WhatsApp',
  INSTAGRAM = 'Instagram',
  PINTEREST = 'Pinterest',
  EMAIL = 'Email',
  OTHER = 'Other'
}

export enum UserRole {
  ADMIN = 'Admin',
  MANAGER = 'Manager',
  DATA_ENTRY = 'Data Entry'
}

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  avatarInitials: string;
  email?: string;
  password?: string;
}

export interface Reminder {
  id: string;
  text: string;
  dateTime: string; // ISO string
  isCompleted: boolean;
}

export interface FollowUpNote {
  id: string;
  text: string;
  timestamp: string; // ISO string
  authorId?: string;
}

export interface TransferLog {
  id: string;
  fromUserId: string | null;
  toUserId: string | null;
  timestamp: string;
  transferredBy: string; // User ID
}

export interface EstimateItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

export interface Estimate {
  id: string;
  leadId: string;
  estimateNumber: string;
  date: string;
  validUntil: string; // ISO string
  items: EstimateItem[];
  notes: string;
  status: 'Draft' | 'Sent' | 'Approved' | 'Declined';
  subTotal: number;
  gstAmount: number;
  totalAmount: number;
}

export interface Lead {
  id: string;
  clientName: string;
  platform: Platform;
  contactHandle: string; // Phone number or username
  eventDate?: string;
  inquiredItems: string[];
  estimatedValue: number;
  status: LeadStatus;
  notes: string;
  createdAt: string;
  reminders: Reminder[];
  followUpHistory: FollowUpNote[];
  transferHistory: TransferLog[];
  urgency?: 'Low' | 'Medium' | 'High';
  assignedTo?: string; // User ID
  createdBy?: string; // User ID
  lastContacted?: string; // ISO string
  respondedAt?: string; // ISO string - First time status moved from NEW
}

export interface DashboardStats {
  totalLeads: number;
  totalPipelineValue: number;
  conversionRate: number;
  leadsByPlatform: { name: string; value: number }[];
}

export type ResourceType = 'LINK' | 'MESSAGE' | 'EMAIL' | 'IMAGE';

export interface Resource {
  id: string;
  title: string;
  type: ResourceType;
  content: string; // URL for links/images, Text for messages
  description?: string;
  createdAt: string;
  createdBy: string; // User ID
}
