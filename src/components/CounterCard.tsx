import React from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { Counter } from '../hooks/useSupabase';
import { EditableField } from './EditableField';

interface CounterCardProps {
  counter: Counter;
  onUpdate: (updates: Partial<Counter>) => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onDelete: () => void;
}

export const CounterCard: React.FC<CounterCardProps> = ({
  counter,
  onUpdate,
  onIncrement,
  onDecrement,
  onDelete
}) => {
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this counter?')) {
      onDelete();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 md:p-6 border border-gray-100 hover:shadow-lg transition-all duration-200 group">
      {/* Header with name and delete button */}
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <EditableField
          value={counter.name}
          onSave={(value) => onUpdate({ name: value.toString() })}
          placeholder="Counter Name"
          displayClassName="text-base md:text-lg font-semibold text-gray-900"
          className="flex-1"
        />
        <button
          onClick={handleDelete}
          className="p-2 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
          title="Delete Counter"
        >
          <Trash2 size={16} className="md:w-[18px] md:h-[18px]" />
        </button>
      </div>

      {/* Description */}
      <div className="mb-4 md:mb-6">
        <EditableField
          value={counter.description}
          onSave={(value) => onUpdate({ description: value.toString() })}
          placeholder="Add a description..."
          displayClassName="text-sm text-gray-600"
        />
      </div>

      {/* Counter Value - Large and Prominent */}
      <div className="text-center mb-4 md:mb-6">
        <EditableField
          value={counter.value}
          onSave={(value) => onUpdate({ value: Number(value) })}
          type="number"
          displayClassName="text-3xl md:text-5xl font-bold text-blue-600"
          inputClassName="text-center text-2xl md:text-4xl font-bold"
          className="justify-center"
        />
      </div>

      {/* Increment/Decrement Buttons */}
      <div className="flex gap-2 md:gap-3 mb-4 md:mb-6">
        <button
          onClick={onDecrement}
          className="flex-1 flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-2 md:py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors active:scale-95 transform text-sm md:text-base"
        >
          <Minus size={16} className="md:w-5 md:h-5" />
          {counter.decrement_step}
        </button>
        <button
          onClick={onIncrement}
          className="flex-1 flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-2 md:py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors active:scale-95 transform text-sm md:text-base"
        >
          <Plus size={16} className="md:w-5 md:h-5" />
          {counter.increment_step}
        </button>
      </div>

      {/* Step Controls */}
      <div className="grid grid-cols-2 gap-2 md:gap-4 text-xs md:text-sm">
        <div className="space-y-1 order-2 md:order-1">
          <label className="text-gray-600 font-medium">Decrement Step</label>
          <EditableField
            value={counter.decrement_step}
            onSave={(value) => onUpdate({ decrement_step: Number(value) })}
            type="number"
            minValue={1}
            displayClassName="text-gray-900 font-medium"
            inputClassName="text-xs md:text-sm"
          />
        </div>
        <div className="space-y-1 order-1 md:order-2">
          <label className="text-gray-600 font-medium">Increment Step</label>
          <EditableField
            value={counter.increment_step}
            onSave={(value) => onUpdate({ increment_step: Number(value) })}
            type="number"
            minValue={1}
            displayClassName="text-gray-900 font-medium"
            inputClassName="text-xs md:text-sm"
          />
        </div>
      </div>
    </div>
  );
};