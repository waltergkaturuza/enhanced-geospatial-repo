import React from 'react';
import { Satellite, Calendar, MapPin, Globe, Database, Layers } from 'lucide-react';
import { SAMPLE_METADATA, METADATA_FIELD_GROUPS } from '../../constants/system';
import type { MetadataField } from '../../types/system';

interface MetadataTabProps {
  metadataText: string;
  setMetadataText: (text: string) => void;
  parsedMetadata: MetadataField[];
  isLoading: boolean;
  error: string | null;
  handleMetadataSubmit: () => void;
}

const MetadataTab: React.FC<MetadataTabProps> = ({
  metadataText,
  setMetadataText,
  parsedMetadata,
  isLoading,
  error,
  handleMetadataSubmit
}) => {
  const groupedMetadata = parsedMetadata.reduce((groups, field) => {
    const group = field.group || 'General';
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(field);
    return groups;
  }, {} as Record<string, MetadataField[]>);

  const getFieldIcon = (type: MetadataField['type']) => {
    switch (type) {
      case 'coordinate':
        return <MapPin className="w-4 h-4 text-blue-500" />;
      case 'date':
        return <Calendar className="w-4 h-4 text-green-500" />;
      case 'number':
        return <Database className="w-4 h-4 text-purple-500" />;
      case 'array':
        return <Layers className="w-4 h-4 text-orange-500" />;
      default:
        return <Globe className="w-4 h-4 text-gray-500" />;
    }
  };

  const getGroupIcon = (groupName: string) => {
    if (groupName.includes('METADATA') || groupName.includes('INFO')) {
      return <Database className="w-5 h-5 text-blue-500" />;
    }
    if (groupName.includes('PRODUCT') || groupName.includes('IMAGE')) {
      return <Satellite className="w-5 h-5 text-green-500" />;
    }
    if (groupName.includes('PROJECTION') || groupName.includes('ATTRIBUTES')) {
      return <MapPin className="w-5 h-5 text-purple-500" />;
    }
    return <Globe className="w-5 h-5 text-gray-500" />;
  };

  const getSatelliteFromMetadata = (): string => {
    const sceneId = parsedMetadata.find(field => 
      field.key.includes('SCENE_ID') || field.key.includes('PRODUCT_ID')
    )?.value || '';
    
    if (sceneId.startsWith('LC08') || sceneId.includes('LANDSAT_8')) return 'Landsat 8';
    if (sceneId.startsWith('LC09') || sceneId.includes('LANDSAT_9')) return 'Landsat 9';
    if (sceneId.startsWith('LE07') || sceneId.includes('LANDSAT_7')) return 'Landsat 7';
    if (sceneId.startsWith('LT05') || sceneId.includes('LANDSAT_5')) return 'Landsat 5';
    if (sceneId.includes('S2A') || sceneId.includes('S2B')) return 'Sentinel-2';
    if (sceneId.includes('S1A') || sceneId.includes('S1B')) return 'Sentinel-1';
    return 'Unknown';
  };

  const renderSatelliteInfo = () => {
    const satellite = getSatelliteFromMetadata();
    if (satellite === 'Unknown') return null;

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <Satellite className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-blue-900">Detected Satellite: {satellite}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {parsedMetadata.filter(field => 
            field.key.includes('DATE') || field.key.includes('PATH') || 
            field.key.includes('ROW') || field.key.includes('CLOUD')
          ).slice(0, 4).map(field => (
            <div key={field.key}>
              <span className="text-blue-700 font-medium">{field.key.replace(/_/g, ' ')}</span>
              <p className="text-blue-600">{field.value}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Metadata Input */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Metadata Parser</h2>
            <button
              onClick={() => setMetadataText(SAMPLE_METADATA)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Load Sample
            </button>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <textarea
              value={metadataText}
              onChange={(e) => setMetadataText(e.target.value)}
              placeholder="Paste Landsat metadata here..."
              className="w-full h-96 font-mono text-sm border-0 resize-none focus:outline-none"
            />
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-500">
                {metadataText.split('\n').length} lines
              </span>
              <button
                onClick={handleMetadataSubmit}
                disabled={!metadataText.trim() || isLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Parsing...' : 'Parse Metadata'}
              </button>
            </div>
            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Parsed Results */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Parsed Satellite Metadata
          </h2>
          
          {/* Parsed Metadata Results */}
          <div>
            {/* Satellite Detection Info */}
            {parsedMetadata.length > 0 && renderSatelliteInfo()}
            
            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            
            {parsedMetadata.length === 0 ? (
              <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                <Satellite className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-500 mb-2">No Metadata Parsed</h3>
                <p className="text-gray-400">
                  Paste metadata text and click "Parse Metadata" to analyze satellite imagery metadata
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedMetadata).map(([groupName, fields]) => (
                  <div key={groupName} className="bg-white rounded-lg border border-gray-200">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
                      <div className="flex items-center space-x-2">
                        {getGroupIcon(groupName)}
                        <h3 className="font-medium text-gray-900">
                          {METADATA_FIELD_GROUPS[groupName as keyof typeof METADATA_FIELD_GROUPS] || groupName}
                        </h3>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {fields.length} fields
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-1 gap-3">
                        {fields.map((field, index) => (
                          <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                            {getFieldIcon(field.type)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <p className="font-medium text-gray-900 text-sm">{field.key}</p>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  field.type === 'coordinate' ? 'bg-blue-100 text-blue-800' :
                                  field.type === 'date' ? 'bg-green-100 text-green-800' :
                                  field.type === 'number' ? 'bg-purple-100 text-purple-800' :
                                  field.type === 'array' ? 'bg-orange-100 text-orange-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {field.type}
                                </span>
                              </div>
                              <p className="text-gray-700 text-sm mt-1 break-all">{field.value}</p>
                              {field.description && (
                                <p className="text-gray-500 text-xs mt-1">{field.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetadataTab;
