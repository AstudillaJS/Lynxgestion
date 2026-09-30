import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Lock, ArrowRight, Mail, UserPlus } from 'lucide-react';
import { supabase } from '../supabaseClient';
import './Login.css';

export default function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, authError, setAuthError } = useAuth();
    const [localError, setLocalError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        setMessage('');
        setAuthError(null); // Clear authError on new submission
        setLoading(true);

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                // Sign Up Logic
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                setMessage('Cuenta creada exitosamente. ¡Bienvenido!');
                // Auto login is usually handled by Supabase unless email confirmation is required
            }
        } catch (err) {
            console.error(err);
            if (err.message.includes('Invalid login credentials')) {
                setLocalError('Credenciales inválidas. Verifica tu correo y contraseña.');
            } else if (err.message.includes('User already registered')) {
                setLocalError('Este correo ya está registrado.');
            } else {
                setLocalError('Error: ' + err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = () => {
        alert('Funcionalidad de recupero de contraseña en desarrollo.');
    };

    return (
        <div className="login-container">
            <div className="login-card glass slide-up">
                <div className="login-header">
                    <h2 className="title">
                        <span className="highlight">LYNX</span> {isLogin ? 'Ingreso' : 'Registro'}
                    </h2>
                    <p className="subtitle">
                        {isLogin ? 'Ingresa tus credenciales para continuar' : 'Crea una cuenta para comenzar'}
                    </p>
                </div>

                {(localError || authError) && (
                    <div className="error-message glass">
                        {localError || authError}
                    </div>
                )}
                {message && <div className="success-message">{message}</div>}

                <form className="form-stack" onSubmit={handleSubmit}>
                    <div className="fields-stack">
                        <div className="input-group">
                            <div className="icon-wrapper">
                                <Mail className="icon" />
                            </div>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="input-field"
                                placeholder="Correo Electrónico"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="input-group">
                            <div className="icon-wrapper">
                                <Lock className="icon" />
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="input-field"
                                placeholder="Contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={6}
                            />
                        </div>
                    </div>

                    {isLogin && (
                        <div className="forgot-password">
                            <button type="button" onClick={handleForgotPassword} className="link-btn">
                                ¿Olvidaste tu contraseña?
                            </button>
                        </div>
                    )}

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            <span className="btn-icon">
                                {isLogin ? <ArrowRight size={20} /> : <UserPlus size={20} />}
                            </span>
                            {loading
                                ? 'Procesando...'
                                : (isLogin ? 'Ingresar' : 'Crear Cuenta')}
                        </button>
                    </div>

                    <div className="toggle-mode">
                        <button
                            type="button"
                            className="link-btn switch-mode"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setLocalError('');
                                setMessage('');
                            }}
                        >
                            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
