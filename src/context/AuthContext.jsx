import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(null);
    const [lastActivity, setLastActivity] = useState(Date.now());

    // --- SESSION SECURITY: SINGLE SESSION ---
    const syncSessionId = async (userId) => {
        const newSessionId = crypto.randomUUID();
        localStorage.setItem('lynx_session_id', newSessionId);

        await supabase
            .from('profiles')
            .update({ current_session_id: newSessionId })
            .eq('id', userId);

        return newSessionId;
    };

    const verifySessionId = async (userId) => {
        if (!userId) return true;

        const localSessionId = localStorage.getItem('lynx_session_id');
        const { data, error } = await supabase
            .from('profiles')
            .select('current_session_id')
            .eq('id', userId)
            .single();

        if (error || !data) return true;

        if (data.current_session_id && data.current_session_id !== localSessionId) {
            setAuthError('Se ha iniciado sesión en otro dispositivo. Se ha cerrado esta sesión.');
            await logout();
            return false;
        }
        return true;
    };

    // --- SESSION SECURITY: INACTIVITY ---
    useEffect(() => {
        if (!user) return;

        const timeout = 5 * 60 * 1000; // 5 minutes
        const intervalId = setInterval(() => {
            const now = Date.now();
            if (now - lastActivity > timeout) {
                setAuthError('Sesión cerrada por inactividad (5 minutos).');
                logout();
            }
        }, 30000); // Check every 30s

        const updateActivity = () => setLastActivity(Date.now());

        // Listeners for activity
        window.addEventListener('mousemove', updateActivity);
        window.addEventListener('keydown', updateActivity);
        window.addEventListener('scroll', updateActivity);
        window.addEventListener('click', updateActivity);

        // Verification of concurrent session every minute
        const sessionCheckId = setInterval(() => {
            verifySessionId(user.id);
        }, 60000);

        return () => {
            clearInterval(intervalId);
            clearInterval(sessionCheckId);
            window.removeEventListener('mousemove', updateActivity);
            window.removeEventListener('keydown', updateActivity);
            window.removeEventListener('scroll', updateActivity);
            window.removeEventListener('click', updateActivity);
        };
    }, [user, lastActivity]);

    useEffect(() => {
        // Check active sessions and subscribe to auth changes
        const initSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            await checkUserApproval(session?.user);
            setLoading(false);
        };

        initSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            await checkUserApproval(session?.user);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkUserApproval = async (currentUser) => {
        if (!currentUser) {
            setUser(null);
            return;
        }

        try {
            setAuthError(null);
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('is_approved, role')
                .eq('id', currentUser.id)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
                // PGRST116 is 'no rows found'
                if (error.code === 'PGRST116') {
                    setAuthError('Tu perfil no existe. Regístrate de nuevo o contacta al administrador.');
                } else {
                    setAuthError('Error de servidor al verificar aprobación. Prueba de nuevo.');
                }
                await supabase.auth.signOut();
                setUser(null);
                setLoading(false);
                return;
            }

            if (profile?.is_approved) {
                currentUser.role = profile.role;

                // Sync session ID if not present or just logged in
                if (!localStorage.getItem('lynx_session_id')) {
                    await syncSessionId(currentUser.id);
                }

                setUser(currentUser);
                setLoading(false);
            } else {
                setAuthError('Tu cuenta está pendiente de aprobación por el administrador.');
                await supabase.auth.signOut();
                setUser(null);
                setLoading(false);
            }
        } catch (err) {
            console.error('Auth check error:', err);
            setAuthError('Error de autenticación inesperado.');
            setUser(null);
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        // Standard Supabase login
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;

        // The onAuthStateChange will trigger checkUserApproval automatically,
        // but we can do a quick check here if needed.
        if (data.user) {
            // New login always generates a new session and kicks others out
            await syncSessionId(data.user.id);
            await checkUserApproval(data.user);
        }

        return data;
    };

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        localStorage.removeItem('lynx_session_id');
        setUser(null);
        if (error) throw error;
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, authError, setAuthError }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
