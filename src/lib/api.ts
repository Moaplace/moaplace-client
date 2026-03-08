import type { ApiClient } from './api.interface';
import mockApi from './api.mock';
import httpApi from './api.http';

const api: ApiClient = __USE_MOCK_API__ ? mockApi : httpApi;

export default api;
