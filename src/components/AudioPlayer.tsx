import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { motion } from 'motion/react';

export const AudioPlayer: React.FC = () => {
  const [isMuted, setIsMuted] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3;
      if (!isMuted) {
        audioRef.current.play().catch(() => {
          console.log('Autoplay blocked');
          setIsMuted(true);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isMuted]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <audio
        ref={audioRef}
        loop
        src="https://cdn.pixabay.com/audio/2022/05/27/audio_1808f3030e.mp3" // Lofi / Cyberpunk vibe
      />
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsMuted(!isMuted)}
        className="p-3 glass rounded-full neon-text-cyan shadow-lg cursor-pointer"
      >
        {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
      </motion.button>
    </div>
  );
};
