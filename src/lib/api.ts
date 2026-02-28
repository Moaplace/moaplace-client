import type { ApiClient } from './api.interface';
import mockApi from './api.mock';

// 백엔드 연동 시 여기만 변경:
// import httpApi from './api.http';
// const api: ApiClient = httpApi;
const api: ApiClient = mockApi;

export default api;
