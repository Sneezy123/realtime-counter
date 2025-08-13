import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, Copy, Check, Users, AlertCircle, X, Edit3 } from 'lucide-react';
import { supabase } from '../hooks/useSupabase';
import { useRealTimeCounters } from '../hooks/useRealTimeCounters';
import { getUserName, setUserName } from '../utils/userUtils';
import { isValidHexKey } from '../utils/securityUtils';
import { CounterCard } from './CounterCard';

export const CounterGroup: React.FC = () => {
    const { groupName } = useParams<{ groupName: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const accessKey = searchParams.get('key');
    const [groupId, setGroupId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [userName, setUserNameState] = useState(getUserName());
    const [isEditingName, setIsEditingName] = useState(false);
    const [editNameValue, setEditNameValue] = useState(userName);

    const {
        counters,
        loading: countersLoading,
        error: countersError,
        createCounter,
        updateCounter,
        deleteCounter,
        incrementCounter,
        decrementCounter,
        clearError,
    } = useRealTimeCounters(groupId);

    // Validate access and get/create group
    useEffect(() => {
        const validateAccess = async () => {
            if (!groupName || !accessKey) {
                setError('Missing group name or access key');
                setLoading(false);
                return;
            }

            if (!isValidHexKey(accessKey)) {
                setError('Invalid access key format');
                setLoading(false);
                return;
            }

            try {
                console.log(
                    'Validating access for group:',
                    groupName,
                    'with key:',
                    accessKey
                );
                const { data, error: rpcError } = await supabase.rpc(
                    'create_or_get_group',
                    {
                        group_name: groupName,
                        access_key_hash: accessKey,
                    }
                );

                if (rpcError) {
                    console.error('RPC Error:', rpcError);
                    throw rpcError;
                }

                if (!data) {
                    throw new Error(
                        'Failed to create or access group: No data returned.'
                    );
                }

                // The RPC function returns a UUID directly, not an object
                if (typeof data === 'string') {
                    console.log('Group validation successful, group ID:', data);
                    setGroupId(data);
                } else {
                    throw new Error(
                        'Invalid response format from group validation'
                    );
                }
            } catch (err) {
                console.error('Group validation error:', err);
                setError(err instanceof Error ? err.message : 'Access denied');
            } finally {
                setLoading(false);
            }
        };

        validateAccess();
    }, [groupName, accessKey]);

    const copyShareUrl = async () => {
        const url = window.location.href;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy URL:', err);
        }
    };

    const handleSaveName = () => {
        const newName = editNameValue.trim();
        if (newName && newName !== userName) {
            setUserName(newName);
            setUserNameState(newName);
        }
        setIsEditingName(false);
    };

    const handleCancelNameEdit = () => {
        setEditNameValue(userName);
        setIsEditingName(false);
    };

    const handleNameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSaveName();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            handleCancelNameEdit();
        }
    };

    if (loading) {
        return (
            <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center'>
                <div className='text-center'>
                    <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
                    <p className='text-gray-600'>Loading group...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className='min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4'>
                <div className='bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center'>
                    <AlertCircle className='h-16 w-16 text-red-500 mx-auto mb-4' />
                    <h1 className='text-2xl font-bold text-gray-900 mb-2'>
                        Access Denied
                    </h1>
                    <p className='text-gray-600 mb-6'>{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100'>
            <div className='container mx-auto px-4 py-4 md:py-8 max-w-6xl'>
                {/* Header */}
                <div className='bg-white rounded-xl shadow-md p-4 md:p-6 mb-4 md:mb-8'>
                    <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                        <div>
                            <h1 className='text-3xl font-bold text-gray-900 mb-2'>
                                {groupName}
                            </h1>
                            <div className='flex items-center gap-2 text-sm text-gray-600 group'>
                                <Users size={16} />
                                {isEditingName ? (
                                    <div className='flex items-center gap-2'>
                                        <input
                                            type='text'
                                            value={editNameValue}
                                            onChange={(e) =>
                                                setEditNameValue(e.target.value)
                                            }
                                            onKeyDown={handleNameKeyDown}
                                            className='px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                                            placeholder='Your name'
                                            autoFocus
                                        />
                                        <button
                                            onClick={handleSaveName}
                                            className='p-1 text-green-600 hover:bg-green-50 rounded'
                                            title='Save'
                                        >
                                            <Check size={14} />
                                        </button>
                                        <button
                                            onClick={handleCancelNameEdit}
                                            className='p-1 text-red-600 hover:bg-red-50 rounded'
                                            title='Cancel'
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        className='flex items-center gap-1 cursor-pointer hover:bg-gray-100 rounded px-2 py-1'
                                        onClick={() => setIsEditingName(true)}
                                    >
                                        <span>Signed in as {userName}</span>
                                        <Edit3
                                            size={12}
                                            className='opacity-0 group-hover:opacity-100 transition-opacity'
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className='flex flex-col sm:flex-row gap-2 md:gap-3'>
                            <button
                                onClick={copyShareUrl}
                                className='flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm md:text-base'
                            >
                                {copied ? (
                                    <Check
                                        size={18}
                                        className='text-green-600'
                                    />
                                ) : (
                                    <Copy size={18} />
                                )}
                                {copied ? 'Copied!' : 'Share URL'}
                            </button>

                            <button
                                onClick={createCounter}
                                className='flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm md:text-base'
                            >
                                <Plus size={18} />
                                Add Counter
                            </button>
                        </div>
                    </div>
                </div>

                {/* Error Display */}
                {countersError && (
                    <div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-6'>
                        <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-2'>
                                <AlertCircle
                                    size={18}
                                    className='text-red-600'
                                />
                                <p className='text-red-800'>{countersError}</p>
                            </div>
                            <button
                                onClick={clearError}
                                className='text-red-600 hover:text-red-800'
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {countersLoading ? (
                    <div className='text-center py-12'>
                        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
                        <p className='text-gray-600'>Loading counters...</p>
                    </div>
                ) : (
                    <>
                        {/* Counters Grid */}
                        {counters.length > 0 ? (
                            <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6'>
                                {counters.map((counter) => (
                                    <CounterCard
                                        key={counter.id}
                                        counter={counter}
                                        onUpdate={async (updates) => {
                                            try {
                                                await updateCounter(
                                                    counter.id,
                                                    updates
                                                );
                                            } catch (err) {
                                                console.error(
                                                    'Failed to update counter:',
                                                    err
                                                );
                                            }
                                        }}
                                        onIncrement={async () => {
                                            try {
                                                await incrementCounter(counter);
                                            } catch (err) {
                                                console.error(
                                                    'Failed to increment counter:',
                                                    err
                                                );
                                            }
                                        }}
                                        onDecrement={async () => {
                                            try {
                                                await decrementCounter(counter);
                                            } catch (err) {
                                                console.error(
                                                    'Failed to decrement counter:',
                                                    err
                                                );
                                            }
                                        }}
                                        onDelete={async () => {
                                            try {
                                                await deleteCounter(counter.id);
                                            } catch (err) {
                                                console.error(
                                                    'Failed to delete counter:',
                                                    err
                                                );
                                            }
                                        }}
                                    />
                                ))}
                            </div>
                        ) : (
                            /* Empty State */
                            <div className='bg-white rounded-xl shadow-md p-8 md:p-12 text-center'>
                                <div className='text-gray-400 mb-4'>
                                    <Plus size={48} className='mx-auto' />
                                </div>
                                <h3 className='text-lg md:text-xl font-semibold text-gray-900 mb-2'>
                                    No counters yet
                                </h3>
                                <p className='text-gray-600 mb-6'>
                                    Create your first counter to get started!
                                </p>
                                <button
                                    onClick={createCounter}
                                    className='px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors'
                                >
                                    Create First Counter
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
