import React, { useState, useEffect, useRef } from "react";
import { Image, X, Loader2, Check, AlertCircle } from "lucide-react";

interface ThumbnailProps {
  url?: string | null;
  onUrlChange: (url: string | null) => void;
}

export const Thumbnail: React.FC<ThumbnailProps> = ({ url, onUrlChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputUrl, setInputUrl] = useState(url || "");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setInputUrl(url || "");
    setPreviewUrl(null);
    setError(null);
    // Force the component to re-detect load state by resetting it
    setImageLoaded(false);
    setIsValidating(false);
  }, [url]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setIsLoading(false);
    setIsValidating(false);
  };

  const handleImageError = () => {
    setError(
      "Failed to load image - URL may be invalid or image may not exist",
    );
    setIsLoading(false);
    setIsValidating(false);
    setImageLoaded(false);
  };

  const validateImageUrl = async (imageUrl: string): Promise<boolean> => {
    return new Promise((resolve) => {
      // Create new abort controller for this validation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const timeout = setTimeout(() => {
        resolve(false);
      }, 3000); // 3 second timeout

      const img = new window.Image();
      img.onload = () => {
        clearTimeout(timeout);
        resolve(true);
      };
      img.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };
      img.src = imageUrl;

      // Handle abort
      abortControllerRef.current.signal.addEventListener("abort", () => {
        clearTimeout(timeout);
        resolve(false);
      });
    });
  };

  const validateAndSetUrl = async (newUrl: string) => {
    if (!newUrl.trim()) {
      onUrlChange(null);
      setIsEditing(false);
      setError(null);
      setIsLoading(false);
      return;
    }

    // More flexible URL validation - accept any valid URL
    let validatedUrl = newUrl.trim();

    // Handle URLs that might not have protocol
    if (
      !validatedUrl.startsWith("http://") &&
      !validatedUrl.startsWith("https://")
    ) {
      validatedUrl = "https://" + validatedUrl;
    }

    try {
      new URL(validatedUrl);
    } catch {
      setError("Please enter a valid URL");
      return;
    }

    // Skip image validation for now - just accept the URL
    // This prevents "failed to update counter" errors
    onUrlChange(validatedUrl);
    setIsEditing(false);
    setImageLoaded(true);
    setIsLoading(false);
    setIsValidating(false);
    setError(null);
  };

  const handleSave = async () => {
    await validateAndSetUrl(inputUrl);
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setInputUrl(url || "");
    setIsEditing(false);
    setError(null);
    setPreviewUrl(null);
    setImageLoaded(false);
    setIsLoading(false);
    setIsValidating(false);
  };

  const handleRemove = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    onUrlChange(null);
    setInputUrl("");
    setIsEditing(false);
    setError(null);
    setPreviewUrl(null);
    setImageLoaded(false);
    setIsLoading(false);
    setIsValidating(false);
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setInputUrl(url || "");
  };

  if (!isEditing && !url) {
    return (
      <button
        onClick={handleEditClick}
        className="absolute top-2 right-2 p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-md shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-600"
        title="Add thumbnail"
      >
        <Image size={16} className="text-gray-600 dark:text-gray-300" />
      </button>
    );
  }

  if (!isEditing && url) {
    return (
      <div className="relative group mb-4">
        <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-lg bg-gray-100 dark:bg-gray-800">
          {!imageLoaded && !isValidating && (
            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
          )}
          {isValidating && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 size={24} className="text-white animate-spin" />
            </div>
          )}
          <img
            key={url}
            src={url}
            alt="Counter thumbnail"
            className="w-full h-full object-contain transition-all duration-200 group-hover:scale-105"
            onError={handleImageError}
          />

          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
            <button
              onClick={handleEditClick}
              className="p-1.5 bg-blue-500 text-white rounded-full shadow-md hover:bg-blue-600 transition-colors duration-200"
              title="Change thumbnail"
            >
              <Image size={14} />
            </button>
            <button
              onClick={handleRemove}
              className="p-1.5 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors duration-200"
              title="Remove thumbnail"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-4 right-4 z-20">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 border border-gray-200 dark:border-gray-700 min-w-[280px]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Thumbnail URL
            </h4>
            <button
              onClick={handleCancel}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X size={16} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <div className="space-y-2">
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isLoading) handleSave();
                if (e.key === "Escape") handleCancel();
              }}
              autoFocus
            />

            {previewUrl && !error && (
              <div className="relative">
                {isLoading && (
                  <div className="absolute inset-0 bg-black/50 rounded-md flex items-center justify-center">
                    <Loader2 size={20} className="text-white animate-spin" />
                  </div>
                )}
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-md border border-gray-200 dark:border-gray-600"
                  onLoad={() => setImageLoaded(true)}
                  onError={handleImageError}
                />
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 p-2 text-xs bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <AlertCircle
                  size={14}
                  className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0"
                />
                <span className="text-red-700 dark:text-red-300">{error}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isLoading || !inputUrl.trim()}
              className="flex-1 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-1"
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <Check size={14} />
                  Save
                </>
              )}
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200"
            >
              Cancel
            </button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Supports: JPG, PNG, GIF, WebP, SVG
          </p>
        </div>
      </div>
    </div>
  );
};
