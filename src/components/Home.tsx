import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Key, Shield, AlertCircle } from 'lucide-react';
import {
    generateAccessKey,
    isValidHexKey,
    hashAccessKey,
    validateAccessKey,
} from '../utils/securityUtils';
import { supabase } from '../hooks/useSupabase';
import logoIcon from '../logoVibeCount.svg';
import CopyrightFooter from './CopyrightFooter';
import { JsxFlags } from 'typescript';

export const Home: React.FC = () => {
    const navigate = useNavigate();
    const [groupName, setGroupName] = useState('');
    const [accessKey, setAccessKey] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [groupExists, setGroupExists] = useState(false);
    const [checkingGroup, setCheckingGroup] = useState(false);
    const [accessKeyError, setAccessKeyError] = useState<string | null>(null);
    const [groupNameError, setGroupNameError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [groupProfileImageUrl, setGroupProfileImageUrl] = useState<
        string | null
    >(null);
    /* @section: Utility functions */
    const handleGenerateKey = () => {
        setIsGenerating(true);
        setTimeout(() => {
            setAccessKey(generateAccessKey());
            setIsGenerating(false);
        }, 300);
    };

    // Check if group exists and fetch profile image
    useEffect(() => {
        const checkGroupExists = async () => {
            if (!groupName.trim()) {
                setGroupExists(false);
                setGroupProfileImageUrl(null);
                return;
            }

            setCheckingGroup(true);
            try {
                const cleanGroupName = groupName
                    .trim()
                    .toLowerCase()
                    .replace(/[^a-z0-9_-]/g, '-')
                    .replace(/-+/g, '-');

                const { data, error } = await supabase
                    .from('counter_groups')
                    .select('id, profile_image_url')
                    .eq('name', cleanGroupName)
                    .single();

                if (data && !error) {
                    setGroupExists(true);
                    setGroupProfileImageUrl(data.profile_image_url);
                } else {
                    setGroupExists(false);
                    setGroupProfileImageUrl(null);
                }
            } catch (err) {
                // Group doesn't exist (single() throws error when no rows)
                setGroupExists(false);
                setGroupProfileImageUrl(null);
            } finally {
                setCheckingGroup(false);
            }
        };

        const debounceTimer = setTimeout(checkGroupExists, 300);
        return () => clearTimeout(debounceTimer);
    }, [groupName]);

    const handleJoinGroup = async (e: React.FormEvent) => {
        e.preventDefault();

        // Clear previous errors
        setGroupNameError(null);
        setAccessKeyError(null);
        setFormError(null);

        const trimmedGroupName = groupName.trim();
        const trimmedAccessKey = accessKey.trim();

        let hasError = false;

        if (!trimmedGroupName) {
            setGroupNameError('Please enter a group name.');
            hasError = true;
        }

        if (!trimmedAccessKey) {
            setAccessKeyError('Access key not valid. Generate a new one.');
            hasError = true;
        } else if (!isValidHexKey(trimmedAccessKey)) {
            setAccessKeyError('Access key not valid. Generate a new one.');
            hasError = true;
        }

        // Clean group name for URL (allow letters, numbers, hyphens, underscores)
        const cleanGroupName = trimmedGroupName
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, '-')
            .replace(/-+/g, '-');

        if (trimmedGroupName && (!cleanGroupName || cleanGroupName === '-')) {
            setGroupNameError(
                'Group name must contain at least one letter or number'
            );
            hasError = true;
        }

        if (hasError) {
            return;
        }

        // Check if group exists and validate access key
        try {
            const { data: group, error } = await supabase
                .from('counter_groups')
                .select('id, access_key_hash')
                .eq('name', cleanGroupName)
                .single();

            if (error && error.code !== 'PGRST116') {
                // PGRST116 is "no rows returned" - group doesn't exist
                setFormError('Error checking group: ' + error.message);
                return;
            }

            if (group) {
                // Group exists - validate access key
                const isValidKey = await validateGroupAccess(
                    cleanGroupName,
                    trimmedAccessKey
                );

                if (!isValidKey) {
                    setAccessKeyError(
                        'This group already exists and the access key is incorrect. Please use the correct key or choose a different group name.'
                    );
                    return;
                }
            }

            // Either group doesn't exist (create) or key is valid (join)
            setAccessKeyError(null);
            setGroupNameError(null);
            setFormError(null);
            navigate(`/${cleanGroupName}?key=${trimmedAccessKey}`);
        } catch (err) {
            setFormError(
                'Error validating group access: ' + (err as Error).message
            );
        }
    };

    // Hash and salt validation function
    const validateGroupAccess = async (
        groupName: string,
        accessKey: string
    ) => {
        const { data: groupData } = await supabase
            .from('counter_groups')
            .select('access_key_hash')
            .eq('name', groupName)
            .single();

        if (!groupData) return false;

        // Use the new validateAccessKey function
        return await validateAccessKey(accessKey, groupData.access_key_hash);
    };
    /* @endsection */

    return (
        <div className='min-h-screen relative pb-10 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 transition-colors duration-200'>
            <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full transition-colors duration-200'>
                <div className='text-center mb-8'>
                    <div className='bg-gray-100 dark:bg-gray-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4'>
                        <img
                            src={groupProfileImageUrl || logoIcon}
                            className={` text-blue-600 dark:text-blue-400 ${
                                groupExists
                                    ? 'rounded-full object-cover w-full h-full'
                                    : 'w-10 h-10'
                            }`}
                            alt={
                                groupExists ? 'Group profile' : 'VibeCount logo'
                            }
                        />
                    </div>
                    <h1 className='font-display text-3xl font-bold text-gray-900 dark:text-white mb-2'>
                        VibeCount
                    </h1>
                    <p className='text-gray-600 dark:text-gray-300'>
                        Create or join a group with counters for anything
                        imaginable! Secure and in real-time!
                    </p>
                </div>
                <form onSubmit={handleJoinGroup} className='space-y-6'>
                    <div>
                        <label
                            htmlFor='groupName'
                            className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                        >
                            Unique Group Name
                        </label>
                        <input
                            type='text'
                            id='groupName'
                            value={groupName}
                            onChange={(e) => {
                                setGroupName(e.target.value);
                                setAccessKeyError(null);
                                setGroupNameError(null);
                                setFormError(null);
                            }}
                            placeholder='Unique name of your group'
                            className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200'
                        />
                        {groupExists && (
                            <div className='mt-2 flex items-center text-blue-600 dark:text-blue-400 text-sm'>
                                <AlertCircle className='w-4 h-4 mr-1' />
                                <span>This group already exists</span>
                            </div>
                        )}
                        {groupNameError && (
                            <div className='mt-2 flex items-center text-red-600 dark:text-red-400 text-sm'>
                                <AlertCircle className='w-4 h-4 mr-1' />
                                <span>{groupNameError}</span>
                            </div>
                        )}
                    </div>
                    <div>
                        <label
                            htmlFor='accessKey'
                            className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                        >
                            Access Key
                        </label>
                        <div className='relative'>
                            <Key className='absolute left-3 top-2.5 w-5 h-5 text-gray-400 dark:text-gray-500' />
                            <input
                                type='text'
                                id='accessKey'
                                value={accessKey}
                                onChange={(e) => {
                                    setAccessKey(e.target.value);
                                    setAccessKeyError(null);
                                    setFormError(null);
                                }}
                                placeholder={
                                    groupExists
                                        ? 'Secure access key of the group above'
                                        : 'Generate a secure access key'
                                }
                                className='w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200'
                            />
                        </div>
                        <button
                            type='button'
                            onClick={handleGenerateKey}
                            disabled={isGenerating}
                            className='mt-2 w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50'
                        >
                            {isGenerating
                                ? 'Generating...'
                                : 'Generate Secure Key'}
                        </button>
                        {accessKeyError && (
                            <div className='mt-2 flex items-center text-red-600 dark:text-red-400 text-sm'>
                                <AlertCircle className='h-4  mr-2' />
                                <span>{accessKeyError}</span>
                            </div>
                        )}
                    </div>
                    <button
                        type='submit'
                        className='w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:bg-gray-400 dark:disabled:bg-gray-600'
                    >
                        {groupExists ? 'Join Group' : 'Create Group'}
                    </button>
                    {formError && (
                        <div className='mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm text-red-600 dark:text-red-400'>
                            <div className='flex items-center'>
                                <AlertCircle className='w-5 h-5 mr-2' />
                                <span>{formError}</span>
                            </div>
                        </div>
                    )}
                </form>
                {groupExists && (
                    <div className='mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg'>
                        <div className='flex items-center text-blue-600 dark:text-blue-400 text-sm'>
                            <AlertCircle className='w-4 h-4 mr-2' />
                            <span>
                                This group already exists. Enter the correct
                                access key to join.
                            </span>
                        </div>
                    </div>
                )}
            </div>
            <CopyrightFooter />
        </div>
    );
};
