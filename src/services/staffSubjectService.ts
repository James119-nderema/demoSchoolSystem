import { APIService } from './baseUrl';

export interface StaffSubject {
  id: string;
  subject_name: string;
  subject_code: string;
  description?: string;
  date_created?: string;
  is_active: boolean;
}

export interface StaffSubjectResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: StaffSubject[];
}

const staffSubjectService = {
  getSubjects: async (search: string = '', page_size: number = 100): Promise<StaffSubjectResponse> => {
    const params: Record<string, string> = {
      page_size: page_size.toString()
    };
    
    if (search) {
      params.search = search;
    }
    
    const response = await APIService.get('/api/staff/subjects/', params, 'staff');
    return response;
  }
};

export default staffSubjectService;
