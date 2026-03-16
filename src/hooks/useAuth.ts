import { create } from 'zustand';
import { User } from '../types';
import { useStorage } from './useStorage';

interface AuthState {
  currentUser: User | null;
  loginUser: string;
  loginPass: string;
  loginError: string;
  
  setLoginUser: (val: string) => void;
  setLoginPass: (val: string) => void;
  handleLogin: () => void;
  logout: () => void;
}

export const useAuth = create<AuthState>((set, get) => ({
  currentUser: null,
  loginUser: "",
  loginPass: "",
  loginError: "",

  setLoginUser: (val) => set({ loginUser: val }),
  setLoginPass: (val) => set({ loginPass: val }),
  
  handleLogin: () => {
    const { loginUser, loginPass } = get();
    // Get users directly from the persisted store
    const users = useStorage.getState().users;
    const u = users.find(u => u.login === loginUser && u.pass === loginPass);
    if (u) { 
      set({ currentUser: u, loginError: "", loginPass: "" }); 
    } else { 
      set({ loginError: "Login yoki parol noto'g'ri!" }); 
    }
  },

  logout: () => set({ currentUser: null, loginUser: "", loginPass: "" }),
}));
