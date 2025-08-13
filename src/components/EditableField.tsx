import React, { useState, useRef, useEffect } from 'react';
import { Check, X, Edit3 } from 'lucide-react';

interface EditableFieldProps {
    value: string | number;
    onSave: (value: string | number) => void;
    placeholder?: string;
    type?: 'text' | 'number';
    className?: string;
    displayClassName?: string;
    inputClassName?: string;
    minValue?: number;
    maxValue?: number;
}

export const EditableField: React.FC<EditableFieldProps> = ({
    value,
    onSave,
    placeholder = '',
    type = 'text',
    className = '',
    displayClassName = '',
    inputClassName = '',
    minValue,
    maxValue,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value.toString());
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setEditValue(value.toString());
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSave = () => {
        let finalValue: string | number = editValue.trim();

        if (type === 'number') {
            const numValue = parseInt(finalValue, 10);
            if (!isNaN(numValue)) {
                if (minValue !== undefined && numValue < minValue) {
                    finalValue = minValue;
                } else if (maxValue !== undefined && numValue > maxValue) {
                    finalValue = maxValue;
                } else {
                    finalValue = numValue;
                }
            } else {
                finalValue = typeof value === 'number' ? value : 0; // Revert to original if invalid
            }
        }

        if (finalValue !== value) {
            console.log('EditableField saving:', finalValue);
            try {
                onSave(finalValue);
            } catch (err) {
                console.error('Error saving field:', err);
            }
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditValue(value.toString());
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            handleCancel();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditValue(e.target.value);
    };

    if (isEditing) {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <input
                    ref={inputRef}
                    type={type}
                    value={editValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    min={minValue}
                    max={maxValue}
                    className={`flex-1 px-2 py-1 border border-blue-300 dark:border-blue-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-card dark:bg-gray-800 text-foreground ${inputClassName}`}
                />
                <button
                    onClick={handleSave}
                    className='p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors'
                    title='Save'
                >
                    <Check size={16} />
                </button>
                <button
                    onClick={handleCancel}
                    className='p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors'
                    title='Cancel'
                >
                    <X size={16} />
                </button>
            </div>
        );
    }

    return (
        <div
            className={`group flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-2 py-1 transition-colors ${className}`}
            onClick={() => setIsEditing(true)}
        >
            <span className={`flex-1 ${displayClassName}`}>
                {value !== null && value !== undefined && value !== ''
                    ? value
                    : placeholder}
            </span>
            <Edit3
                size={14}
                className='text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity'
            />
        </div>
    );
};
