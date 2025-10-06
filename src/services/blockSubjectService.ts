import { APIService } from './baseUrl';
import type { BlockResponse, BlockCreateData, BlockStatsResponse } from '../types/blockSubject';

const getAuthType = (): 'school' | 'staff' => {
  return localStorage.getItem('access_token') ? 'school' : 'staff';
};

const blockSubjectService = {
  getBlocks: async (page: number = 1): Promise<BlockResponse> => {
    const authType = getAuthType();
    const params: Record<string, string> = {
      page: page.toString()
    };
    const response = await APIService.get('/api/block-subjects/', params, authType);
    return response;
  },

  createBlock: async (data: BlockCreateData): Promise<void> => {
    const authType = getAuthType();
    const response = await APIService.post('/api/block-subjects/', data, authType);
    return response;
  },

  deleteBlock: async (identifier: string): Promise<void> => {
    const authType = getAuthType();
    await APIService.delete(`/api/block-subjects/${identifier}/`, authType);
  },

  getStats: async (): Promise<BlockStatsResponse> => {
    const authType = getAuthType();
    const response = await APIService.get('/api/block-subjects/stats/', {}, authType);
    return response;
  }
};

export default blockSubjectService;
