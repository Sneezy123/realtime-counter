import React, { useState, useEffect } from 'react';
import {
    Image as ImageIcon,
    X,
    Loader2,
    Check,
    AlertCircle,
} from 'lucide-react';
import { EditableField } from './EditableField';

interface ProfilePictureProps {
    url?: string | null;
    onUrlChange: (url: string | null) => void;
    size?: number;
    className?: string;
}

export const ProfilePicture: React.FC<ProfilePictureProps> = ({
    url,
    onUrlChange,
    size = 64,
    className = '',
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [inputUrl, setInputUrl] = useState(url || '');
    const [isLoading, setIsLoading] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [urlError, setUrlError] = useState<string | null>(null);

    useEffect(() => {
        setInputUrl(url || '');
        setImageLoaded(false);
        setImageError(false);
    }, [url]);

    const handleImageLoad = () => {
        setImageLoaded(true);
        setIsLoading(false);
    };

    const handleImageError = () => {
        setImageError(true);
        setIsLoading(false);
    };

    const validateImageUrl = async (imageUrl: string): Promise<boolean> => {
        return new Promise((resolve) => {
            const img = new window.Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = imageUrl;
        });
    };

    const validateUrl = (url: string): string | null => {
        if (!url.trim()) return null;

        let validatedUrl = url.trim();

        // Handle URLs that might not have protocol
        if (
            !validatedUrl.startsWith('http://') &&
            !validatedUrl.startsWith('https://')
        ) {
            validatedUrl = 'https://' + validatedUrl;
        }

        try {
            new URL(validatedUrl);
            return null;
        } catch {
            return 'Please enter a valid URL';
        }
    };

    const handleSave = async (newUrl: string) => {
        // Clear previous errors
        setUrlError(null);
        setImageError(false);

        if (!newUrl.trim()) {
            onUrlChange(null);
            setIsEditing(false);
            return;
        }

        // Validate URL format
        const urlValidationError = validateUrl(newUrl);
        if (urlValidationError) {
            setUrlError(urlValidationError);
            return;
        }

        let validatedUrl = newUrl.trim();

        // Handle URLs that might not have protocol
        if (
            !validatedUrl.startsWith('http://') &&
            !validatedUrl.startsWith('https://')
        ) {
            validatedUrl = 'https://' + validatedUrl;
        }

        setIsLoading(true);
        const isValid = await validateImageUrl(validatedUrl);

        if (isValid) {
            onUrlChange(validatedUrl);
            setIsEditing(false);
            setImageError(false);
            setUrlError(null);
        } else {
            setImageError(true);
            setUrlError(
                'Could not load image from this URL. Please check the link and try again.'
            );
        }
        setIsLoading(false);
    };

    const handleRemove = () => {
        onUrlChange(null);
        setIsEditing(false);
    };

    const handleEditClick = () => {
        setIsEditing(true);
        setInputUrl(url || '');
    };

    const handleCancel = () => {
        setIsEditing(false);
        setInputUrl(url || '');
        setUrlError(null);
        setImageError(false);
    };

    return (
        <div className={`relative ${className}`}>
            <div
                className='relative cursor-pointer group'
                onClick={handleEditClick}
                style={{ width: size, height: size }}
            >
                <div
                    className='w-full h-full rounded-full overflow-hidden border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors duration-200 flex items-center justify-center'
                    style={{ width: size, height: size }}
                >
                    {url && !imageError ? (
                        <img
                            src={url}
                            alt='Profile'
                            className='w-full h-full object-cover rounded-full'
                            onLoad={handleImageLoad}
                            onError={handleImageError}
                        />
                    ) : (
                        <div className='w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500'>
                            <ImageIcon size={size * 0.4} />
                        </div>
                    )}
                </div>

                {/* Hover overlay */}
                <div className='absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 rounded-full transition-opacity duration-200 flex items-center justify-center'>
                    <div className='opacity-0 group-hover:opacity-100 transition-opacity duration-200'>
                        <ImageIcon size={size * 0.3} className='text-white' />
                    </div>
                </div>
            </div>

            {/* Edit modal */}
            {isEditing && (
                <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
                    <div className='bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl max-w-sm w-full mx-4'>
                        <div className='flex items-center justify-between mb-4'>
                            <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                                Profile Picture
                            </h3>
                            <button
                                onClick={handleCancel}
                                className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className='space-y-4'>
                            <div className='flex justify-center'>
                                <div
                                    className='rounded-full overflow-hidden border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center'
                                    style={{
                                        width: size * 2,
                                        height: size * 2,
                                    }}
                                >
                                    {inputUrl && !imageError ? (
                                        <img
                                            src={inputUrl}
                                            alt='Preview'
                                            className='w-full h-full object-cover rounded-full'
                                            onLoad={() => setImageLoaded(true)}
                                            onError={() => setImageError(true)}
                                        />
                                    ) : (
                                        <div className='w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500'>
                                            <ImageIcon
                                                size={size * 0.8}
                                                className='text-gray-400 dark:text-gray-500'
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <input
                                type='url'
                                value={inputUrl}
                                onChange={(e) => {
                                    setInputUrl(e.target.value);
                                    setUrlError(null);
                                    setImageError(false);
                                }}
                                placeholder='https://example.com/image.jpg'
                                className='w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSave(inputUrl);
                                    if (e.key === 'Escape') handleCancel();
                                }}
                                autoFocus
                            />
                            {urlError && (
                                <div className='flex items-center text-red-600 dark:text-red-400 text-sm'>
                                    <AlertCircle className='w-4 h-4 mr-2' />
                                    <span>{urlError}</span>
                                </div>
                            )}

                            <div className='flex gap-2'>
                                <button
                                    onClick={handleCancel}
                                    className='flex-1 px-4 py-2 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors'
                                >
                                    Cancel
                                </button>
                                {!url && inputUrl && (
                                    <button
                                        onClick={() => handleSave(inputUrl)}
                                        className='flex-1 px-4 py-2 text-sm bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-md transition-colors'
                                    >
                                        Save
                                    </button>
                                )}
                                {url && (
                                    <button
                                        onClick={handleRemove}
                                        className='px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors'
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
