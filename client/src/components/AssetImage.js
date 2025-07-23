import React, { useState, useEffect } from 'react';
import { getAssetImage } from '../api';

const AssetImage = ({ projectId, assetPath, alt, className, onError, ...props }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      if (!projectId || !assetPath) {
        setError(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(false);
        
        const result = await getAssetImage(projectId, assetPath);
        
        setImageSrc(result.data);
      } catch (err) {
        console.error('Error loading asset image:', err);
        setError(true);
        if (onError) {
          onError(err);
        }
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [projectId, assetPath, onError]);

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
          {alt || 'Image not found'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      {...props}
    />
  );
};

export default AssetImage; 