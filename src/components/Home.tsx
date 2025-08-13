import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Key, Shield } from 'lucide-react';
import { generateAccessKey, isValidHexKey } from '../utils/securityUtils';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateKey = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setAccessKey(generateAccessKey());
      setIsGenerating(false);
    }, 300);
  };

  const handleJoinGroup = (e: React.FormEvent) => {
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
    const cleanGroupName = trimmedGroupName.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');
    
    if (!cleanGroupName || cleanGroupName === '-') {
      alert('Group name must contain at least one letter or number');
      return;
    }
    
    navigate(`/${cleanGroupName}?key=${trimmedAccessKey}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Counter Groups
          </h1>
          <p className="text-gray-600">
            Create or join a real-time counter group
          </p>
        </div>

        <form onSubmit={handleJoinGroup} className="space-y-6">
          <div>
            <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-2">
              Group Name
            </label>
            <input
              type="text"
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="my-counter-group"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="accessKey" className="block text-sm font-medium text-gray-700 mb-2">
              Access Key
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                id="accessKey"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                placeholder="Enter or generate an access key"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="button"
              onClick={handleGenerateKey}
              disabled={isGenerating}
              className="mt-2 w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {isGenerating ? 'Generating...' : 'Generate Secure Key'}
            </button>
          </div>

          <button
            type="submit"
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Join/Create Group
          </button>
        </form>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Security Note</p>
              <p>
                The access key grants full edit permissions. Keep it secure and only share with trusted users.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};