import { Platform } from 'react-native';

const DEV_API = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
const PROD_API = 'https://nursphere-api.onrender.com';

export const API_BASE = __DEV__ ? DEV_API : PROD_API;
