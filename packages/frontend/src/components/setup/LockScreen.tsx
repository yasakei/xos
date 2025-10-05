
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import type { UserData } from '../../store/authStore';
import { format } from 'date-fns';
import { LoaderCircle, Power, RotateCw, ArrowRight } from 'lucide-react';

const UserLogin = ({ userData }: { userData: UserData }) => {
    const { login, setState } = useAuthStore();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading || !password) return;

        setError('');
        setIsLoading(true);
        const result = await login(password);
        if (!result.success) {
            setError(result.error || "An unknown error occurred.");
            setTimeout(() => setError(''), 3000);
            setPassword('');
        }
        setIsLoading(false);
    };

    return (
        <div className={`flex flex-col items-center text-white transition-opacity duration-300 ${error ? 'animate-shake' : ''}`}>
            {userData.pfp ? (
                <img src={userData.pfp} alt="Profile" className="w-28 h-28 rounded-full mb-4 border-4 border-white/20 shadow-2xl" />
            ) : (
                <div className="w-28 h-28 rounded-full mb-4 bg-gray-700 flex items-center justify-center border-4 border-white/20 shadow-2xl">
                    <span className="text-5xl font-light">{userData.username.charAt(0).toUpperCase()}</span>
                </div>
            )}
            <h1 className="text-3xl font-semibold mb-6">{userData.username}</h1>
            
            <form onSubmit={handleSubmit} className="w-64 relative">
                <input 
                    type="password"
                    placeholder="Enter Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full p-3 pr-10 bg-white/10 rounded-full text-center text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 backdrop-blur-sm"
                    autoFocus
                />
                <button 
                    type="submit"
                    disabled={isLoading || !password}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 disabled:bg-gray-500 disabled:opacity-50 transition-colors"
                >
                    {isLoading ? (
                        <LoaderCircle className="w-5 h-5 animate-spin" />
                    ) : (
                        <ArrowRight className="w-5 h-5" />
                    )}
                </button>
            </form>
            {error && <p className="text-sm text-red-300 mt-3">{error}</p>}

            <button 
                onClick={() => setState({ state: 'login', userData: null })}
                className="mt-8 text-sm text-white/80 hover:text-white"
            >
                Switch User
            </button>
        </div>
    );
};

export const LockScreen = () => {
    const { userData } = useAuthStore();
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    if (!userData) return null;

    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-cover bg-center"
            style={{
                backgroundImage: `url(${userData.lockScreenWallpaper || userData.wallpaper})`,
            }}>
            
            <div className="absolute inset-0 bg-black/30 backdrop-blur-xl" />

            <div className="relative z-10 flex flex-col items-center justify-center text-white flex-grow">
                <div className="flex flex-col items-center mb-16">
                   <p className="text-8xl font-thin tracking-tight">{format(time, 'h:mm')}</p>
                   <p className="text-3xl font-light -mt-2">{format(time, 'EEEE, MMMM d')}</p>
                </div>
                
                <UserLogin userData={userData} />
            </div>

            <div className="relative z-10 pb-12 flex items-center space-x-6 text-white font-semibold">
                <button className="flex items-center space-x-2 px-4 py-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors">
                    <Power size={18} />
                    <span>Shut Down</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors">
                    <RotateCw size={18} />
                    <span>Restart</span>
                </button>
            </div>
        </div>
    );
};
