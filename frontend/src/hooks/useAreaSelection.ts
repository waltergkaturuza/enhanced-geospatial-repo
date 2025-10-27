import { useState } from 'react';
import { GeospatialAPI, type AOI } from '../lib/api.ts';
import type { AreaOfInterest } from '@/types';

export const useAreaSelection = () => {
  const [areaSelectionMode, setAreaSelectionMode] = useState<'none' | 'coordinates' | 'drawing' | 'upload'>('none');
  const [selectedCoordinateSystem, setSelectedCoordinateSystem] = useState<string>('wgs84');
  const [coordinateInputs, setCoordinateInputs] = useState({
    latitude: '',
    longitude: '',
    latitudeMax: '',
    longitudeMax: '',
    easting: '',
    northing: '',
    eastingMax: '',
    northingMax: ''
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessingFiles, setIsProcessingFiles] = useState<boolean>(false);
  const [areasOfInterest, setAreasOfInterest] = useState<AreaOfInterest[]>([]);
  const [activeDrawingTool, setActiveDrawingTool] = useState<string | null>(null);
  const [selectedAOI, setSelectedAOI] = useState<AOI | null>(null);

  const processUploadedFiles = async () => {
    if (uploadedFiles.length === 0) return;

    setUploadError(null);
    setIsProcessingFiles(true);

    try {
      const allCreatedAOIs = [];

      for (const file of uploadedFiles) {
        const formData = new FormData();
        formData.append('file', file);

        const result = await GeospatialAPI.uploadGeometry(formData);
        
        if (result.success && (result.created_aois || result.aoi)) {
          const createdAOIs = result.created_aois || (result.aoi ? [result.aoi] : []);
          allCreatedAOIs.push(...createdAOIs);
        }
      }

      if (allCreatedAOIs.length > 0) {
        setSelectedAOI(allCreatedAOIs[0]);
        
        const newAreaOfInterest = allCreatedAOIs.map(aoi => ({
          id: `aoi-${aoi.id}`,
          name: aoi.name || `Uploaded AOI ${aoi.id}`,
          type: 'file' as const,
          coordinates: [],
          coordinateSystem: selectedCoordinateSystem,
          area: aoi.area_km2 || 0,
          bounds: aoi.bounds || [0, 0, 0, 0],
          metadata: {
            filename: uploadedFiles[0]?.name,
            uploadDate: new Date().toISOString(),
            source: 'upload'
          }
        }));
        
        setAreasOfInterest(prev => [...prev, ...newAreaOfInterest]);
        setUploadedFiles([]);
        
        console.log('AOI upload successful:', allCreatedAOIs);
      }
    } catch (error: any) {
      console.error('Error processing uploaded files:', error);
      
      let errorMessage = 'Failed to process uploaded files. Please try again.';
      
      if (error.response?.data?.details) {
        errorMessage = error.response.data.details;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setUploadError(errorMessage);
      
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
      }
    } finally {
      setIsProcessingFiles(false);
    }
  };

  return {
    areaSelectionMode,
    setAreaSelectionMode,
    selectedCoordinateSystem,
    setSelectedCoordinateSystem,
    coordinateInputs,
    setCoordinateInputs,
    uploadedFiles,
    setUploadedFiles,
    uploadError,
    setUploadError,
    isProcessingFiles,
    setIsProcessingFiles,
    areasOfInterest,
    setAreasOfInterest,
    activeDrawingTool,
    setActiveDrawingTool,
    selectedAOI,
    setSelectedAOI,
    processUploadedFiles
  };
};
