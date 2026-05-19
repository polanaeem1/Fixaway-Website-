'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { chatApi, uploadApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useToast } from '@/components/ui/ToastProvider';

function VoiceMessage({ src, isMe, sender, createdAt }: { src: string; isMe: boolean; sender: any; createdAt: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const BAR_HEIGHTS = [8, 14, 20, 12, 18, 28, 32, 24, 16, 20, 14, 8, 12, 22, 30, 26, 18, 12, 20, 28, 24, 14, 10, 6];

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

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

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    if (audio.readyState >= 1) {
      setDuration(audio.duration || 0);
    }

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(e => console.error(e));
      setIsPlaying(true);
    }
  };

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!waveformRef.current || !audioRef.current || !duration) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const relativeX = clickX / rect.width;
    const newTime = relativeX * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const activeBarCount = Math.floor((currentTime / (duration || 1)) * BAR_HEIGHTS.length);

  // Cohesive application design theme styling:
  const activeColor = isMe ? '#ffffff' : 'var(--md-sys-color-primary, #002045)';
  const inactiveColor = isMe ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 32, 69, 0.15)';

  return (
    <div className={`flex items-end gap-3 p-3.5 rounded-2xl min-w-[290px] max-w-sm shadow-sm transition-all duration-300 relative border ${
      isMe 
        ? 'bg-primary border-primary/20 text-on-primary rounded-tr-none' 
        : 'bg-surface-container border-outline-variant/10 text-on-surface rounded-tl-none'
    }`}>
      
      {/* Sender Avatar with Microphone badge overlay */}
      <div className="relative flex-shrink-0 self-center">
        {sender?.avatarUrl ? (
          <img src={sender.avatarUrl} alt={sender.name} className="w-12 h-12 rounded-full object-cover border border-white/10" />
        ) : (
          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-base shadow-sm ${
            isMe ? 'bg-white/20 text-white' : 'bg-primary-container text-primary'
          }`}>
            {sender?.name?.slice(0, 2).toUpperCase() || 'U'}
          </div>
        )}
        <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 shadow-sm ${
          isMe ? 'bg-white text-primary border-primary' : 'bg-primary text-white border-surface-container'
        }`}>
          <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>
        </div>
      </div>

      {/* Play/Pause button */}
      <button 
        onClick={togglePlay} 
        className="w-10 h-10 flex items-center justify-center flex-shrink-0 hover:opacity-80 active:scale-95 transition-all self-center"
      >
        <span className={`material-symbols-outlined text-[42px] ${
          isMe ? 'text-white' : 'text-primary'
        }`} style={{ fontVariationSettings: "'FILL' 1" }}>
          {isPlaying ? 'pause' : 'play_arrow'}
        </span>
      </button>

      {/* Waveform & Time Info Area */}
      <div className="flex-1 flex flex-col justify-center min-w-0">
        
        {/* Waveform graphic */}
        <div 
          ref={waveformRef}
          onClick={handleWaveformClick}
          className="h-8 flex items-center gap-[2.5px] cursor-pointer w-full select-none"
        >
          {BAR_HEIGHTS.map((height, idx) => {
            const isActive = idx < activeBarCount;
            return (
              <div 
                key={idx}
                className="w-[3px] rounded-full transition-colors duration-150"
                style={{ 
                  height: `${height}px`, 
                  backgroundColor: isActive ? activeColor : inactiveColor 
                }}
              />
            );
          })}
        </div>

        {/* Cohesive Voice Sub-footer */}
        <div className={`flex items-center justify-between text-[10px] font-bold mt-1.5 select-none ${
          isMe ? 'text-primary-container/70' : 'text-on-surface-variant/70'
        }`}>
          <span>{isPlaying ? formatTime(currentTime) : formatTime(duration)}</span>
          <div className="flex items-center gap-1.5">
            <span>{new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage({ params }: { params: { orderId: string } }) {
  const { orderId } = params;
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Media States
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!accessToken) {
      router.replace('/login');
      return;
    }

    const fetchMessages = async () => {
      try {
        const res = await chatApi.getMessages(accessToken, orderId);
        setMessages(res.data || []);
      } catch (err: any) {
        showToast(err.message || 'Failed to load chat history', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Socket Setup
    const socket = getSocket(accessToken);
    socket.emit('join_order', orderId);

    const handleReceiveMessage = (newMessage: any) => {
      if (newMessage.orderId === orderId) {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.find((m) => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
      }
    };

    socket.on('message_received', handleReceiveMessage);

    return () => {
      socket.emit('leave_order', orderId);
      socket.off('message_received', handleReceiveMessage);
    };
  }, [accessToken, orderId, router, showToast]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Voice recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'voice_message.webm', { type: 'audio/webm' });
        
        setIsUploading(true);
        try {
          const url = await uploadApi.uploadMedia(accessToken!, audioFile);
          const res = await chatApi.sendMessage(accessToken!, orderId, '', url);
          const newMsg = res.data;

          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        } catch (err: any) {
          showToast(err.message || 'Failed to upload voice message', 'error');
        } finally {
          setIsUploading(false);
        }

        // Close stream tracks
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

    } catch (err: any) {
      showToast('Could not access microphone. Please grant permission.', 'error');
    }
  };

  const stopRecording = (shouldSend: boolean) => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      if (shouldSend) {
        mediaRecorder.stop();
      } else {
        // Cancel: stop track but clean up chunks so recorder.onstop does not submit
        mediaRecorder.onstop = () => {
          mediaRecorder.stream.getTracks().forEach(track => track.stop());
        };
        mediaRecorder.stop();
      }
    }
    
    setIsRecording(false);
    setMediaRecorder(null);
  };

  // Image Upload handler
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;

    setIsUploading(true);
    try {
      const url = await uploadApi.uploadMedia(accessToken, file);
      const res = await chatApi.sendMessage(accessToken, orderId, '', url);
      const newMsg = res.data;

      setMessages((prev) => {
        if (prev.find((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    } catch (err: any) {
      showToast(err.message || 'Failed to upload photo', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !accessToken) return;

    const content = inputText.trim();
    setInputText('');

    try {
      const res = await chatApi.sendMessage(accessToken, orderId, content);
      const newMsg = res.data;
      
      setMessages((prev) => {
        if (prev.find((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      
    } catch (err: any) {
      showToast(err.message || 'Failed to send message', 'error');
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isAudioUrl = (url: string) => {
    return /\.(mp3|wav|ogg|webm|m4a|3gpp|aac)/i.test(url) || url.includes('audio/') || url.includes('voice_message');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-surface">
      {/* Header */}
      <header className="bg-surface/90 backdrop-blur-md border-b border-outline-variant/30 px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button 
          onClick={() => router.back()} 
          className="p-2 rounded-full hover:bg-surface-container-low transition-colors text-on-surface-variant active:scale-95"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-primary-container text-primary flex items-center justify-center font-bold text-lg">
            #
          </div>
          <div>
            <h1 className="font-bold text-primary">Order Chat</h1>
            <p className="text-xs text-on-surface-variant">Order #{orderId.slice(-6).toUpperCase()}</p>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-container-lowest">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-on-surface-variant opacity-70">
            <span className="material-symbols-outlined text-5xl mb-2">forum</span>
            <p>No messages yet. Say hi!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.id;
            const hasMedia = !!msg.mediaUrl;
            const isAudio = hasMedia && isAudioUrl(msg.mediaUrl);

            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                {isAudio ? (
                  <VoiceMessage src={msg.mediaUrl} isMe={isMe} sender={msg.sender} createdAt={msg.createdAt} />
                ) : (
                  <div 
                    className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                      isMe 
                        ? 'bg-primary text-on-primary rounded-tr-sm' 
                        : 'bg-surface-container text-on-surface rounded-tl-sm'
                    } shadow-sm`}
                  >
                    {/* Text Message */}
                    {msg.content && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}

                    {/* Photo Media */}
                    {hasMedia && (
                      <div className="mt-1 max-w-xs overflow-hidden rounded-xl border border-white/10 shadow">
                        <img 
                          src={msg.mediaUrl} 
                          alt="Photo Attachment"
                          className="max-h-60 w-full object-cover cursor-pointer hover:opacity-95 transition-opacity" 
                          onClick={() => window.open(msg.mediaUrl, '_blank')}
                        />
                      </div>
                    )}

                    <div className={`text-[10px] mt-1 ${isMe ? 'text-primary-container/70' : 'text-on-surface-variant/70'} text-right`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-surface border-t border-outline-variant/30 p-4 sticky bottom-0">
        <div className="flex items-center gap-2 max-w-4xl mx-auto relative">
          
          {/* File Picker input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handlePhotoSelect} 
            accept="image/*" 
            className="hidden" 
          />

          {isRecording ? (
            /* WhatsApp Voice Recording UI */
            <div className="flex-1 flex items-center justify-between bg-error/5 border border-error/20 rounded-full px-5 py-3 text-sm animate-pulse">
              <div className="flex items-center gap-2 text-error font-bold">
                <div className="w-2.5 h-2.5 rounded-full bg-error animate-ping" />
                <span>Recording {formatSeconds(recordingSeconds)}</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => stopRecording(false)} 
                  className="text-on-surface-variant hover:text-error transition-colors px-3 py-1 font-bold text-xs"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => stopRecording(true)} 
                  className="bg-error text-white rounded-full p-2 flex items-center justify-center shadow hover:opacity-90 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </button>
              </div>
            </div>
          ) : (
            /* Default Text Input Form */
            <form onSubmit={handleSendMessage} className="flex-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-12 h-12 rounded-full hover:bg-surface-container-low flex items-center justify-center transition-colors text-on-surface-variant disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-2xl">attach_file</span>
              </button>
              
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your message..."
                disabled={isUploading}
                className="flex-1 bg-surface-container-low border border-outline-variant/50 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
              />

              {inputText.trim() ? (
                /* Text Send Button */
                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-12 h-12 bg-primary text-on-primary rounded-full flex items-center justify-center hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                </button>
              ) : (
                /* WhatsApp Microphone Button */
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={isUploading}
                  className="w-12 h-12 bg-secondary text-white rounded-full flex items-center justify-center hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>
                </button>
              )}
            </form>
          )}

          {/* Loader Overlay for uploading photos/voices */}
          {isUploading && (
            <div className="absolute right-14 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-white/90 px-3 py-1.5 rounded-full border shadow-sm text-xs font-semibold text-primary">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Sending media...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
