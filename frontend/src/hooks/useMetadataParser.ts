import { useState, useCallback } from 'react';
import type { MetadataField } from '../types/system';

export const useMetadataParser = () => {
  const [metadataText, setMetadataText] = useState('');
  const [parsedMetadata, setParsedMetadata] = useState<MetadataField[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseMetadata = useCallback((text: string): MetadataField[] => {
    const fields: MetadataField[] = [];
    const lines = text.split('\n');
    let currentGroup = '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('#')) continue;

      // Handle group starts
      if (trimmedLine.startsWith('GROUP = ')) {
        currentGroup = trimmedLine.replace('GROUP = ', '').replace(/"/g, '');
        continue;
      }

      // Handle group ends
      if (trimmedLine.startsWith('END_GROUP')) {
        currentGroup = '';
        continue;
      }

      // Handle key-value pairs
      const match = trimmedLine.match(/^([A-Z_]+)\s*=\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        const cleanValue = value.replace(/"/g, '').trim();
        
        // Determine field type
        let type: MetadataField['type'] = 'string';
        if (/^\d+\.?\d*$/.test(cleanValue)) {
          type = 'number';
        } else if (/^\d{4}-\d{2}-\d{2}/.test(cleanValue)) {
          type = 'date';
        } else if (cleanValue.includes(',')) {
          type = 'array';
        } else if (key.includes('LAT') || key.includes('LON') || key.includes('CORNER')) {
          type = 'coordinate';
        }

        fields.push({
          key,
          value: cleanValue,
          type,
          group: currentGroup || 'General',
          description: getFieldDescription(key)
        });
      }
    }

    return fields;
  }, []);

  const getFieldDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      'LANDSAT_SCENE_ID': 'Unique scene identifier',
      'DATE_ACQUIRED': 'Date when the image was captured',
      'CLOUD_COVER': 'Percentage of cloud coverage',
      'SUN_ELEVATION': 'Sun elevation angle at time of capture',
      'SUN_AZIMUTH': 'Sun azimuth angle at time of capture',
      'WRS_PATH': 'Worldwide Reference System path',
      'WRS_ROW': 'Worldwide Reference System row',
      'UTM_ZONE': 'Universal Transverse Mercator zone',
      'MAP_PROJECTION': 'Coordinate system projection',
      'DATUM': 'Geodetic datum used',
      'SPACECRAFT_ID': 'Satellite that captured the image',
      'SENSOR_ID': 'Sensor instrument used'
    };
    
    return descriptions[key] || 'Metadata field';
  };

  const handleMetadataSubmit = useCallback(async () => {
    if (!metadataText.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Simulate API processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const parsed = parseMetadata(metadataText);
      setParsedMetadata(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse metadata');
    } finally {
      setIsLoading(false);
    }
  }, [metadataText, parseMetadata]);

  const clearMetadata = useCallback(() => {
    setMetadataText('');
    setParsedMetadata([]);
    setError(null);
  }, []);

  return {
    metadataText,
    setMetadataText,
    parsedMetadata,
    setParsedMetadata,
    isLoading,
    error,
    handleMetadataSubmit,
    clearMetadata,
    parseMetadata
  };
};
