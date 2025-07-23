import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getGeneratedImage } from '../api';

const GeneratedNFTImage = React.memo(({ projectId, imageFileName, alt, className, onError, ...props }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadImage = useCallback(async () => {
    if (!projectId || !imageFileName || loadingRef.current) {
      return;
    }

    // Prevent multiple simultaneous loads
    if (loadingRef.current) {
      return;
    }

    loadingRef.current = true;

    try {
      setLoading(true);
      setError(false);
      
      console.log(`Loading image: ${imageFileName} for project: ${projectId}`);
      
      const result = await getGeneratedImage(projectId, imageFileName);
      
      if (mountedRef.current) {
        setImageSrc(result.data);
        setLoading(false);
        console.log(`Successfully loaded image: ${imageFileName}`);
      }
    } catch (err) {
      console.error('Error loading generated NFT image:', err);
      if (mountedRef.current) {
        setError(true);
        setLoading(false);
        if (onError) {
          onError(err);
        }
      }
    } finally {
      loadingRef.current = false;
    }
  }, [projectId, imageFileName, onError]);

  useEffect(() => {
    loadImage();
  }, [loadImage]);

  // Reset loading state when props change
  useEffect(() => {
    setImageSrc(null);
    setLoading(true);
    setError(false);
    loadingRef.current = false;
  }, [projectId, imageFileName]);

  if (loading) {
    return (
      <div className={`bg-cyber-gray border border-cyber-cyan rounded flex items-center justify-center ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyber-cyan"></div>
      </div>
    );
  }

  if (error || !imageSrc) {
    return (
      <div className={`bg-cyber-gray border border-cyber-cyan rounded flex items-center justify-center ${className}`}>
        <span className="text-xs text-cyber-cyan-light text-center px-2">
          {alt || 'NFT not found'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={() => {
        console.error(`Failed to load image: ${imageFileName}`);
        setError(true);
      }}
      {...props}
    />
  );
});

GeneratedNFTImage.displayName = 'GeneratedNFTImage';

export default GeneratedNFTImage; 