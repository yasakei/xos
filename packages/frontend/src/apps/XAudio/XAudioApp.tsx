// packages/frontend/src/apps/XAudio/XAudioApp.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  Music,
  Download,
} from "lucide-react";

interface XAudioAppProps {
  filePath: string;
  windowId: string;
  onClose: () => void;
}

const XAudioApp: React.FC<XAudioAppProps> = ({
  filePath,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audioInfo, setAudioInfo] = useState<{
    name: string;
    size: string;
    type: string;
  } | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Fetch audio data
  useEffect(() => {
    const fetchAudio = async () => {
      if (!filePath) return;
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch audio directly from VFS read endpoint
        const response = await fetch(`/api/vfs/read?path=${encodeURIComponent(filePath)}`);
        
        if (!response.ok) {
          throw new Error(`Failed to load audio: ${response.status} ${response.statusText}`);
        }
        
        // Convert response to blob
        const blob = await response.blob();
        
        if (blob.size === 0) {
          throw new Error('Received empty audio data');
        }
        
        // Create object URL
        const objectUrl = URL.createObjectURL(blob);
        setAudioUrl(objectUrl);
        
        // Get file info
        const fileName = filePath ? filePath.split("/").pop() || "Unknown" : "Unknown";
        const sizeKB = Math.round(blob.size / 1024);
        const fileType = blob.type || "audio/unknown";
        
        setAudioInfo({
          name: fileName,
          size: `${sizeKB} KB`,
          type: fileType
        });
        
      } catch (err) {
        console.error("Audio loading error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    if (filePath) {
      fetchAudio();
    }

    // Cleanup function
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [filePath]);

  // Setup audio element
  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;
    
    const audio = audioRef.current;
    
    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    
    const handleError = () => {
      setError("Failed to play audio file");
    };
    
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl]);

  // Control playback
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.play().catch(err => {
        console.error("Playback error:", err);
        setError("Failed to play audio");
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Control volume
  useEffect(() => {
    if (!audioRef.current) return;
    
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume > 0) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const downloadAudio = () => {
    if (!audioUrl) return;
    
    try {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = filePath ? filePath.split("/").pop() || "audio" : "audio";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download failed:", err);
      setError("Failed to download audio");
    }
  };

  const filename = filePath ? filePath.split("/").pop() || "Unknown" : "Unknown";

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {isLoading && (
          <div className="text-white text-lg flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <div>Loading audio...</div>
          </div>
        )}
        
        {error && (
          <div className="text-red-400 text-center p-4 bg-red-900/30 rounded-lg max-w-md">
            <div className="font-medium mb-2">Failed to load audio</div>
            <div className="text-sm opacity-80 mb-4">{error}</div>
          </div>
        )}
        
        {!isLoading && !error && audioUrl && (
          <div className="w-full max-w-md">
            {/* Album Art Placeholder */}
            <div className="w-40 h-40 mx-auto mb-6 rounded-xl bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center shadow-xl">
              <Music size={40} className="text-white/30" />
            </div>
            
            {/* Track Info */}
            <div className="text-center mb-6">
              <h2 className="text-white text-lg font-bold mb-1 truncate">{filename}</h2>
              {audioInfo && (
                <p className="text-gray-400 text-xs">
                  {audioInfo.type} • {audioInfo.size}
                </p>
              )}
            </div>
            
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              />
            </div>
            
            {/* Controls */}
            <div className="flex justify-center items-center space-x-4 mb-6">
              <button className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all">
                <Shuffle size={16} />
              </button>
              <button className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all">
                <SkipBack size={20} />
              </button>
              <button
                onClick={togglePlay}
                className="p-3 rounded-full bg-blue-600 text-white hover:bg-blue-500 transition-all"
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              <button className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all">
                <SkipForward size={20} />
              </button>
              <button className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all">
                <Repeat size={16} />
              </button>
            </div>
            
            {/* Volume Control */}
            <div className="flex items-center justify-center space-x-3">
              <button onClick={toggleMute} className="text-white/80 hover:text-white">
                {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              />
              <button onClick={downloadAudio} className="text-white/80 hover:text-white">
                <Download size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} src={audioUrl || undefined} />
    </div>
  );
};

export default XAudioApp;