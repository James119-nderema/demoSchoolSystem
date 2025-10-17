export interface BlockSubject {
  id: string;
  subject: string;
  subject_id: string;
  school: string;
  school_id: string;
  identifier: string;
  created_at: string;
  updated_at: string;
}

export interface Block {
  identifier: string;
  subjects: Array<{
    id: string;
    subject: string;
    subject_id: string;
  }>;
  subject_count: number;
  created_at: string;
}

export interface BlockCreateData {
  subject_ids: string[];
}

export interface BlockResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Block[];
}

export interface BlockStatsResponse {
  total_blocks: number;
  total_subjects_in_blocks: number;
}
