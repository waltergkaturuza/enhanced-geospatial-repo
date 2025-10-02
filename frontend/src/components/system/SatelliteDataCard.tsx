import React from 'react';
import { Satellite, Calendar, MapPin, Layers, Cloud, Sun } from 'lucide-react';

interface SatelliteDataCardProps {
  satellite: string;
  sceneId: string;
  acquisitionDate: string;
  path?: number;
  row?: number;
  cloudCover?: number;
  sunElevation?: number;
  processingLevel: string;
  bands: string[];
}

export const SatelliteDataCard: React.FC<SatelliteDataCardProps> = ({
  satellite,
  sceneId,
  acquisitionDate,
  path,
  row,
  cloudCover,
  sunElevation,
  processingLevel,
  bands
}) => {
  const getSatelliteColor = (sat: string) => {
    if (sat.includes('Landsat')) return 'blue';
    if (sat.includes('Sentinel')) return 'green';
    if (sat.includes('GaoFen')) return 'red';
    return 'gray';
  };

  const color = getSatelliteColor(satellite);
  
  return (
    <div className={`bg-${color}-50 border border-${color}-200 rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Satellite className={`w-5 h-5 text-${color}-600`} />
          <span className={`font-semibold text-${color}-900`}>{satellite}</span>
        </div>
        <span className={`text-xs px-2 py-1 bg-${color}-100 text-${color}-700 rounded-full`}>
          {processingLevel}
        </span>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center space-x-2">
          <Calendar className={`w-4 h-4 text-${color}-600`} />
          <span className={`text-${color}-700`}>
            {new Date(acquisitionDate).toLocaleDateString()}
          </span>
        </div>
        
        {path && row && (
          <div className="flex items-center space-x-2">
            <MapPin className={`w-4 h-4 text-${color}-600`} />
            <span className={`text-${color}-700`}>
              Path: {path}, Row: {row}
            </span>
          </div>
        )}
        
        {cloudCover !== undefined && (
          <div className="flex items-center space-x-2">
            <Cloud className={`w-4 h-4 text-${color}-600`} />
            <span className={`text-${color}-700`}>
              Cloud Cover: {cloudCover}%
            </span>
          </div>
        )}
        
        {sunElevation !== undefined && (
          <div className="flex items-center space-x-2">
            <Sun className={`w-4 h-4 text-${color}-600`} />
            <span className={`text-${color}-700`}>
              Sun Elevation: {sunElevation}°
            </span>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <Layers className={`w-4 h-4 text-${color}-600`} />
          <span className={`text-${color}-700`}>
            {bands.length} Bands
          </span>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className={`text-xs text-${color}-600 font-mono`}>
          {sceneId}
        </p>
      </div>
    </div>
  );
};

export default SatelliteDataCard;
