import type { ApiClient } from './api.interface';

const notImplemented = (method: string): never => {
  throw new Error(`HTTP API 미구현: ${method}`);
};

const httpApi: ApiClient = {
  createRoom: () => notImplemented('createRoom'),
  getRoom: () => notImplemented('getRoom'),
  verifyRoomPassword: () => notImplemented('verifyRoomPassword'),
  verifyParticipant: () => notImplemented('verifyParticipant'),
  addMarker: () => notImplemented('addMarker'),
  deleteMarker: () => notImplemented('deleteMarker'),
  getResult: () => notImplemented('getResult'),
  searchPlaces: () => notImplemented('searchPlaces'),
  getNearbyPlaces: () => notImplemented('getNearbyPlaces'),
  getDirections: () => notImplemented('getDirections'),
  reverseGeocode: () => notImplemented('reverseGeocode'),
};

export default httpApi;
