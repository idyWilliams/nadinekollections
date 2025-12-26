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
import { Loader2, AlertTriangle, MapPin, Layers, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

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

  "anambra": { lat: 6.2209, lng: 6.9370 },
  "abia": { lat: 5.5322, lng: 7.5001 },
  "imo": { lat: 5.5720, lng: 7.0588 },
  "akwa ibom": { lat: 5.0082, lng: 7.8639 },
  "cross river": { lat: 5.8739, lng: 8.5969 },
  "ebonyi": { lat: 6.2649, lng: 8.0137 },
  "bayelsa": { lat: 4.7719, lng: 6.0699 },
  "kwara": { lat: 8.9669, lng: 4.3886 },
  "osun": { lat: 7.5629, lng: 4.5200 },
  "ondo": { lat: 7.2571, lng: 5.2058 },
  "ekiti": { lat: 7.7190, lng: 5.3110 },
  "niger": { lat: 9.9312, lng: 5.5968 },
  "kogi": { lat: 7.7333, lng: 6.7333 },
  "benue": { lat: 7.3373, lng: 8.7426 },
  "plateau": { lat: 9.2182, lng: 9.5179 },
  "nasarawa": { lat: 8.5403, lng: 7.7039 },
  "taraba": { lat: 7.9919, lng: 10.7714 },
  "adamawa": { lat: 9.3265, lng: 12.3984 },
  "gombe": { lat: 10.2904, lng: 11.1678 },
  "bauchi": { lat: 10.3158, lng: 9.8442 },
  "borno": { lat: 11.8333, lng: 13.1500 },
  "yobe": { lat: 12.2940, lng: 11.9663 },
  "jigawa": { lat: 12.2230, lng: 9.5619 },
  "katsina": { lat: 12.9908, lng: 7.6177 },
  "zamfara": { lat: 12.1704, lng: 6.2238 },
  "sokoto": { lat: 13.0627, lng: 5.2433 },
  "kebbi": { lat: 11.4969, lng: 4.1975 }
};

interface OrderMapProps {
  data?: { state: string; value: number }[];
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

export function OrderMap({ }: OrderMapProps) {
  const mapRef = useRef<MapRef>(null);
  const supabase = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState({
    latitude: 9.0820,
    longitude: 8.6753,
    zoom: 5
  });
  const [hoverInfo, setHoverInfo] = useState<{
    longitude: number;
    latitude: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    feature: any;
  } | null>(null);
  const [mapStyle, setMapStyle] = useState("mapbox://styles/mapbox/light-v11");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch real orders from database
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data: ordersData, error } = await supabase
          .from("orders")
          .select(`
            id,
            customer_name,
            shipping_address,
            total_amount,
            status,
            created_at
          `)
          .order("created_at", { ascending: false })
          .limit(500);

        if (error) throw error;
        setOrders(ordersData || []);
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [supabase]);

  // Generate GeoJSON data from real orders
  const mapData = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const features: any[] = [];

    orders.forEach((order) => {
      const address = order.shipping_address;
      if (!address || !address.state) return;

      const normalizedState = address.state.toLowerCase().replace(" state", "").trim();
      const center = STATE_COORDINATES[normalizedState];

      if (center) {
        // Add small random offset to prevent exact overlaps
        const offsetLat = (Math.random() - 0.5) * 0.05;
        const offsetLng = (Math.random() - 0.5) * 0.05;

        features.push({
          type: "Feature",
          properties: {
            id: order.id,
            customerName: order.customer_name || "Guest Customer",
            location: `${address.city || "Unknown"}, ${address.state}`,
            totalAmount: order.total_amount,
            status: order.status,
            createdAt: order.created_at,
            address: address.address || "",
          },
          geometry: {
            type: "Point",
            coordinates: [center.lng + offsetLng, center.lat + offsetLat]
          }
        });
      }
    });

    return {
      type: "FeatureCollection",
      features
    };
  }, [orders]);

  // Cluster layer configuration
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clusterLayer: any = {
    id: "clusters",
    type: "circle",
    source: "customers",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": [
        "step",
        ["get", "point_count"],
        "#51bbd6",
        50,
        "#f1f075",
        100,
        "#f28cb1"
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const unclusteredPointLayer: any = {
    id: "unclustered-point",
    type: "circle",
    source: "customers",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": "#11b4da",
      "circle-radius": 6,
      "circle-stroke-width": 2,
      "circle-stroke-color": "#fff"
    }
  };

  if (!isMounted || loading) {
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            <div className="p-3 min-w-[200px]">
              {hoverInfo.feature.properties.cluster ? (
                <div className="font-bold text-sm">
                  Cluster of {hoverInfo.feature.properties.point_count} Orders
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="font-bold text-sm border-b pb-1 mb-1">
                    {hoverInfo.feature.properties.customerName}
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {hoverInfo.feature.properties.location}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Package className="h-3 w-3" />
                      ₦{hoverInfo.feature.properties.totalAmount?.toLocaleString()}
                    </div>
                    <div className={`text-xs font-medium capitalize ${hoverInfo.feature.properties.status === 'delivered' ? 'text-green-600' :
                      hoverInfo.feature.properties.status === 'processing' ? 'text-blue-600' :
                        'text-amber-600'
                      }`}>
                      {hoverInfo.feature.properties.status}
                    </div>
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

      {/* Legend */}
      <div className="absolute bottom-8 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-sm border max-w-[200px]">
        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
          <Layers className="h-4 w-4" /> Customer Orders
        </h4>
        <div className="space-y-2 text-xs">
          <div className="font-medium">Total Orders: {orders.length}</div>
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
