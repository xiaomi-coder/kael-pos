import { create } from 'zustand';
import { User } from '../types';
import { supabase } from '../lib/supabase';

interface AuthState {
  currentUser: User | null;
  loginUser: string;
  loginPass: string;
  loginError: string;
  isLoggingIn: boolean;
  
  setLoginUser: (val: string) => void;
  setLoginPass: (val: string) => void;
  handleLogin: () => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>((set, get) => ({
  currentUser: null,
  loginUser: "",
  loginPass: "",
  loginError: "",
  isLoggingIn: false,

  setLoginUser: (val) => set({ loginUser: val }),
  setLoginPass: (val) => set({ loginPass: val }),
  
  handleLogin: async () => {
    const { loginUser, loginPass } = get();
    if (!loginUser || !loginPass) {
      set({ loginError: "Login va parolni kiriting!" });
      return;
    }

    set({ isLoggingIn: true, loginError: "" });
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('login', loginUser)
        .eq('pass', loginPass)
        .maybeSingle();

      if (data) { 
        set({ currentUser: data as User, loginError: "", loginPass: "", isLoggingIn: false }); 
      } else { 
        set({ loginError: "Login yoki parol noto'g'ri!", isLoggingIn: false }); 
      }
    } catch (err) {
      set({ loginError: "Tizimga ulanishda xatolik yuz berdi! Tarmoqni tekshiring.", isLoggingIn: false });
    }
  },

  logout: () => set({ currentUser: null, loginUser: "", loginPass: "" }),
}));
