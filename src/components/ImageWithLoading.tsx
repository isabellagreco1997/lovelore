import { useState } from 'react';
import Image from 'next/image';

interface ImageWithLoadingProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  sizes?: string;
}

const ImageWithLoading = ({ 
  src, 
  alt, 
  className = '', 
  width = 0, 
  height = 0, 
  priority = false,
  loading = 'lazy',
  sizes = "100vw",
  ...props 
}: ImageWithLoadingProps) => {
  const [isLoading, setIsLoading] = useState(true);

  // Use Next/Image for better performance when width and height are provided
  if (width && height) {
    return (
      <div className="relative w-full h-full overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 image-placeholder" />
        )}
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`${className} ${isLoading ? 'loading' : 'loaded'}`}
          onLoadingComplete={() => setIsLoading(false)}
          loading={loading}
          priority={priority}
          sizes={sizes}
        />
      </div>
    );
  }

  // Fallback to standard img with loading attribute for SEO
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
        loading={loading === 'lazy' ? 'lazy' : undefined}
        {...props}
      />
    </div>
  );
};

export default ImageWithLoading;