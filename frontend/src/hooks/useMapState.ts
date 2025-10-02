import { useState } from 'react';
import type { MapViewState } from '../types';

export const useMapState = () => {
  const [mapViewState, setMapViewState] = useState<MapViewState>({ 
    center: [-19.0154, 29.1549], 
    zoom: 6 
  });
  
  const [mapRotation, setMapRotation] = useState<number>(0);
  const [is3DMode, setIs3DMode] = useState<boolean>(false);
  const [showMinimap, setShowMinimap] = useState<boolean>(true);
  const [showCoordinates, setShowCoordinates] = useState<boolean>(true);
  const [showScale, setShowScale] = useState<boolean>(true);
  const [showZimbabweBoundary, setShowZimbabweBoundary] = useState<boolean>(false);
  const [showSelectionBoundaries, setShowSelectionBoundaries] = useState<boolean>(true);

  return {
    mapViewState,
    setMapViewState,
    mapRotation,
    setMapRotation,
    is3DMode,
    setIs3DMode,
    showMinimap,
    setShowMinimap,
    showCoordinates,
    setShowCoordinates,
    showScale,
    setShowScale,
    showZimbabweBoundary,
    setShowZimbabweBoundary,
    showSelectionBoundaries,
    setShowSelectionBoundaries
  };
};
