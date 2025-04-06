export type UserType = 'student' | 'management';

export interface User {
  id: string;
  name: string;
  email: string;
  type: UserType;
}

export interface MaintenanceRequest {
  id: string;
  serviceType: 'carpenter' | 'electrician' | 'plumber' | 'cleaning' | 'it-support' | 'other';
  description: string;
  location: string;
  status: 'pending' | 'in-progress' | 'completed';
  dateRaised: string;
  imageUrl?: string;
  userId: string;
}