import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { cn } from '@/lib/utils';
import type { AOI, AdministrativeBoundary } from '@/lib/api';

// Fix for default markers in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export interface MapViewState {
  center: [number, number];
  zoom: number;
}

interface MapComponentProps {
  className?: string;
  children?: React.ReactNode;
  viewState?: MapViewState;
  onViewStateChange?: (viewState: MapViewState) => void;
  onMapReady?: (map: L.Map) => void;
  drawingEnabled?: boolean;
  drawingMode?: 'polygon' | 'rectangle' | 'circle' | 'freehand';
  onDrawingComplete?: (geometry: GeoJSON.Polygon) => void;
  height?: string;
  showZimbabweBoundary?: boolean;
  showSelectionBoundaries?: boolean;
  selectedAOI?: AOI | null;
  selectedBoundaries?: AdministrativeBoundary[];
  visibleBoundaries?: Set<number>;
}

const MapComponent: React.FC<MapComponentProps> = ({
  className,
  children,
  viewState = { center: [-19.0154, 29.1549], zoom: 6 }, // Zimbabwe coordinates
  onViewStateChange,
  onMapReady,
  drawingEnabled = false,
  drawingMode = 'polygon',
  onDrawingComplete,
  height = '100%',
  showZimbabweBoundary = false,
  showSelectionBoundaries = true,
  selectedAOI = null,
  selectedBoundaries = [],
  visibleBoundaries = new Set()
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const drawingLayerRef = useRef<L.LayerGroup | null>(null);
  const zimbabweBoundaryRef = useRef<L.Polygon | null>(null);
  const aoiLayerRef = useRef<L.LayerGroup | null>(null);
  const boundariesLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map centered on Zimbabwe with better bounds
    const map = L.map(mapRef.current, {
      center: viewState.center,
      zoom: viewState.zoom,
      zoomControl: false, // We'll add custom controls
      attributionControl: true,
      // Better bounds for Zimbabwe region
      maxBounds: [[-23, 24], [-15, 34]], // Tighter bounds around Zimbabwe
      maxBoundsViscosity: 0.8,
    });

    // Add base layer
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add satellite layer option
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      maxZoom: 19,
    });

    // Terrain layer
    const terrainLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)',
      maxZoom: 17,
    });

    // Layer control
    const baseLayers = {
      'Street Map': osmLayer,
      'Satellite': satelliteLayer,
      'Terrain': terrainLayer,
    };

    L.control.layers(baseLayers).addTo(map);

    // Accurate Zimbabwe boundary coordinates (more detailed)
    const zimbabweBoundary = L.polygon([
      // Northern border with Zambia (more detailed)
      [-15.6089, 25.2373], [-15.6089, 26.0000], [-15.6089, 27.0000], [-15.6089, 28.0267], 
      [-15.8000, 28.3000], [-16.0045, 28.5756], [-16.2000, 28.7500], [-16.3479, 28.9851], 
      [-16.6000, 29.5000], [-16.8449, 30.2734], [-17.0000, 30.4500], [-17.2123, 30.6829],
      [-17.4046, 31.1928], [-17.6000, 31.3500], [-17.7742, 31.5512], [-18.0000, 31.8000],
      [-18.2452, 32.2046], [-18.4000, 32.4000], [-18.5366, 32.6651], [-18.8000, 32.9000],
      [-19.0154, 33.0537], [-19.5000, 33.1500], [-20.0454, 33.2251],
      
      // Eastern border with Mozambique (more detailed)
      [-20.2000, 33.0000], [-20.4589, 32.8491], [-20.7000, 32.6000], [-21.0845, 32.2046],
      [-21.3000, 32.0000], [-21.5000, 31.8000], [-21.7883, 31.9819], [-22.0000, 31.5000],
      [-22.2714, 31.1928], [-22.3500, 30.8000], [-22.4167, 30.2734], [-22.3000, 29.8000],
      [-22.2714, 29.1574], [-22.1000, 28.5000], [-21.9258, 27.9502], [-21.7000, 27.5000],
      [-21.4186, 26.8342], [-21.2000, 26.4000], [-20.9157, 25.7695], [-20.7000, 25.5000],
      
      // Southern border with South Africa (more detailed)
      [-20.5000, 25.3000], [-20.2000, 25.2500], [-20.0888, 25.4087], [-19.8000, 25.3000],
      [-19.5000, 25.2500], [-19.2619, 25.2373], [-19.0000, 25.3000], [-18.7229, 25.4087],
      [-18.5000, 25.6000], [-18.1456, 25.7695], [-17.8000, 26.0000], [-17.6086, 26.1302],
      [-17.3000, 26.3000], [-17.0674, 26.4909], [-16.8000, 26.6000], [-16.5264, 26.8342],
      
      // Western border with Botswana (more detailed)
      [-16.3000, 27.0000], [-16.1000, 27.2000], [-15.9852, 27.3853], [-15.8000, 27.6000],
      [-15.7000, 27.8000], [-15.6500, 28.0000], [-15.6089, 28.0267],
      [-15.6089, 25.2373] // Close the polygon
    ], {
      color: '#1e40af',
      weight: 3,
      fillOpacity: 0.08,
      fillColor: '#1e40af',
      dashArray: undefined
    });

    // Add boundary to map if enabled
    if (showZimbabweBoundary) {
      zimbabweBoundary.addTo(map);
    }
    
    zimbabweBoundaryRef.current = zimbabweBoundary;

    // Fit map to Zimbabwe bounds on initialization
    map.fitBounds(zimbabweBoundary.getBounds(), { padding: [20, 20] });

    // Initialize drawing layer
    const drawingLayer = L.layerGroup().addTo(map);
    drawingLayerRef.current = drawingLayer;

    // Initialize AOI layer
    const aoiLayer = L.layerGroup().addTo(map);
    aoiLayerRef.current = aoiLayer;

    // Initialize boundaries layer
    const boundariesLayer = L.layerGroup().addTo(map);
    boundariesLayerRef.current = boundariesLayer;

    // Map event handlers
    map.on('moveend zoomend', () => {
      if (onViewStateChange) {
        onViewStateChange({
          center: [map.getCenter().lat, map.getCenter().lng],
          zoom: map.getZoom(),
        });
      }
    });

    // Drawing functionality with Leaflet.Geoman
    if (drawingEnabled) {
      // Add Geoman controls to map
      map.pm.addControls({
        position: 'topleft',
        drawControls: true,
        editControls: true,
        optionsControls: false,
        customControls: true,
        oneBlock: false,
      });

      // Configure drawing options based on drawingMode
      const drawingOptions = {
        snappable: true,
        snapDistance: 20,
        allowSelfIntersection: false,
        templineStyle: {
          color: '#3b82f6',
          weight: 2,
          radius: 5,
        },
        hintlineStyle: {
          color: '#3b82f6',
          weight: 2,
          dashArray: '4, 6',
          radius: 5,
        },
        pathOptions: {
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.1,
          weight: 2,
        },
      };

      // Enable specific drawing mode
      if (drawingMode === 'polygon') {
        map.pm.enableDraw('Polygon', drawingOptions);
      } else if (drawingMode === 'rectangle') {
        map.pm.enableDraw('Rectangle', drawingOptions);
      } else if (drawingMode === 'circle') {
        map.pm.enableDraw('Circle', drawingOptions);
      } else if (drawingMode === 'freehand') {
        map.pm.enableDraw('Polygon', {
          ...drawingOptions,
          continueDrawing: false,
          markerStyle: { opacity: 0 }, // Hide vertex markers for freehand
        });
      }

      // Handle drawing completion
      map.on('pm:create', (e: any) => {
        const layer = e.layer;
        
        // Style the completed shape
        if (layer.setStyle) {
          layer.setStyle({
            color: '#22c55e',
            fillColor: '#22c55e',
            fillOpacity: 0.2,
            weight: 2,
          });
        }

        // Convert to GeoJSON and call completion handler
        if (onDrawingComplete) {
          const geoJson = layer.toGeoJSON();
          if (geoJson.geometry.type === 'Polygon' || 
              (geoJson.geometry.type === 'Point' && drawingMode === 'circle')) {
            
            // For circles, convert to polygon approximation
            if (drawingMode === 'circle' && layer instanceof L.Circle) {
              const center = layer.getLatLng();
              const radius = layer.getRadius();
              const numPoints = 64;
              const coordinates = [];
              
              for (let i = 0; i <= numPoints; i++) {
                const angle = (i * 360) / numPoints;
                const angleRad = (angle * Math.PI) / 180;
                const earthRadius = 6378137;
                
                const latRad = (center.lat * Math.PI) / 180;
                const lngRad = (center.lng * Math.PI) / 180;
                
                const deltaLat = radius * Math.cos(angleRad) / earthRadius;
                const deltaLng = radius * Math.sin(angleRad) / (earthRadius * Math.cos(latRad));
                
                const newLat = latRad + deltaLat;
                const newLng = lngRad + deltaLng;
                
                coordinates.push([
                  (newLng * 180) / Math.PI,
                  (newLat * 180) / Math.PI
                ]);
              }
              
              const circlePolygon: GeoJSON.Polygon = {
                type: 'Polygon',
                coordinates: [coordinates],
              };
              onDrawingComplete(circlePolygon);
            } else {
              onDrawingComplete(geoJson.geometry as GeoJSON.Polygon);
            }
          }
        }

        // Add to drawing layer for management
        if (drawingLayerRef.current) {
          drawingLayerRef.current.addLayer(layer);
        }
      });

      // Handle drawing cancellation
      map.on('pm:drawstart', () => {
        // Clear any existing drawings if needed
        if (drawingLayerRef.current) {
          drawingLayerRef.current.clearLayers();
        }
      });

    } else {
      // Disable all Geoman controls when drawing is disabled
      map.pm.removeControls();
      map.pm.disableDraw();
    }

    mapInstanceRef.current = map;
    
    if (onMapReady) {
      onMapReady(map);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update map view when viewState prop changes
  useEffect(() => {
    if (mapInstanceRef.current && viewState) {
      mapInstanceRef.current.setView(viewState.center, viewState.zoom);
    }
  }, [viewState]);

  // Handle drawing mode and cursor changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      const map = mapInstanceRef.current;
      
      if (drawingEnabled) {
        // Enable specific drawing mode with Geoman
        map.pm.disableDraw(); // Disable any current drawing
        
        if (drawingMode === 'polygon') {
          map.pm.enableDraw('Polygon');
        } else if (drawingMode === 'rectangle') {
          map.pm.enableDraw('Rectangle');
        } else if (drawingMode === 'circle') {
          map.pm.enableDraw('Circle');
        } else if (drawingMode === 'freehand') {
          map.pm.enableDraw('Polygon', { continueDrawing: false });
        }
      } else {
        map.pm.disableDraw();
      }
    }
  }, [drawingEnabled, drawingMode]);

  // Handle Zimbabwe boundary visibility
  useEffect(() => {
    if (mapInstanceRef.current && zimbabweBoundaryRef.current) {
      if (showZimbabweBoundary) {
        mapInstanceRef.current.addLayer(zimbabweBoundaryRef.current);
      } else {
        mapInstanceRef.current.removeLayer(zimbabweBoundaryRef.current);
      }
    }
  }, [showZimbabweBoundary]);

  // Handle selection boundaries visibility
  useEffect(() => {
    if (mapInstanceRef.current && drawingLayerRef.current) {
      const layers = drawingLayerRef.current.getLayers();
      layers.forEach((layer: any) => {
        if (layer.setStyle) {
          if (showSelectionBoundaries) {
            layer.setStyle({ opacity: 1, fillOpacity: 0.2 });
          } else {
            layer.setStyle({ opacity: 0, fillOpacity: 0 });
          }
        }
      });
    }
  }, [showSelectionBoundaries]);

  // Handle AOI display and zoom
  useEffect(() => {
    if (!mapInstanceRef.current || !aoiLayerRef.current) return;

    // Clear existing AOI layers
    aoiLayerRef.current.clearLayers();

    if (selectedAOI && selectedAOI.geometry) {
      try {
        // Convert GeoJSON to Leaflet layer
        const geoJsonLayer = L.geoJSON(selectedAOI.geometry, {
          style: {
            color: '#22c55e',
            fillColor: '#22c55e',
            fillOpacity: 0.2,
            weight: 3,
            opacity: 0.8
          },
          onEachFeature: (_, layer) => {
            // Add popup with AOI information
            layer.bindPopup(`
              <div class="text-sm">
                <div class="font-semibold text-gray-900 mb-1">${selectedAOI.name}</div>
                <div class="text-gray-600 text-xs mb-1">${selectedAOI.description}</div>
                <div class="text-gray-500 text-xs">
                  Area: ${selectedAOI.area_km2 ? selectedAOI.area_km2.toFixed(2) + ' km²' : 'Unknown'}
                </div>
              </div>
            `);
          }
        });

        // Add to AOI layer
        geoJsonLayer.addTo(aoiLayerRef.current);

        // Zoom to AOI bounds if bounds are available
        if (selectedAOI.bounds && selectedAOI.bounds.length === 4) {
          const [minLon, minLat, maxLon, maxLat] = selectedAOI.bounds;
          const bounds = L.latLngBounds([minLat, minLon], [maxLat, maxLon]);
          mapInstanceRef.current.fitBounds(bounds, { 
            padding: [20, 20],
            maxZoom: 16 // Don't zoom in too close for small AOIs
          });
        } else {
          // Fallback: fit to the geometry bounds
          const bounds = geoJsonLayer.getBounds();
          if (bounds.isValid()) {
            mapInstanceRef.current.fitBounds(bounds, { 
              padding: [20, 20],
              maxZoom: 16
            });
          }
        }
      } catch (error) {
        console.error('Error displaying AOI on map:', error);
      }
    }
  }, [selectedAOI]);

  // Handle administrative boundaries display
  useEffect(() => {
    if (!mapInstanceRef.current || !boundariesLayerRef.current) return;

    // Clear existing boundary layers
    boundariesLayerRef.current.clearLayers();

    if (selectedBoundaries && selectedBoundaries.length > 0) {
      selectedBoundaries.forEach((boundary) => {
        // Only show if boundary is visible
        if (!visibleBoundaries.has(boundary.id)) return;

        try {
          if (boundary.geometry) {
            // Get color based on administrative level
            const getColor = (level: string) => {
              switch (level) {
                case 'country': return '#2563eb'; // Blue
                case 'province': return '#16a34a'; // Green  
                case 'district': return '#ea580c'; // Orange
                default: return '#8b5cf6'; // Purple
              }
            };

            // Convert GeoJSON to Leaflet layer
            const geoJsonLayer = L.geoJSON(boundary.geometry, {
              style: {
                color: getColor(boundary.level),
                fillColor: getColor(boundary.level),
                fillOpacity: 0.1,
                weight: boundary.level === 'country' ? 3 : 2,
                opacity: 0.8
              },
              onEachFeature: (_, layer) => {
                // Add popup with boundary information
                layer.bindPopup(`
                  <div class="text-sm">
                    <div class="font-semibold text-gray-900 mb-1">${boundary.name}</div>
                    <div class="text-gray-600 text-xs mb-1">
                      Level: ${boundary.level.charAt(0).toUpperCase() + boundary.level.slice(1)}
                    </div>
                    ${boundary.area_km2 ? 
                      `<div class="text-gray-500 text-xs">Area: ${boundary.area_km2.toFixed(2)} km²</div>` : 
                      ''
                    }
                  </div>
                `);
              }
            });

            // Add to boundaries layer
            geoJsonLayer.addTo(boundariesLayerRef.current!);
          }
        } catch (error) {
          console.error('Error displaying boundary on map:', boundary.name, error);
        }
      });
    }
  }, [selectedBoundaries, visibleBoundaries]);

  return (
    <div className={cn('relative', className)} style={{ height }}>
      <div ref={mapRef} className="w-full h-full" />
      
      {drawingEnabled && (
        <div className="absolute top-4 left-4 z-[1000]">
          <div className="bg-white rounded-lg shadow-lg p-3 text-sm">
            {drawingMode === 'rectangle' ? (
              <p className="text-gray-600">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Click and drag to draw a rectangle
              </p>
            ) : drawingMode === 'circle' ? (
              <p className="text-gray-600">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Click and drag to draw a circle
              </p>
            ) : drawingMode === 'freehand' ? (
              <p className="text-gray-600">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Click and drag to draw freehand
              </p>
            ) : (
              <p className="text-gray-600">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Click to add points, double-click to finish polygon
              </p>
            )}
          </div>
        </div>
      )}
      
      {children}
    </div>
  );
};

export default MapComponent;
