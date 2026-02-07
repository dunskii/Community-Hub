import React, { useState } from 'react';

export interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  /** Array of tabs */
  tabs: Tab[];
  /** Default active tab ID */
  defaultActiveTab?: string;
  /** Controlled active tab ID */
  activeTab?: string;
  /** Tab change handler */
  onTabChange?: (tabId: string) => void;
}

export function Tabs({
  tabs,
  defaultActiveTab,
  activeTab: controlledActiveTab,
  onTabChange,
}: TabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(
    defaultActiveTab || tabs[0]?.id
  );

  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;

  const handleTabClick = (tabId: string, disabled?: boolean) => {
    if (disabled) return;

    if (controlledActiveTab === undefined) {
      setInternalActiveTab(tabId);
    }
    onTabChange?.(tabId);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number, disabled?: boolean) => {
    if (disabled) return;

    let newIndex = index;
    if (e.key === 'ArrowRight') {
      newIndex = (index + 1) % tabs.length;
      while (tabs[newIndex]?.disabled) {
        newIndex = (newIndex + 1) % tabs.length;
      }
    } else if (e.key === 'ArrowLeft') {
      newIndex = (index - 1 + tabs.length) % tabs.length;
      while (tabs[newIndex]?.disabled) {
        newIndex = (newIndex - 1 + tabs.length) % tabs.length;
      }
    } else if (e.key === 'Home') {
      newIndex = 0;
      while (tabs[newIndex]?.disabled) {
        newIndex++;
      }
    } else if (e.key === 'End') {
      newIndex = tabs.length - 1;
      while (tabs[newIndex]?.disabled) {
        newIndex--;
      }
    } else {
      return;
    }

    e.preventDefault();
    handleTabClick(tabs[newIndex].id, tabs[newIndex].disabled);
    document.getElementById(`tab-${tabs[newIndex].id}`)?.focus();
  };

  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content;

  return (
    <div className="w-full">
      {/* Tab list */}
      <div
        role="tablist"
        className="flex border-b border-gray-200"
      >
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              disabled={tab.disabled}
              onClick={() => handleTabClick(tab.id, tab.disabled)}
              onKeyDown={(e) => handleKeyDown(e, index, tab.disabled)}
              className={`px-4 py-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary ${
                isActive
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 hover:text-gray-900'
              } ${
                tab.disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer'
              }`}
              style={{ minHeight: '44px' }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab panels */}
      {tabs.map(tab => {
        const isActive = tab.id === activeTab;
        return (
          <div
            key={tab.id}
            id={`panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab.id}`}
            hidden={!isActive}
            className="py-4"
          >
            {isActive && tab.content}
          </div>
        );
      })}
    </div>
  );
}
