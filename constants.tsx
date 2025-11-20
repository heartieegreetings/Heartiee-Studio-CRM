
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Instagram, 
  MessageCircle, 
  Mail, 
  Pin, 
  MoreHorizontal,
  FileText,
  Library
} from 'lucide-react';
import { Platform, LeadStatus, Lead, User, UserRole, Resource } from './types';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: [UserRole.ADMIN, UserRole.MANAGER] },
  { id: 'leads', label: 'Lead Board', icon: <Users size={20} />, roles: [UserRole.ADMIN, UserRole.MANAGER] },
  { id: 'estimates', label: 'Estimates', icon: <FileText size={20} />, roles: [UserRole.ADMIN, UserRole.MANAGER] },
  { id: 'reminders', label: 'Reminders', icon: <Calendar size={20} />, roles: [UserRole.ADMIN, UserRole.MANAGER] },
  { id: 'resources', label: 'Resources', icon: <Library size={20} />, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.DATA_ENTRY] },
];

export const BUSINESS_DETAILS = {
  name: "Heartiee Design Studio",
  address: "SCO-18, First Floor, Calibre Market, Rajpura, Punjab - 140401",
  contact: "+91-9877724154",
  email: "connect@heartiee.com",
  website: "www.heartiee.com",
  gst: "03ARKPJ7959E1ZL"
};

export const PLATFORM_ICONS: Record<Platform, React.ReactNode> = {
  [Platform.INSTAGRAM]: <Instagram size={16} className="text-pink-600" />,
  [Platform.WHATSAPP]: <MessageCircle size={16} className="text-green-500" />,
  [Platform.PINTEREST]: <Pin size={16} className="text-red-600" />,
  [Platform.EMAIL]: <Mail size={16} className="text-blue-500" />,
  [Platform.OTHER]: <MoreHorizontal size={16} className="text-gray-400" />,
};

export const STATUS_COLORS: Record<LeadStatus, string> = {
  [LeadStatus.NEW]: 'bg-blue-50 text-blue-800 border-blue-100',
  [LeadStatus.CONTACTED]: 'bg-indigo-50 text-indigo-800 border-indigo-100',
  [LeadStatus.PROPOSAL]: 'bg-purple-50 text-purple-800 border-purple-100',
  [LeadStatus.DEPOSIT_PAID]: 'bg-yellow-50 text-yellow-800 border-yellow-100', // Heartiee Gold
  [LeadStatus.CONCEPT]: 'bg-pink-50 text-pink-800 border-pink-100',
  [LeadStatus.DESIGN]: 'bg-rose-50 text-rose-800 border-rose-100',
  [LeadStatus.PRINTING]: 'bg-cyan-50 text-cyan-800 border-cyan-100',
  [LeadStatus.COMPLETED]: 'bg-green-50 text-green-800 border-green-100',
  [LeadStatus.CLOSED_LOST]: 'bg-gray-100 text-gray-600 border-gray-200',
};

export const LEAD_STAGE_GROUPS = {
  OPEN: [LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.PROPOSAL],
  IN_PROGRESS: [LeadStatus.DEPOSIT_PAID, LeadStatus.CONCEPT, LeadStatus.DESIGN, LeadStatus.PRINTING],
  COMPLETED: [LeadStatus.COMPLETED],
  LOST: [LeadStatus.CLOSED_LOST],
  WON: [LeadStatus.DEPOSIT_PAID, LeadStatus.CONCEPT, LeadStatus.DESIGN, LeadStatus.PRINTING, LeadStatus.COMPLETED]
};

export const USERS: User[] = [
  { id: 'u1', name: 'Admin User', username: 'admin', role: UserRole.ADMIN, avatarInitials: 'AD', email: 'admin@heartiee.com', password: 'admin@123' },
  { id: 'u2', name: 'Design Lead', username: 'designer', role: UserRole.MANAGER, avatarInitials: 'DL', email: 'designer@heartiee.com', password: 'design@123' },
  { id: 'u3', name: 'Assistant', username: 'assistant', role: UserRole.DATA_ENTRY, avatarInitials: 'AS', email: 'assistant@heartiee.com', password: 'data@123' },
];

// Seed Data
export const INITIAL_LEADS: Lead[] = [
  {
    id: '1',
    clientName: 'Priya Sharma',
    platform: Platform.INSTAGRAM,
    contactHandle: '@priya_s_weddings',
    eventDate: '2024-12-15',
    inquiredItems: ['E-Invite', 'Wedding Logo'],
    estimatedValue: 15000,
    status: LeadStatus.DESIGN,
    notes: 'Likes pastel florals. Sangeet invite needs animation.',
    createdAt: '2024-05-20T10:00:00Z',
    urgency: 'High',
    reminders: [
      { id: 'r1', text: 'Send draft for approval', dateTime: '2024-05-25T10:00:00', isCompleted: false }
    ],
    followUpHistory: [
        { id: 'f1', text: 'Sent initial draft via email.', timestamp: '2024-05-21T11:00:00Z', authorId: 'u2' }
    ],
    transferHistory: [],
    assignedTo: 'u1',
    createdBy: 'u1',
    lastContacted: '2024-05-21T11:00:00Z',
    respondedAt: '2024-05-20T14:00:00Z' // Responded within 4 hours (On Time)
  },
  {
    id: '2',
    clientName: 'Rohan & Anjali',
    platform: Platform.WHATSAPP,
    contactHandle: '+91 98765 43210',
    eventDate: '2025-01-20',
    inquiredItems: ['Full Stationery Suite', 'Itinerary Cards'],
    estimatedValue: 45000,
    status: LeadStatus.DEPOSIT_PAID,
    notes: 'Referral from previous client. Destination wedding in Udaipur.',
    createdAt: '2024-05-22T14:30:00Z',
    urgency: 'Medium',
    reminders: [],
    followUpHistory: [],
    transferHistory: [],
    assignedTo: 'u2',
    createdBy: 'u2',
    lastContacted: '2024-05-22T15:00:00Z',
    respondedAt: '2024-05-22T15:00:00Z' // Responded within 30 mins (On Time)
  },
  {
    id: '3',
    clientName: 'Meera Kapoor',
    platform: Platform.PINTEREST,
    contactHandle: 'Unknown',
    eventDate: '2024-11-10',
    inquiredItems: ['Save the Date'],
    estimatedValue: 5000,
    status: LeadStatus.CONTACTED,
    notes: 'Sent a pin of a royal blue card.',
    createdAt: '2024-05-21T09:00:00Z',
    urgency: 'Low',
    reminders: [],
    followUpHistory: [
        { id: 'f1', text: 'Sent price list.', timestamp: '2024-05-23T10:00:00Z', authorId: 'u1' }
    ],
    transferHistory: [],
    assignedTo: 'u1',
    createdBy: 'u3',
    lastContacted: '2024-05-23T10:00:00Z',
    respondedAt: '2024-05-23T10:00:00Z' // Responded after 2 days (Late)
  }
];

export const INITIAL_RESOURCES: Resource[] = [
  {
    id: 'res-1',
    title: '2024 Pricing PDF',
    type: 'LINK',
    content: 'https://drive.google.com/file/d/sample',
    description: 'Standard rate card for new inquiries.',
    createdAt: '2024-01-01T10:00:00Z',
    createdBy: 'u1'
  },
  {
    id: 'res-2',
    title: 'Initial Inquiry Reply',
    type: 'MESSAGE',
    content: "Hi! Thank you for reaching out to Heartiee. We'd love to help create your dream wedding stationery. Could you please share your event dates and approximate guest count so we can suggest the best packages?",
    description: 'Use this for first WhatsApp/DM replies.',
    createdAt: '2024-01-01T10:00:00Z',
    createdBy: 'u1'
  },
  {
    id: 'res-3',
    title: 'Bank Details',
    type: 'MESSAGE',
    content: "Account Name: Heartiee Design Studio\nAccount No: 1234567890\nIFSC: HDFC0001234\nUPI: heartiee@hdfcbank",
    description: 'For deposit payments.',
    createdAt: '2024-01-01T10:00:00Z',
    createdBy: 'u2'
  }
];
