export type UserRole = 'super_admin' | 'trainer' | 'student';

export type UserStatus = 'invited' | 'active' | 'suspended' | 'deactivated';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface UserProfile {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface Batch {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  description?: string;
  status: 'draft' | 'active' | 'archived';
  starts_at?: string;
  ends_at?: string;
  created_by: string;
  created_at: string;
}

export type AttemptState = 
  | 'draft' 
  | 'scheduled' 
  | 'awaiting_approval' 
  | 'ready' 
  | 'in_progress' 
  | 'submitted' 
  | 'auto_submitted' 
  | 'expired' 
  | 'cancelled';

export interface TestAttempt {
  id: string;
  assignment_id: string;
  test_version_id: string;
  student_id: string;
  attempt_number: number;
  state: AttemptState;
  requested_at?: string;
  approved_at?: string;
  started_at?: string;
  deadline_at?: string;
  submitted_at?: string;
  submit_reason?: string;
  score?: number;
  max_score?: number;
  created_at: string;
}

export interface ProctoringEvent {
  id: string;
  attempt_id: string;
  event_type: 'multi_face' | 'no_face' | 'tab_blur' | 'fullscreen_exit' | 'camera_lost' | 'manual_flag';
  severity: 'low' | 'medium' | 'high';
  weight: number;
  confidence: number;
  occurred_at: string;
  received_at: string;
  metadata?: Record<string, unknown>;
}
