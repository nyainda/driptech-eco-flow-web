import React from 'react';
import { Quote } from './types';

interface ProjectDetailsProps {
  quote: Quote;
}

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({ quote }) => {
  if (!quote.project_type && !quote.crop_type && !quote.area_size) return null;
  
  return (
    <div className="mb-8 bg-blue-50 dark:bg-blue-900/30 p-5 rounded-lg border-l-4 border-blue-900 dark:border-blue-500">
      <h3 className="font-semibold mb-4 text-blue-900 dark:text-blue-400 text-lg">Project Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        {quote.project_type && (
          <div>
            <span className="font-medium text-gray-900 dark:text-gray-200">Project Type:</span> 
            <span className="text-gray-600 dark:text-gray-400"> {quote.project_type}</span>
          </div>
        )}
        {quote.crop_type && (
          <div>
            <span className="font-medium text-gray-900 dark:text-gray-200">Crop Type:</span> 
            <span className="text-gray-600 dark:text-gray-400"> {quote.crop_type}</span>
          </div>
        )}
        {quote.area_size && (
          <div>
            <span className="font-medium text-gray-900 dark:text-gray-200">Area Size:</span> 
            <span className="text-gray-600 dark:text-gray-400"> {quote.area_size} acres</span>
          </div>
        )}
        {quote.water_source && (
          <div>
            <span className="font-medium text-gray-900 dark:text-gray-200">Water Source:</span> 
            <span className="text-gray-600 dark:text-gray-400"> {quote.water_source}</span>
          </div>
        )}
      </div>
      {quote.terrain_info && (
        <div className="mt-4 text-sm">
          <span className="font-medium text-gray-900 dark:text-gray-200">Terrain Info:</span> 
          <span className="text-gray-600 dark:text-gray-400"> {quote.terrain_info}</span>
        </div>
      )}
    </div>
  );
};