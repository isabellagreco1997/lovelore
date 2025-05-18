import { useState } from 'react';

interface ImageWithLoadingProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
}

const ImageWithLoading = ({ src, alt, className = '', ...props }: ImageWithLoadingProps) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 image-placeholder" />
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'loading' : 'loaded'}`}
        onLoad={() => setIsLoading(false)}
        {...props}
      />
    </div>
  );
};

export default ImageWithLoading;