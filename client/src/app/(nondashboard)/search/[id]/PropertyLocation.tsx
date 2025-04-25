import React, { useEffect, useRef, useState } from 'react';
import { useGetPropertyQuery } from '@/state/api';
import { Compass, MapPin } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Loading from '@/components/Loading';

// Make sure the access token is set
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN as string;

const PropertyLocation = ({ propertyId }: PropertyLocationProps) => {
  const {
    data: property,
    isError,
    isLoading,
    refetch,
  } = useGetPropertyQuery(propertyId);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    // For debugging
    console.log(
      'Mapbox Access Token:',
      process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    );
    console.log('Property Data:', property);
    console.log('Map Container:', mapContainerRef.current);

    if (isLoading) {
      console.log('Loading state, waiting for property data...');
      return;
    }

    if (isError || !property) {
      console.log('Error or missing property data, may retry fetching...');
      
      // If we have retries left and there's no data, try again
      if (retryCount < maxRetries && !property) {
        const timer = setTimeout(() => {
          console.log(`Retrying property fetch (${retryCount + 1}/${maxRetries})...`);
          setRetryCount(prev => prev + 1);
          refetch();
        }, 2000); // Wait 2 seconds before retrying
        
        return () => clearTimeout(timer);
      }
      
      return;
    }

    // Reset retry count on successful data load
    if (retryCount > 0) {
      setRetryCount(0);
    }

    if (!property.location || !property.location.coordinates) {
      console.error('Invalid coordinates:', property.location);
      setMapError('Property location coordinates are missing');
      return;
    }

    if (!mapboxgl.accessToken) {
      console.error('Mapbox access token is missing');
      setMapError('Map configuration error: missing access token');
      return;
    }

    // Check if the container is ready
    if (!mapContainerRef.current) {
      console.error('Map container reference is not available');
      return;
    }

    let map: mapboxgl.Map | null = null;

    // Add a small delay to ensure container is ready
    const timer = setTimeout(() => {
      try {
        console.log(
          'Initializing map with coordinates:',
          property.location.coordinates
        );

        map = new mapboxgl.Map({
          container: mapContainerRef.current!,
          style: 'mapbox://styles/mapbox/streets-v12', // Fallback to default Mapbox style
          center: [
            property.location.coordinates.longitude,
            property.location.coordinates.latitude,
          ],
          zoom: 14,
        });

        map.on('load', () => {
          console.log('Map loaded successfully');
        });

        map.on('error', (e) => {
          console.error('Mapbox error:', e);
          setMapError(`Map error: ${e.error?.message || 'Unknown error'}`);
        });

        const marker = new mapboxgl.Marker()
          .setLngLat([
            property.location.coordinates.longitude,
            property.location.coordinates.latitude,
          ])
          .addTo(map);

        // Force map to resize after rendering
        map.resize();
      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError(
          `Failed to initialize map: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }, 500); // Increased delay for better reliability

    return () => {
      clearTimeout(timer);
      if (map) {
        console.log('Removing map instance');
        map.remove();
      }
    };
  }, [property, isError, isLoading, retryCount, refetch, propertyId]);

  if (isLoading) return <Loading />;
  
  if (isError || (!property && retryCount >= maxRetries)) {
    console.error('Error fetching property data after retries');
    return (
      <div className="py-16">
        <h3 className="text-xl font-semibold text-primary-800 dark:text-primary-100">
          Map and Location
        </h3>
        <div className="p-8 bg-red-50 text-red-700 rounded-lg mt-4 text-center">
          Unable to load property location information. Please try refreshing the page.
        </div>
      </div>
    );
  }
  
  // When still retrying
  if (!property && retryCount < maxRetries) {
    return <Loading />;
  }

  return (
    <div className="py-16">
      <h3 className="text-xl font-semibold text-primary-800 dark:text-primary-100">
        Map and Location
      </h3>
      <div className="flex justify-between items-center text-sm text-primary-500 mt-2">
        <div className="flex items-center text-gray-500">
          <MapPin className="w-4 h-4 mr-1 text-gray-700" />
          Property Address:
          <span className="ml-2 font-semibold text-gray-700">
            {property?.location?.address || 'Address not available'}
          </span>
        </div>
        {property?.location?.address && (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(
              property.location.address
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex justify-between items-center hover:underline gap-2 text-primary-600"
          >
            <Compass className="w-5 h-5" />
            Get Directions
          </a>
        )}
      </div>
      <div
        className="w-full sm:basis-5/12 grow relative rounded-xl mt-4"
        style={{ minHeight: '400px', border: '1px solid #ccc' }}
      >
        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-red-500 z-10 p-4 text-center">
            {mapError}
          </div>
        )}
        <div
          className="map-container rounded-xl absolute inset-0 bg-gray-50"
          ref={mapContainerRef}
        />
      </div>
    </div>
  );
};

export default PropertyLocation;
