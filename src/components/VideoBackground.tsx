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
        className={`absolute inset-0 w-full h-full object-cover ${className}`}
      >
        <source src="Standard_Mode_Man_smirking__looking_deep_into_.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="absolute inset-0 bg-black/60"></div>
    </>
  );
};

export default VideoBackground;