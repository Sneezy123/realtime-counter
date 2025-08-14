import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Key, Shield, AlertCircle } from 'lucide-react';
import { generateAccessKey, isValidHexKey } from '../utils/securityUtils';
import { supabase } from '../hooks/useSupabase';
import logoIcon from '../logoVibeCount.svg';
import CopyrightFooter from './CopyrightFooter';

export const Home: React.FC = () => {
    const navigate = useNavigate();
    const [groupName, setGroupName] = useState('');
    const [accessKey, setAccessKey] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [groupExists, setGroupExists] = useState(false);
    const [checkingGroup, setCheckingGroup] = useState(false);
    const [accessKeyError, setAccessKeyError] = useState<string | null>(null);

    const handleGenerateKey = () => {
        setIsGenerating(true);
        setTimeout(() => {
            setAccessKey(generateAccessKey());
            setIsGenerating(false);
        }, 300);
    };

    // Check if group exists
    useEffect(() => {
        const checkGroupExists = async () => {
            if (!groupName.trim()) {
                setGroupExists(false);
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
                    .select('id')
                    .eq('name', cleanGroupName)
                    .single();

                setGroupExists(!!data && !error);
            } catch (err) {
                // Group doesn't exist (single() throws error when no rows)
                setGroupExists(false);
            } finally {
                setCheckingGroup(false);
            }
        };

        const debounceTimer = setTimeout(checkGroupExists, 300);
        return () => clearTimeout(debounceTimer);
    }, [groupName]);

    const handleJoinGroup = async (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedGroupName = groupName.trim();
        const trimmedAccessKey = accessKey.trim();

        if (!trimmedGroupName) {
            alert('Please enter a group name');
            return;
        }

        if (!trimmedAccessKey) {
            alert('Please enter an access key');
            return;
        }

        if (!isValidHexKey(trimmedAccessKey)) {
            alert('Please enter a valid access key');
            return;
        }

        // Clean group name for URL (allow letters, numbers, hyphens, underscores)
        const cleanGroupName = trimmedGroupName
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, '-')
            .replace(/-+/g, '-');

        if (!cleanGroupName || cleanGroupName === '-') {
            alert('Group name must contain at least one letter or number');
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
                alert('Error checking group: ' + error.message);
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
            navigate(`/${cleanGroupName}?key=${trimmedAccessKey}`);
        } catch (err) {
            setAccessKeyError(
                'Error validating group access: ' + (err as Error).message
            );
        }
    };

    // Simple validation function - in production, use proper hashing
    const validateGroupAccess = async (
        groupName: string,
        accessKey: string
    ) => {
        const { data } = await supabase
            .from('counter_groups')
            .select('access_key_hash')
            .eq('name', groupName)
            .single();

        if (!data) return false;

        // For demo purposes, we'll assume the key is stored as-is
        return data.access_key_hash === accessKey;
    };

    return (
        <>
            <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 transition-colors duration-200'>
                <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full transition-colors duration-200'>
                    <div className='text-center mb-8'>
                        <div className='bg-gray-100 dark:bg-gray-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4'>
                            <img
                                src={logoIcon}
                                className='w-10 h-10 text-blue-600 dark:text-blue-400'
                            />
                        </div>
                        <h1 className='font-display text-3xl font-bold text-gray-900 dark:text-white mb-2'>
                            VibeCount
                        </h1>
                        <p className='text-gray-600 dark:text-gray-300'>
                            Create or join a real-time group with counters for
                            you and your friends, all in real-time!
                        </p>
                    </div>
                    <form onSubmit={handleJoinGroup} className='space-y-6'>
                        <div>
                            <label
                                htmlFor='groupName'
                                className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                            >
                                Group Name
                            </label>
                            <input
                                type='text'
                                id='groupName'
                                value={groupName}
                                onChange={(e) => {
                                    setGroupName(e.target.value);
                                    setAccessKeyError(null);
                                }}
                                placeholder='my-counter-group'
                                className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200'
                            />
                            {groupExists && (
                                <div className='mt-2 flex items-center text-blue-600 dark:text-blue-400 text-sm'>
                                    <AlertCircle className='w-4 h-4 mr-1' />
                                    <span>This group already exists</span>
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
                                    }}
                                    placeholder='Enter or generate an access key'
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
                                    <AlertCircle className='w-4 h-4 mr-1' />
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
        </>
    );
};
