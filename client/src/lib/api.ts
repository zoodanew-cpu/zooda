import axios from 'axios';

export const API_BASE_URL = 'http://localhost:5000/api';

axios.defaults.baseURL = API_BASE_URL;
axios.defaults.headers.common['Accept'] = 'application/json';

export default axios;
