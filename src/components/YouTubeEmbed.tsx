import React, { useState, useRef, useEffect } from 'react';
import YouTube, { YouTubePlayer, YouTubeProps } from 'react-youtube';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  RotateCcw,
  SkipForward,
  Settings,
  AlertCircle,
  RefreshCcw,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';

interface YouTubeEmbedProps {
  videoId: string;
  title?: string;
  className?: string;
}

export default function YouTubeEmbed({ videoId, title, className }: YouTubeEmbedProps) {
  const [player, setPlayer] = useState<YouTubePlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, []);

  const onReady: YouTubeProps['onReady'] = (event) => {
    setPlayer(event.target);
    setDuration(event.target.getDuration());
  };

  const onStateChange: YouTubeProps['onStateChange'] = (event) => {
    // -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
    const state = event.data;
    setIsPlaying(state === 1);
    setIsBuffering(state === 3);
    
    if (state === 1) {
      setError(null);
      progressInterval.current = setInterval(() => {
        setCurrentTime(event.target.getCurrentTime());
      }, 1000);
    } else {
      if (progressInterval.current) clearInterval(progressInterval.current);
    }
  };

  const onError = (event: any) => {
    console.error("YouTube Player Error:", event.data);
    let message = "An error occurred while loading the video.";
    const code = event.data;
    
    if (code === 2) message = "The request contains an invalid parameter value.";
    if (code === 5) message = "The requested content cannot be played in an HTML5 player.";
    if (code === 100) message = "The video requested was not found or is private.";
    if (code === 101 || code === 150) message = "The owner of the requested video does not allow it to be played in embedded players.";
    
    setError(message);
    setIsPlaying(false);
    setIsBuffering(false);
  };

  const retryVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setError(null);
    setPlayer(null);
    // Re-triggering videoId change or just letting it re-render
  };

  const togglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!player) {
      console.log("Player not ready");
      return;
    }
    
    try {
      const state = player.getPlayerState();
      if (state === 1) { // playing
        player.pauseVideo();
      } else {
        player.playVideo();
      }
    } catch (err) {
      console.error("Error toggling play:", err);
      // Fallback: just try playVideo
      player.playVideo();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (!player) return;
    const time = parseFloat(e.target.value);
    player.seekTo(time, true);
    setCurrentTime(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (!player) return;
    const vol = parseInt(e.target.value);
    setVolume(vol);
    player.setVolume(vol);
    if (vol > 0) setIsMuted(false);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!player) return;
    if (isMuted) {
      player.unMute();
      player.setVolume(volume || 50);
      setIsMuted(false);
    } else {
      player.mute();
      setIsMuted(true);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const opts: YouTubeProps['opts'] = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 0,
      controls: 0,
      modestbranding: 1,
      rel: 0,
      iv_load_policy: 3,
      disablekb: 1,
      origin: window.location.origin,
    },
  };

  if (!videoId) return null;

  return (
    <div 
      className={cn(
        "relative aspect-video w-full rounded-2xl overflow-hidden bg-zinc-950/40 backdrop-blur-sm shadow-2xl border border-zinc-800/50 group cursor-pointer",
        className
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={() => !error && togglePlay()}
    >
      <div className="absolute inset-0">
        <YouTube 
          videoId={videoId} 
          opts={opts} 
          onReady={onReady} 
          onStateChange={onStateChange}
          onError={onError}
          onPlay={() => { setIsPlaying(true); setIsBuffering(false); setError(null); }}
          onPause={() => setIsPlaying(false)}
          onEnd={() => setIsPlaying(false)}
          className="w-full h-full"
        />
      </div>

      {/* Custom Controls Overlay */}
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent transition-opacity duration-300 flex flex-col justify-end p-4 z-10",
          (isHovering || !isPlaying || error) ? "opacity-100" : "opacity-0"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Bar */}
        <div className="w-full mb-4 group/progress">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:h-2 transition-all"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={togglePlay}
              disabled={!!error}
              className="p-2.5 rounded-full bg-emerald-500 text-black hover:scale-110 transition-transform shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
            </button>

            <div className="flex items-center gap-2 group/volume">
              <button onClick={toggleMute} className="text-zinc-400 hover:text-white transition-colors">
                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover/volume:w-20 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white transition-all overflow-hidden"
              />
            </div>

            <div className="text-[10px] font-bold font-mono text-zinc-500 uppercase tracking-widest">
              {formatTime(currentTime)} <span className="mx-1 text-zinc-700">/</span> {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="text-zinc-400 hover:text-white transition-colors">
              <Settings size={18} />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                player?.getInternalPlayer()?.requestFullscreen?.();
              }}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <Maximize size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Big Play Button (when paused and no error) */}
      {!isPlaying && !error && !isBuffering && player && (
        <div 
          className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
        >
          <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center backdrop-blur-md animate-pulse">
            <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-black shadow-2xl shadow-emerald-500/40">
              <Play size={32} className="ml-1" fill="currentColor" />
            </div>
          </div>
        </div>
      )}
      
      {/* Buffering Indicator */}
      {isBuffering && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] z-25">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-emerald-500" size={40} />
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Buffering...</p>
          </div>
        </div>
      )}
      
      {/* Loading State */}
      {!player && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/40 backdrop-blur-sm z-30">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 border-4 border-emerald-500/10 rounded-full" />
              <div className="absolute inset-0 border-4 border-t-emerald-500 rounded-full animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Initializing Campus Player</p>
              <p className="text-[8px] text-zinc-600 font-medium">Connecting to secure stream...</p>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/90 backdrop-blur-md z-40 p-8 text-center">
          <div className="max-w-md space-y-6">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Playback Error</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{error}</p>
            </div>
            <button 
              onClick={retryVideo}
              className="px-6 py-2.5 bg-zinc-900/40 backdrop-blur-sm border border-zinc-800 rounded-xl text-xs font-bold text-white hover:bg-zinc-800 hover:border-zinc-700 transition-all flex items-center gap-2 mx-auto group"
            >
              <RefreshCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
