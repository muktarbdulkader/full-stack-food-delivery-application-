import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store/store';
import { setCredentials, logout } from '../store/authSlice';
import { authService } from '../services/auth.service';
import type { LoginData, RegisterData } from '../services/auth.service';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, token, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );

  const login = async (data: LoginData) => {
    const response = await authService.login(data);
    dispatch(
      setCredentials({
        user: response.data.user,
        token: response.data.token,
      })
    );
    return response;
  };

  const register = async (data: RegisterData) => {
    const response = await authService.register(data);
    dispatch(
      setCredentials({
        user: response.data.user,
        token: response.data.token,
      })
    );
    return response;
  };

  const signOut = () => {
    dispatch(logout());
  };

  return {
    user,
    token,
    isAuthenticated,
    login,
    register,
    logout: signOut,
  };
};
