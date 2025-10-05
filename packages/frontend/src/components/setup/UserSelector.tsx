
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { LoaderCircle, Power, RotateCw, UserPlus, LogIn } from 'lucide-react';

interface User {
  username: string;
  pfp: string | null;
  lastLogin?: string;
}

export const UserSelector = () => {
  const { setState } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [time, setTime] = useState(new Date());
  const [showManualLogin, setShowManualLogin] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Get all users from the server
        const [usersResponse, sessionResponse] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/users/session')
        ]);
        
        let usersData: User[] = [];
        let currentUser: User | null = null;
        
        if (usersResponse.ok) {
          usersData = await usersResponse.json();
        } else if (usersResponse.status === 404) {
          // No users found, switch to account creation
          setState({ state: 'create-account', userData: null });
          return;
        }
        
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          if (sessionData?.user) {
            currentUser = {
              username: sessionData.user.username,
              pfp: sessionData.user.pfp
            };
          }
        }
        
        // Get previously logged in users from localStorage
        const previouslyLoggedInUsers: User[] = [];
        const localStorageKeys = Object.keys(localStorage);
        
        // Look for auth storage entries
        const authStorageKeys = localStorageKeys.filter(key => 
          key.includes('xos-auth-storage') && localStorage.getItem(key)
        );
        
        // Parse auth storage to find previously logged in users
        for (const key of authStorageKeys) {
          try {
            const storedData = JSON.parse(localStorage.getItem(key) || '{}');
            if (storedData?.userData?.username) {
              const username = storedData.userData.username;
              // Check if this user exists in our user list
              const user = usersData.find(u => u.username === username);
              if (user && !previouslyLoggedInUsers.some(u => u.username === username)) {
                previouslyLoggedInUsers.push(user);
              }
            }
          } catch (e) {
            console.warn('Failed to parse localStorage entry:', key);
          }
        }
        
        // Include currently logged in user if not already in the list
        if (currentUser && !previouslyLoggedInUsers.some(u => u.username === currentUser!.username)) {
          const fullUser = usersData.find(u => u.username === currentUser!.username);
          if (fullUser) {
            previouslyLoggedInUsers.push(fullUser);
          }
        }
        
        // Show only previously logged in users and current user
        setUsers(previouslyLoggedInUsers);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        setError('Could not connect to the server.');
      }
    };
    fetchUsers();
  }, [setState]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!selectedUser && !username) || !password || isLoading) return;

    setError('');
    setIsLoading(true);

    // Use either selected user or manually entered username
    const loginUsername = selectedUser ? selectedUser.username : username;

    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password }),
      });
      const result = await response.json();

      if (response.ok) {
        setState({ state: 'locked', userData: result.user });
      } else {
        setError(result.error || 'Login failed');
        setPassword('');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      setError('A network error occurred.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const selectUser = (user: User) => {
    setSelectedUser(user);
    setUsername('');
    setPassword('');
    setError('');
  };

  const toggleManualLogin = () => {
    setShowManualLogin(!showManualLogin);
    setSelectedUser(null);
    setUsername('');
    setPassword('');
    setError('');
  };

  return (
    <div 
      className="h-screen w-screen flex flex-col items-center justify-center bg-cover bg-center transition-all duration-500"
      style={{ backgroundImage: `url(/api/vfs/static/wallpapers/default.png)` }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-xl" />
      
      <div className="absolute top-6 right-8 text-white font-semibold text-lg">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center flex-grow">
        {selectedUser || showManualLogin ? (
          <div className={`flex flex-col items-center text-white transition-opacity duration-300 ${error ? 'animate-shake' : ''}`}>
            {selectedUser && (
              <>
                {selectedUser.pfp ? (
                  <img src={selectedUser.pfp} alt="Profile" className="w-28 h-28 rounded-full mb-4 border-4 border-white/20 shadow-2xl" />
                ) : (
                  <div className="w-28 h-28 rounded-full mb-4 bg-gray-700 flex items-center justify-center border-4 border-white/20 shadow-2xl">
                    <span className="text-5xl font-light">{selectedUser.username.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <h1 className="text-3xl font-semibold mb-4">{selectedUser.username}</h1>
              </>
            )}
            
            {showManualLogin && (
              <div className="mb-4 w-64">
                <input 
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="w-full p-3 bg-white/10 rounded-full text-center text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 backdrop-blur-sm mb-3"
                  autoFocus
                />
              </div>
            )}
            
            <form onSubmit={handleLogin} className="w-64">
              <input 
                type="password"
                placeholder="Enter Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full p-3 bg-white/10 rounded-full text-center text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 backdrop-blur-sm"
                autoFocus={!showManualLogin}
              />
            </form>
            {error && <p className="text-sm text-red-300 mt-3">{error}</p>}
          </div>
        ) : null}
      </div>

      <div className="relative z-10 pb-20 flex flex-col items-center">
        {!selectedUser && !showManualLogin && (
          <>
            <div className="flex items-center space-x-8 mb-4">
              <button 
                className="flex items-center space-x-2 px-4 py-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors text-white"
                onClick={toggleManualLogin}
              >
                <LogIn size={18} />
                <span>Manual Login</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-8">
              {users.length > 0 ? (
                users.map(user => (
                  <div key={user.username} className="flex flex-col items-center cursor-pointer group" onClick={() => selectUser(user)}>
                    {user.pfp ? (
                      <img src={user.pfp} alt={user.username} className="w-20 h-20 rounded-full border-2 border-transparent group-hover:border-white/50 transition-all" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-600 flex items-center justify-center border-2 border-transparent group-hover:border-white/50 transition-all">
                        <span className="text-3xl font-light text-white">{user.username.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <span className="mt-2 text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity">{user.username}</span>
                  </div>
                ))
              ) : (
                <div className="text-white text-center py-8">
                  <p className="text-lg mb-4">No accounts available</p>
                  <p className="text-sm opacity-75">Create a new account or log in manually</p>
                </div>
              )}
              <div 
                className="flex flex-col items-center cursor-pointer group"
                onClick={() => setState({ state: 'create-account', userData: null })}
              >
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center border-2 border-transparent group-hover:border-white/50 transition-all">
                  <UserPlus className="w-8 h-8 text-white/70" />
                </div>
                <span className="mt-2 text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity">Add User</span>
              </div>
            </div>
          </>
        )}
        
        {(selectedUser || showManualLogin) && (
          <div className="mt-6">
            <button 
              className="text-white/70 hover:text-white transition-colors"
              onClick={() => {
                setSelectedUser(null);
                setUsername('');
                setPassword('');
                setShowManualLogin(false);
                setError('');
              }}
            >
              Back to User Selection
            </button>
          </div>
        )}

        <div className="flex items-center space-x-6 mt-12 text-white font-semibold">
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
    </div>
  );
};
