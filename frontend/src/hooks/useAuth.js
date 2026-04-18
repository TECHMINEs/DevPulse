import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import useStore from '../store/useStore';
import { getMe } from '../api/auth';

export const useAuth = () => {
  const { token, user, setAuth, clearAuth } = useStore();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    enabled: !!token,
    retry: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  useEffect(() => {
    if (data?.user && token) {
      useStore.getState().updateUser(data.user);
    }
  }, [data, token]);

  const logout = useCallback(() => {
    clearAuth();
    navigate('/login');
  }, [clearAuth, navigate]);

  return {
    user: user || data?.user,
    token,
    isLoading,
    isAuthenticated: !!token,
    logout,
  };
};

export default useAuth;
