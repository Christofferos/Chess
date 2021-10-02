const isProdEnv = process.env.NODE_ENV === 'production';
const PROD_URL = 'https://chessbattle.herokuapp.com';
const DEV_URL = 'http://localhost:8989';

export const APP_ID = '#app';
export const IO_RECONNECTION_URL = isProdEnv ? PROD_URL : DEV_URL;

export const IS_RECONNECTION_ENABLED = true;
export const RECONNECT_DELAY_MIN = 1000;
export const RECONNECT_DELAY_MAX = 5000;
