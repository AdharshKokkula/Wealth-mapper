
import { useEffect, useState, useRef } from 'react';
import { Property, MapViewState, FilterState } from '@/types';
import PropertyDetails from './PropertyDetails';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { createSavedView } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

// Declare the L variable from Leaflet, which will be available from the CDN
declare const L: any;

interface PropertyMapProps {
  properties: Property[];
  loading: boolean;
  filters: FilterState;
  userId?: string;
  onViewStateChange?: (viewState: MapViewState) => void;
}

const PropertyMap = ({ properties, loading, filters, userId, onViewStateChange }: PropertyMapProps) => {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [viewName, setViewName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize map on component mount
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create map
    const map = L.map(mapContainerRef.current).setView([37.0902, -95.7129], 4);
    
    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Save map instance to ref
    mapRef.current = map;
    
    // Listen for map move/zoom events
    map.on('moveend', () => {
      if (onViewStateChange) {
        const center = map.getCenter();
        onViewStateChange({
          center: [center.lat, center.lng],
          zoom: map.getZoom(),
          bounds: [
            [map.getBounds().getSouth(), map.getBounds().getWest()],
            [map.getBounds().getNorth(), map.getBounds().getEast()]
          ]
        });
      }
    });

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [onViewStateChange]);

  // Update markers when properties change
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Clear existing markers
    markersRef.current.forEach(marker => {
      if (mapRef.current) marker.remove();
    });
    markersRef.current = [];
    
    // Add new markers
    properties.forEach(property => {
      const marker = L.marker([property.latitude, property.longitude], {
        icon: L.divIcon({
          className: 'property-marker',
          html: '<div></div>',
          iconSize: [16, 16]
        })
      }).addTo(mapRef.current);
      
      // Add click handler
      marker.on('click', () => {
        setSelectedProperty(property);
      });
      
      markersRef.current.push(marker);
    });
    
    // If we have markers and they're visible, fit bounds
    if (markersRef.current.length > 0 && !loading) {
      const group = L.featureGroup(markersRef.current);
      mapRef.current.fitBounds(group.getBounds(), { padding: [50, 50] });
    }
  }, [properties, loading]);

  const handleSaveView = () => {
    setSaveDialogOpen(true);
  };

  const saveView = async () => {
    if (!mapRef.current || !userId || !viewName.trim()) {
      toast.error('Unable to save view');
      return;
    }
    
    setIsSaving(true);
    
    try {
      const center = mapRef.current.getCenter();
      const viewState: MapViewState = {
        center: [center.lat, center.lng],
        zoom: mapRef.current.getZoom(),
        bounds: [
          [mapRef.current.getBounds().getSouth(), mapRef.current.getBounds().getWest()],
          [mapRef.current.getBounds().getNorth(), mapRef.current.getBounds().getEast()]
        ]
      };
      
      // Save to Supabase
      await createSavedView(userId, { 
        name: viewName,
        date: new Date().toISOString(),
        viewState,
        filters,
        propertyCount: properties.length,
      });
      
      toast.success('Map view saved successfully!');
      setSaveDialogOpen(false);
      setViewName('');
    } catch (error) {
      console.error('Error saving view:', error);
      toast.error('Failed to save map view');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative h-full">
      {/* Map container */}
      <div 
        ref={mapContainerRef} 
        className="map-container"
        style={{ height: 'calc(100vh - 4rem)' }}
      />
      
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
          <div className="text-xl font-semibold animate-pulse">Loading properties...</div>
        </div>
      )}
      
      {/* Save view button */}
      <div className="absolute top-4 right-4 z-10 space-y-2">
        <Button 
          onClick={handleSaveView}
          variant="secondary" 
          className="shadow-lg"
          disabled={loading || !userId}
        >
          Save Current View
        </Button>
      </div>
      
      {/* Property details popup */}
      {selectedProperty && (
        <div className="absolute bottom-4 left-4 right-4 z-10 max-w-2xl mx-auto">
          <PropertyDetails 
            property={selectedProperty} 
            onClose={() => setSelectedProperty(null)}
          />
        </div>
      )}

      {/* Save view dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Map View</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                placeholder="Downtown Properties"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="text-right text-sm text-muted-foreground">
                Properties
              </div>
              <div className="col-span-3">
                {properties.length} properties visible
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={saveView} disabled={isSaving || !viewName.trim()}>
              {isSaving ? 'Saving...' : 'Save View'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertyMap;
