import React from 'react';
import { motion } from 'framer-motion';

const EmptyState = ({ 
  title = "Nothing to see here", 
  description = "No data found for this section yet.",
  icon = "🔭",
  action = null
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-12 glass-card text-center border-dashed"
    >
      <div className="text-5xl mb-4 animate-float">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-surface-400 max-w-sm mb-6">{description}</p>
      {action && (
        <button 
          onClick={action.onClick}
          className="btn-secondary text-sm"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
};

export default EmptyState;
