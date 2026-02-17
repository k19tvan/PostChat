import React, { useState } from 'react';
import { Activity, LogIn, UserPlus, Github, Chrome, AlertCircle, Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { ThemeStyles } from './ThemeStyles'; // Assuming you saved your styles in this file

type AuthView = 'login' | 'register' | 'forgot_password';

interface AuthScreenProps {
    onAuthSuccess?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
    const [view, setView] = useState<AuthView>('login');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const clearErrors = () => {
        setError(null);
        setMessage(null);
    };

    const handleSocialLogin = async (provider: 'github' | 'google') => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: provider,
                options: { redirectTo: `${window.location.origin}` },
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) throw error;
            setMessage('Reset link sent! Please check your inbox.');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (view === 'login') {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                if (onAuthSuccess) onAuthSuccess();
            } else if (view === 'register') {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { full_name: username } },
                });
                if (error) throw error;
                if (data.user && !data.session) {
                    setMessage('Account created! Please confirm your email.');
                    setView('login');
                } else if (onAuthSuccess) {
                    onAuthSuccess();
                }
            }
        } catch (err: any) {
            setError(err.message || "An authentication error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        // Apply rm-root to ensure fonts and background variables are set
        <div className="rm-root items-center justify-center relative w-full h-screen">
            <ThemeStyles />

            {/* ── Ambient Backgrounds from your CSS ── */}
            <div className="rm-ambient" />
            <div className="rm-scanlines" />

            <div className="w-full max-w-[420px] px-6 relative z-10 flex flex-col items-center">

                {/* ── Header Section ── */}
                <div className="flex flex-col items-center mb-8 text-center animate-in fade-in zoom-in duration-500">
                    <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] flex items-center justify-center shadow-[0_0_40px_-10px_var(--accent)] mb-5 hover:scale-105 transition-transform duration-300">
                        <Activity className="text-white w-8 h-8" strokeWidth={2.5} />
                    </div>
                    <h1 className="text-4xl font-extrabold text-[var(--text)] tracking-tight font-['Syne'] mb-2">
                        PostChat
                    </h1>
                    <p className="text-[var(--muted)] text-sm font-medium">
                        {view === 'login' && "Welcome back, commander."}
                        {view === 'register' && "Join the elite network."}
                        {view === 'forgot_password' && "Recover your access."}
                    </p>
                </div>

                {/* ── Main Card ── */}
                <div className="rm-card w-full p-8 md:p-10 relative backdrop-blur-xl">

                    <form onSubmit={view === 'forgot_password' ? handlePasswordReset : handleSubmit} className="space-y-5">

                        {/* Error Alert - Styled to match theme */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <p className="text-sm font-medium text-red-500">{error}</p>
                            </div>
                        )}

                        {/* Success Message */}
                        {message && (
                            <div className="bg-[var(--surface2)] border border-[var(--success)]/30 rounded-2xl p-4 flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-[var(--success)] shrink-0 mt-0.5" />
                                <p className="text-sm font-medium text-[var(--success)]">{message}</p>
                            </div>
                        )}

                        {view === 'register' && (
                            <div className="space-y-2">
                                <label className="rm-tag border-none bg-transparent pl-1">Display Name</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="e.g. Maverick"
                                    className="rm-input"
                                    required
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="rm-tag border-none bg-transparent pl-1">Email Coordinates</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@domain.com"
                                className="rm-input"
                                required
                            />
                        </div>

                        {view !== 'forgot_password' && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className="rm-tag border-none bg-transparent pl-0">Passcode</label>
                                    {view === 'login' && (
                                        <button
                                            type="button"
                                            onClick={() => { setView('forgot_password'); clearErrors(); }}
                                            className="text-[11px] font-bold text-[var(--accent)] hover:text-[var(--accent2)] transition-colors uppercase tracking-wider"
                                        >
                                            Forgot?
                                        </button>
                                    )}
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="rm-input"
                                    required
                                    minLength={6}
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="rm-btn-primary w-full mt-4"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin w-5 h-5" />
                            ) : (
                                <>
                                    {view === 'login' && <><LogIn size={18} /> INITIALIZE LOGIN</>}
                                    {view === 'register' && <><UserPlus size={18} /> ESTABLISH ACCOUNT</>}
                                    {view === 'forgot_password' && <><Mail size={18} /> SEND RECOVERY SIGNAL</>}
                                </>
                            )}
                        </button>
                    </form>

                    {/* Back Button for Forgot Password */}
                    {view === 'forgot_password' && (
                        <div className="text-center mt-6">
                            <button
                                onClick={() => { setView('login'); clearErrors(); }}
                                className="flex items-center justify-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors mx-auto font-medium"
                            >
                                <ArrowLeft size={14} /> Return to Login
                            </button>
                        </div>
                    )}

                    {view !== 'forgot_password' && (
                        <>
                            <div className="relative my-8 text-center">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border)]"></div></div>
                                <span className="relative px-4 text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest bg-[var(--surface)]">Or Authenticate With</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleSocialLogin('github')}
                                    className="rm-btn-secondary justify-center text-xs tracking-wider"
                                >
                                    <Github size={18} /> GITHUB
                                </button>
                                <button
                                    onClick={() => handleSocialLogin('google')}
                                    className="rm-btn-secondary justify-center text-xs tracking-wider"
                                >
                                    <Chrome size={18} /> GOOGLE
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* ── Footer Toggle ── */}
                {view !== 'forgot_password' && (
                    <p className="text-center mt-8 text-sm text-[var(--muted)] font-medium">
                        {view === 'login' ? "New to the system?" : "Already authorized?"}{" "}
                        <button
                            onClick={() => {
                                setView(view === 'login' ? 'register' : 'login');
                                clearErrors();
                            }}
                            className="text-[var(--accent)] font-bold hover:text-[var(--accent2)] transition-colors ml-1 hover:underline underline-offset-4"
                        >
                            {view === 'login' ? "Register Protocol" : "Login Sequence"}
                        </button>
                    </p>
                )}
            </div>
        </div>
    );
};