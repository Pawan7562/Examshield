// src/components/ui/Tabs.js
import React from 'react';
import { motion } from 'framer-motion';

export const Tabs = ({
  tabs = [],
  activeTab,
  onChange,
  className = '',
  layoutId = 'activeTabIndicator',
}) => {
  return (
    <div className={`flex items-center gap-1.5 p-1 bg-surface-elevated/70 border border-surface-border rounded-xl overflow-x-auto ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`
              relative px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap
              transition-colors duration-200 flex items-center gap-2 select-none z-10
              ${isActive ? 'text-white' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}
            `}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg -z-10 shadow-glow-brand"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            {Icon && <Icon className="w-4 h-4 shrink-0" />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-surface-border text-text-muted'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
