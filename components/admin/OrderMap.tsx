"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Map, {
  Source,
  Layer,
  NavigationControl,
  FullscreenControl,
  ScaleControl,
  GeolocateControl,
  Popup,
  MapRef
} from "react-map-gl/mapbox";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Loader2, AlertTriangle, MapPin, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Coordinates for major Nigerian states
const STATE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "lagos": { lat: 6.5244, lng: 3.3792 },
  "abuja": { lat: 9.0765, lng: 7.3986 },
  "rivers": { lat: 4.8156, lng: 7.0498 },
  "kano": { lat: 12.0022, lng: 8.5167 },
  "oyo": { lat: 7.3775, lng: 3.9470 },
  "enugu": { lat: 6.4584, lng: 7.5464 },
  "kaduna": { lat: 10.5105, lng: 7.4165 },
  "ogun": { lat: 7.1557, lng: 3.3451 },
  "delta": { lat: 5.5325, lng: 5.8987 },
  "edo": { lat: 6.3350, lng: 5.6037 },
};

interface OrderMapProps {
  data: { state: string; value: number }[];
}

// Mapbox Token - In a real app, this should be in .env.local
// Using a placeholder that will prompt the user if missing
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

// Dummy data helpers
const FIRST_NAMES = ["Chioma", "Emeka", "Adebayo", "Zainab", "Musa", "Ngozi", "Tunde", "Folake", "Kelechi", "Ibrahim", "Sarah", "David", "Amara", "Yusuf", "Funke"];
const LAST_NAMES = ["Okonkwo", "Balogun", "Adeyemi", "Musa", "Ibrahim", "Eze", "Okafor", "Aliyu", "Mensah", "Oni", "Suleiman", "Danladi", "Bassey"];

const STATE_CITIES: Record<string, string[]> = {
  "lagos": ["Ikeja", "Lekki", "Victoria Island", "Yaba", "Surulere", "Ikorodu", "Epe", "Badagry"],
  "abuja": ["Garki", "Wuse", "Maitama", "Asokoro", "Gwarinpa", "Kubwa"],
  "rivers": ["Port Harcourt", "Obio-Akpor", "Bonny", "Degema", "Eleme"],
  "kano": ["Kano Municipal", "Fagge", "Dala", "Gwale", "Tarauni"],
  "oyo": ["Ibadan", "Ogbomosho", "Oyo", "Iseyin"],
  "enugu": ["Enugu", "Nsukka", "Agbani", "Udi"],
  "kaduna": ["Kaduna", "Zaria", "Kafanchan"],
  "ogun": ["Abeokuta", "Ijebu-Ode", "Sagamu", "Ota"],
  "delta": ["Warri", "Asaba", "Sapele", "Ughelli"],
  "edo": ["Benin City", "Auchi", "Ekpoma"],
};

export function OrderMap({ data }: OrderMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState({
    latitude: 9.0820,
    longitude: 8.6753,
    zoom: 5
  });
  const [hoverInfo, setHoverInfo] = useState<{
    longitude: number;
    latitude: number;
    feature: any;
  } | null>(null);
  const [mapStyle, setMapStyle] = useState("mapbox://styles/mapbox/light-v11");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Generate GeoJSON data from the props
  const mapData = useMemo(() => {
    const features: any[] = [];

    data.forEach((item) => {
      const normalizedName = item.state.toLowerCase().replace(" state", "").trim();
      const center = STATE_COORDINATES[normalizedName];
      const cities = STATE_CITIES[normalizedName] || ["Central"];

      if (center) {
        // Generate random points around the center based on the value
        // To simulate real customer distribution
        for (let i = 0; i < item.value; i++) {
          // Add some random jitter (approx 0.1 - 0.5 degrees spread)
          // Using a gaussian-like distribution for more realism
          const r = 0.15 * Math.sqrt(-2 * Math.log(Math.random()));
          const theta = 2 * Math.PI * Math.random();

          const lat = center.lat + r * Math.cos(theta);
          const lng = center.lng + r * Math.sin(theta);

          // Generate random details
          const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
          const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
          const city = cities[Math.floor(Math.random() * cities.length)];

          features.push({
            type: "Feature",
            properties: {
              id: `${normalizedName}-${i}`,
              state: item.state,
              value: 1, // Each point represents 1 customer
              customerName: `${firstName} ${lastName}`,
              location: city
            },
            geometry: {
              type: "Point",
              coordinates: [lng, lat]
            }
          });
        }
      }
    });

    return {
      type: "FeatureCollection",
      features
    };
  }, [data]);

  // Cluster layer configuration
  const clusterLayer: any = {
    id: "clusters",
    type: "circle",
    source: "customers",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": [
        "step",
        ["get", "point_count"],
        "#51bbd6", // Blue for small clusters
        50,
        "#f1f075", // Yellow for medium
        100,
        "#f28cb1"  // Pink for large
      ],
      "circle-radius": [
        "step",
        ["get", "point_count"],
        20,
        100,
        30,
        750,
        40
      ]
    }
  };

  const clusterCountLayer: any = {
    id: "cluster-count",
    type: "symbol",
    source: "customers",
    filter: ["has", "point_count"],
    layout: {
      "text-field": "{point_count_abbreviated}",
      "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
      "text-size": 12
    }
  };

  const unclusteredPointLayer: any = {
    id: "unclustered-point",
    type: "circle",
    source: "customers",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": "#11b4da",
      "circle-radius": 4,
      "circle-stroke-width": 1,
      "circle-stroke-color": "#fff"
    }
  };

  if (!isMounted) {
    return (
      <div className="w-full h-[400px] bg-muted/20 rounded-xl flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-[400px] bg-muted/20 rounded-xl flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="h-10 w-10 text-amber-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Mapbox Token Missing</h3>
        <p className="text-muted-foreground max-w-md mb-4">
          To view the interactive customer map, please add your Mapbox public token to your environment variables.
        </p>
        <code className="bg-muted px-3 py-1 rounded text-sm font-mono">
          NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ...
        </code>
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] rounded-xl overflow-hidden relative border shadow-sm group">
      <style>{`
        .mapboxgl-ctrl-logo {
          display: none !important;
        }
      `}</style>
      <Map
        ref={mapRef}
        attributionControl={false}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle={mapStyle}
        mapboxAccessToken={MAPBOX_TOKEN}
        interactiveLayerIds={[clusterLayer.id, unclusteredPointLayer.id]}
        onMouseEnter={(event) => {
          const feature = event.features?.[0];
          if (feature) {
            // @ts-ignore
            setHoverInfo({
              longitude: event.lngLat.lng,
              latitude: event.lngLat.lat,
              feature
            });
          }
        }}
        onMouseLeave={() => setHoverInfo(null)}
        onClick={(event) => {
          const feature = event.features?.[0];
          const clusterId = feature?.properties?.cluster_id;

          if (clusterId && mapRef.current) {
            const mapboxSource = mapRef.current.getMap().getSource('customers') as mapboxgl.GeoJSONSource;

            mapboxSource.getClusterExpansionZoom(clusterId, (err, zoom) => {
              if (err) return;

              mapRef.current?.easeTo({
                center: (feature.geometry as any).coordinates,
                zoom,
                duration: 500
              });
            });
          }
        }}
      >
        <Source
          id="customers"
          type="geojson"
          data={mapData}
          cluster={true}
          clusterMaxZoom={14}
          clusterRadius={50}
        >
          <Layer {...clusterLayer} />
          <Layer {...clusterCountLayer} />
          <Layer {...unclusteredPointLayer} />
        </Source>

        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />
        <ScaleControl />
        <GeolocateControl position="top-right" />

        {hoverInfo && (
          <Popup
            longitude={hoverInfo.longitude}
            latitude={hoverInfo.latitude}
            offset={[0, -10] as [number, number]}
            closeButton={false}
            className="z-50"
          >
            <div className="p-3 min-w-[150px]">
              {hoverInfo.feature.properties.cluster ? (
                <div className="font-bold text-sm">
                  Cluster of {hoverInfo.feature.properties.point_count} Customers
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="font-bold text-sm border-b pb-1 mb-1">
                    {hoverInfo.feature.properties.customerName}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {hoverInfo.feature.properties.location}, {hoverInfo.feature.properties.state}
                  </div>
                </div>
              )}
            </div>
          </Popup>
        )}
      </Map>

      {/* Style Toggle */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-1 rounded-lg shadow-sm border flex gap-1">
        <Button
          variant={mapStyle.includes('light') ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 text-xs"
          onClick={() => setMapStyle("mapbox://styles/mapbox/light-v11")}
        >
          Light
        </Button>
        <Button
          variant={mapStyle.includes('dark') ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 text-xs"
          onClick={() => setMapStyle("mapbox://styles/mapbox/dark-v11")}
        >
          Dark
        </Button>
        <Button
          variant={mapStyle.includes('satellite') ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 text-xs"
          onClick={() => setMapStyle("mapbox://styles/mapbox/satellite-streets-v12")}
        >
          Satellite
        </Button>
      </div>

      {/* Legend / Info */}
      <div className="absolute bottom-8 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-sm border max-w-[200px]">
        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
          <Layers className="h-4 w-4" /> Demographics
        </h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#51bbd6]" />
            <span>Low Density (&lt;50)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#f1f075]" />
            <span>Medium Density (50-100)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#f28cb1]" />
            <span>High Density (&gt;100)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
