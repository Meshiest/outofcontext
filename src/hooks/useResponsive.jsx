import { useMediaQuery } from 'react-responsive';

const MOBILE_QUERY = { query: '(max-width: 1224px)' };
export const useResponse = () => useMediaQuery(MOBILE_QUERY);
