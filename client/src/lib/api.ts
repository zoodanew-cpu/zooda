import axios from 'axios';

export const API_BASE_URL = 'https://api.zooda.in/api';

axios.defaults.baseURL = API_BASE_URL;
axios.defaults.headers.common['Accept'] = 'application/json';

export default axios;
