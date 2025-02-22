import { jwtDecode } from 'jwt-decode';
import router from '../router';

export const isTokenExpired = () => {
  const token = localStorage.getItem('token');
  if (!token) return true;

  try {
    const decodedToken = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decodedToken.exp < currentTime;
  } catch {
    return true;
  }
};

export const checkTokenExpiration = () => {
  if (isTokenExpired()) {
    localStorage.removeItem('token');
    router.push('/login');
  }
};
