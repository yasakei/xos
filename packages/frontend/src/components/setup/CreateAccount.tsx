
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { LoaderCircle, User, ArrowLeft } from 'lucide-react';
import XAuthWindow from '../ui/XAuthWindow';

export const CreateAccount = () => {
  const { completeSetup, setState } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pfp, setPfp] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async () => {
    setError('');
    setIsLoading(true);

    if (!username.trim() || !password) {
      setError("Username and password cannot be empty.");
      setIsLoading(false);
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters long.");
      setIsLoading(false);
      return;
    }

    const result = await completeSetup(username, password, pfp);
    if (!result.success) {
      setError(result.error || "Failed to create account. Please try again.");
    }
    // On success, authStore automatically transitions to the 'locked' state.
    
    setIsLoading(false);
  };

  const handleBackToLogin = () => {
    setState({ state: 'login', userData: null });
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-black/40 backdrop-blur-lg"
      style={{ 
        backgroundImage: `url(/api/vfs/static/wallpapers/default.png)`, 
        backgroundSize: 'cover' 
      }}>
      <XAuthWindow 
        title="Create New Account"
        showCloseButton={false}
        showMinimizeButton={false}
        showMaximizeButton={false}
      >
        <div className="text-center">
          <User className="w-16 h-16 mx-auto mb-4 text-blue-400" />
          <h1 className="text-2xl font-bold text-white mb-2">Create Your XOS Account</h1>
          <p className="text-gray-300 mb-6">Join XOS with a new local account.</p>
          
          <div className="space-y-4 mb-6">
            <input 
              type="text" 
              placeholder="Username" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              className="w-full p-3 bg-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
            <input 
              type="password" 
              placeholder="Password (min 4 characters)" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full p-3 bg-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
            
            <div 
              className="w-full p-4 border-2 border-dashed border-gray-500 rounded-lg text-center cursor-pointer hover:border-gray-400 transition-colors"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => setPfp(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                };
                input.click();
              }}
            >
              {pfp ? (
                <img src={pfp} alt="Preview" className="w-16 h-16 rounded-full mx-auto" />
              ) : (
                <div className="text-gray-400">
                  <p className="text-sm">Click to add profile picture</p>
                  <p className="text-xs mt-1">(optional)</p>
                </div>
              )}
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          
          <div className="flex space-x-3">
            <button 
              onClick={handleBackToLogin}
              className="flex-1 py-2.5 px-4 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </button>
            <button 
              onClick={handleComplete} 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg disabled:opacity-50 flex items-center justify-center transition-colors"
              disabled={isLoading || !username || !password}
            >
              {isLoading ? (
                <>
                  <LoaderCircle className="w-4 h-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </div>
      </XAuthWindow>
    </div>
  );
};
