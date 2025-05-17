import React from 'react';

interface VideoBackgroundProps {
  className?: string;
}

const VideoBackground: React.FC<VideoBackgroundProps> = ({ className = '' }) => {
  return (
    <>
      <video
        autoPlay
        loop
        muted
        playsInline
        className={`absolute inset-0 w-full h-full ${className}`}
      >
        <source src="/videos/background.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
    </>
  );
};

export default VideoBackground;