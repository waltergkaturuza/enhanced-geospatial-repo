import React from 'react';
import { cn } from '../../lib/utils';
import { SYSTEM_TABS } from '../../constants/system';
import type { SystemTab } from '../../types/system';

interface SystemNavigationProps {
  activeTab: SystemTab;
  setActiveTab: (tab: SystemTab) => void;
}

const SystemNavigation: React.FC<SystemNavigationProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6">
      <nav className="flex space-x-8">
        {SYSTEM_TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default SystemNavigation;
