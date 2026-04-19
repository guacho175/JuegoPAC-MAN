import React from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Direction } from '../types.ts';
import { motion } from 'motion/react';

interface DpadProps {
  onDirectionChange: (dir: Direction) => void;
}

export const Dpad: React.FC<DpadProps> = ({ onDirectionChange }) => {
  const Button = ({ dir, icon: Icon, area }: { dir: Direction, icon: any, area: string }) => (
    <motion.button
      whileTap={{ scale: 0.9, backgroundColor: 'rgba(0, 255, 255, 0.2)' }}
      className={`w-16 h-16 glass rounded-xl flex items-center justify-center neon-text-cyan active:neon-border`}
      style={{ gridArea: area }}
      onPointerDown={(e) => {
        e.preventDefault();
        onDirectionChange(dir);
      }}
    >
      <Icon size={32} />
    </motion.button>
  );

  return (
    <div className="d-pad-grid p-4 lg:hidden fixed bottom-10 left-10 z-40 select-none">
      <Button dir="UP" icon={ChevronUp} area="up" />
      <Button dir="LEFT" icon={ChevronLeft} area="left" />
      <Button dir="RIGHT" icon={ChevronRight} area="right" />
      <Button dir="DOWN" icon={ChevronDown} area="down" />
      <div className="w-16 h-16 flex items-center justify-center opacity-20" style={{ gridArea: 'center' }}>
        <div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse" />
      </div>
    </div>
  );
};
