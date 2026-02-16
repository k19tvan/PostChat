import React, { useState } from 'react';
import { Activity, LogIn, UserPlus, Github, Chrome, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

export const AuthScreen: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            name: username,
                        },
                    },
                });
                if (error) throw error;
            }
        } catch (err: any) {
            setError(err.message || "An error occurred during authentication.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-50 dark:bg-[#05070a] transition-colors duration-300">
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 -mr-40 -mt-40 w-[600px] h-[600px] bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-[500px] h-[500px] bg-purple-500/10 dark:bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md p-8 relative">
                {/* Logo Section */}
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/20 mb-4 transition-transform hover:scale-105 duration-300">
                        <Activity className="text-white w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">PostChat</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-center text-sm">
                        {isLogin ? "Welcome back! Please login to your account." : "Create a new account to get started."}
                    </p>
                </div>

                {/* Auth Card */}
                <div className="bg-white dark:bg-[#0b0e14] border border-slate-200 dark:border-slate-800/50 p-8 rounded-[32px] shadow-2xl relative overflow-hidden group transition-colors duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/50 rounded-xl p-4 flex items-start gap-3 animate-pulse">
                                <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                                <p className="text-sm font-medium text-red-700 dark:text-red-200">{error === "Invalid login credentials" ? "Invalid email or password. Please try again." : error}</p>
                            </div>
                        )}

                        {!isLogin && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-300 ml-1">Display Name</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter your name"
                                    className="w-full bg-slate-50 dark:bg-[#1b1f2b] text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 rounded-2xl px-5 py-4 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all font-medium"
                                    required
                                />
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-300 ml-1">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="w-full bg-slate-50 dark:bg-[#1b1f2b] text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 rounded-2xl px-5 py-4 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all font-medium"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-300">Password</label>
                                {isLogin && <button type="button" className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors font-medium">Forgot Password?</button>}
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-slate-50 dark:bg-[#1b1f2b] text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 rounded-2xl px-5 py-4 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all font-medium"
                                required
                                minLength={6}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white rounded-2xl py-4 font-bold text-sm shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin w-5 h-5" />
                            ) : (
                                <>
                                    {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
                                    {isLogin ? "Sign In" : "Create Account"}
                                </>
                            )}
                        </button>
                    </form>

                    {/* Social Login Separator */}
                    <div className="relative my-8 text-center">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-800"></div></div>
                        <span className="relative px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-white dark:bg-[#0b0e14]">Or continue with</span>
                    </div>

                    {/* Social Buttons */}
                    <div className="grid grid-cols-2 gap-4 relative z-10">
                        <button className="flex items-center justify-center gap-2 bg-slate-50 dark:bg-[#1b1f2b] hover:bg-slate-100 dark:hover:bg-[#252a3a] text-slate-600 dark:text-slate-300 rounded-2xl py-3 border border-slate-200 dark:border-slate-800 transition-colors text-xs font-semibold">
                            <Github size={16} /> GitHub
                        </button>
                        <button className="flex items-center justify-center gap-2 bg-slate-50 dark:bg-[#1b1f2b] hover:bg-slate-100 dark:hover:bg-[#252a3a] text-slate-600 dark:text-slate-300 rounded-2xl py-3 border border-slate-200 dark:border-slate-800 transition-colors text-xs font-semibold">
                            <Chrome size={16} /> Google
                        </button>
                    </div>
                </div>

                {/* Footer Toggle */}
                <p className="text-center mt-8 text-sm text-slate-500 dark:text-slate-400">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError(null);
                        }}
                        className="text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors underline decoration-indigo-500/30 underline-offset-4"
                    >
                        {isLogin ? "Register now" : "Login here"}
                    </button>
                </p>
            </div>
        </div>
    );
};
