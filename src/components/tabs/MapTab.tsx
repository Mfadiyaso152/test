import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Crosshair, 
  MapPin, 
  Navigation, 
  Building2, 
  Star, 
  Layers,
  ZoomIn,
  ZoomOut,
  Phone,
  X
} from 'lucide-react';
import { ServiceCategory, UserProfile } from '../../types';

declare global {
  interface Window {
    google: any;
    initGoogleMapsCallback?: () => void;
  }
}

interface MapTabProps {
  categories: ServiceCategory[];
  providers?: UserProfile[];
  onOpenBookingWithLocation: (locationName: string, lat: number, lng: number) => void;
  userAddress: string;
}

interface ProviderMarkerData {
  id: string;
  name: string;
  specialty: string;
  category: string;
  lat: number;
  lng: number;
  rating: number;
  completedJobs: number;
  phone: string;
  distanceKm: string;
  crVerified: boolean;
}

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDmi3vGIPrAMEWCc1QnOetw38ISz2WvZyw';

export function MapTab({
  categories,
  providers = [],
  onOpenBookingWithLocation,
  userAddress,
}: MapTabProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const userAccuracyCircleRef = useRef<any>(null);
  const providerMarkersRef = useRef<any[]>([]);
  const geocoderRef = useRef<any>(null);

  // Derive real provider markers only from verified registered providers
  const realProvidersOnMap: ProviderMarkerData[] = useMemo(() => {
    return (providers || [])
      .filter((p) => p.role === 'provider' && p.providerDetails?.lat && p.providerDetails?.lng && p.providerDetails?.verificationStatus !== 'rejected')
      .map((p) => ({
        id: p.id,
        name: p.providerDetails?.businessName || p.name,
        specialty: p.providerDetails?.specialty || 'خدمات صيانة معتمدة',
        category: p.providerDetails?.specialty || 'عام',
        lat: p.providerDetails!.lat,
        lng: p.providerDetails!.lng,
        rating: p.rating || 5.0,
        completedJobs: p.completedOrdersCount || 0,
        phone: p.phone,
        distanceKm: '',
        crVerified: p.providerDetails?.crVerified ?? true,
      }));
  }, [providers]);

  // States
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number }>({
    lat: 24.774265,
    lng: 46.638573,
  });
  const [addressLabel, setAddressLabel] = useState<string>(userAddress || 'حي الصحافة، الرياض');
  const [isLocating, setIsLocating] = useState(false);
  const [geoStatusMsg, setGeoStatusMsg] = useState<string | null>(null);
  const [activeProviderModal, setActiveProviderModal] = useState<ProviderMarkerData | null>(null);
  const [isSatellite, setIsSatellite] = useState(false);

  // Reverse geocoding helper
  const reverseGeocode = useCallback((lat: number, lng: number) => {
    if (!geocoderRef.current && window.google?.maps?.Geocoder) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }
    if (geocoderRef.current) {
      geocoderRef.current.geocode({ location: { lat, lng } }, (results: any, status: any) => {
        if (status === 'OK' && results && results[0]) {
          setAddressLabel(results[0].formatted_address);
        }
      });
    }
  }, []);

  // Center on user position with high accuracy
  const locateUser = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoStatusMsg('خدمة تحديد الموقع غير مدعومة في جهازك.');
      setTimeout(() => setGeoStatusMsg(null), 3500);
      return;
    }

    setIsLocating(true);
    setGeoStatusMsg('جاري تحديد موقعك الفعلي بدقة...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const newCoords = { lat: latitude, lng: longitude };
        setSelectedCoords(newCoords);
        setIsLocating(false);
        setGeoStatusMsg('تم تحديد موقعك بدقة 📍');
        setTimeout(() => setGeoStatusMsg(null), 3000);

        if (mapInstanceRef.current && window.google?.maps) {
          mapInstanceRef.current.panTo(newCoords);
          mapInstanceRef.current.setZoom(16);

          // Update user location marker
          if (userMarkerRef.current) {
            userMarkerRef.current.setPosition(newCoords);
          } else {
            userMarkerRef.current = new window.google.maps.Marker({
              position: newCoords,
              map: mapInstanceRef.current,
              title: 'موقعك الحالي',
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 9,
                fillColor: '#FF6B53',
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 3,
              },
            });
          }

          // Accuracy Circle
          if (userAccuracyCircleRef.current) {
            userAccuracyCircleRef.current.setCenter(newCoords);
            userAccuracyCircleRef.current.setRadius(Math.min(accuracy || 50, 150));
          } else {
            userAccuracyCircleRef.current = new window.google.maps.Circle({
              map: mapInstanceRef.current,
              center: newCoords,
              radius: Math.min(accuracy || 50, 150),
              fillColor: '#FF6B53',
              fillOpacity: 0.15,
              strokeColor: '#FF6B53',
              strokeOpacity: 0.4,
              strokeWeight: 1,
            });
          }
        }

        reverseGeocode(latitude, longitude);
      },
      (error) => {
        setIsLocating(false);
        let msg = 'تعذر الحصول على إذن الموقع.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'يرجى تفعيل إذن الوصول للموقع من إعدادات المتصفح / الجهاز.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'إشارة الـ GPS غير متوفرة حالياً.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'استغرق تحديد الموقع وقتاً أطول من المتوقع.';
        }
        setGeoStatusMsg(msg);
        setTimeout(() => setGeoStatusMsg(null), 4000);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [reverseGeocode]);

  // Load Google Maps Script & Initialize
  useEffect(() => {
    let isMounted = true;

    const initializeMap = () => {
      if (!isMounted || !mapContainerRef.current || !window.google?.maps) return;

      geocoderRef.current = new window.google.maps.Geocoder();

      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: selectedCoords,
        zoom: 14,
        disableDefaultUI: true,
        gestureHandling: 'greedy',
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'on' }],
          },
        ],
      });

      mapInstanceRef.current = map;

      // Add User Selected Pin
      userMarkerRef.current = new window.google.maps.Marker({
        position: selectedCoords,
        map: map,
        title: 'موقع الخدمة',
        animation: window.google.maps.Animation.DROP,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#FF6B53',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3.5,
        },
      });

      // Add Real Provider Markers
      realProvidersOnMap.forEach((prov) => {
        const provMarker = new window.google.maps.Marker({
          position: { lat: prov.lat, lng: prov.lng },
          map: map,
          title: prov.name,
          icon: {
            path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: '#2B1B3D',
            fillOpacity: 1,
            strokeColor: '#FF9EB4',
            strokeWeight: 2,
          },
        });

        provMarker.addListener('click', () => {
          setActiveProviderModal(prov);
        });

        providerMarkersRef.current.push(provMarker);
      });

      // Map Click Listener to select new location
      map.addListener('click', (e: any) => {
        if (!e.latLng) return;
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        const clickedCoords = { lat, lng };
        setSelectedCoords(clickedCoords);

        if (userMarkerRef.current) {
          userMarkerRef.current.setPosition(clickedCoords);
        }

        reverseGeocode(lat, lng);
      });

      // Locate user automatically once initialized
      locateUser();
    };

    if (window.google?.maps) {
      initializeMap();
    } else {
      // Inject Google Maps script tag if not yet loaded
      const existingScript = document.getElementById('google-maps-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry&language=ar`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          initializeMap();
        };
        script.onerror = () => {
          setGeoStatusMsg('تعذر تحميل خريطة قوقل ماب.');
        };
        document.head.appendChild(script);
      } else {
        existingScript.addEventListener('load', initializeMap);
      }
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Zoom controls
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      const cur = mapInstanceRef.current.getZoom() || 14;
      mapInstanceRef.current.setZoom(cur + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      const cur = mapInstanceRef.current.getZoom() || 14;
      mapInstanceRef.current.setZoom(cur - 1);
    }
  };

  const toggleMapLayer = () => {
    if (mapInstanceRef.current && window.google?.maps) {
      const nextSatellite = !isSatellite;
      setIsSatellite(nextSatellite);
      mapInstanceRef.current.setMapTypeId(nextSatellite ? 'satellite' : 'roadmap');
    }
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-[#FDFBF5] overflow-hidden select-none font-['Tajawal',sans-serif] z-0">
      {/* Real Google Maps Container - 100% full screen with zero margins/padding */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full absolute inset-0 z-0 bg-neutral-100"
      />

      {/* Floating Status / GPS Alert */}
      {geoStatusMsg && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-30 bg-[#2B1B3D]/95 text-white text-xs font-bold py-2.5 px-5 rounded-full shadow-2xl border border-[#FF9EB4]/40 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <Navigation size={15} className="text-[#FF6B53] animate-spin" />
          <span>{geoStatusMsg}</span>
        </div>
      )}

      {/* Right Floating Map Controls */}
      <div className="absolute right-4 top-6 z-20 flex flex-col gap-2.5">
        {/* Locate Me Button */}
        <button
          onClick={locateUser}
          disabled={isLocating}
          title="تحديد موقعي الفعلي"
          className="w-12 h-12 rounded-2xl bg-white/95 text-[#2B1B3D] hover:text-[#FF6B53] shadow-lg border border-[#2B1B3D]/10 flex items-center justify-center transition-all active:scale-95 cursor-pointer backdrop-blur-xs"
        >
          <Crosshair size={22} className={isLocating ? 'animate-spin text-[#FF6B53]' : ''} />
        </button>

        {/* Toggle Layers (Satellite / Map) */}
        <button
          onClick={toggleMapLayer}
          title="تبديل مظهر الخريطة (قمر صناعي / شوارع)"
          className="w-12 h-12 rounded-2xl bg-white/95 text-[#2B1B3D] hover:text-[#FF6B53] shadow-lg border border-[#2B1B3D]/10 flex items-center justify-center transition-all active:scale-95 cursor-pointer backdrop-blur-xs"
        >
          <Layers size={20} />
        </button>

        {/* Zoom Controls */}
        <div className="bg-white/95 rounded-2xl shadow-lg border border-[#2B1B3D]/10 flex flex-col overflow-hidden backdrop-blur-xs">
          <button
            onClick={handleZoomIn}
            title="تكبير"
            className="w-12 h-11 text-[#2B1B3D] hover:text-[#FF6B53] flex items-center justify-center border-b border-[#2B1B3D]/10 transition-colors cursor-pointer"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={handleZoomOut}
            title="تصغير"
            className="w-12 h-11 text-[#2B1B3D] hover:text-[#FF6B53] flex items-center justify-center transition-colors cursor-pointer"
          >
            <ZoomOut size={18} />
          </button>
        </div>
      </div>

      {/* Bottom Floating Action Card with selected location info */}
      <div className="absolute bottom-20 sm:bottom-6 left-4 right-4 max-w-lg mx-auto z-20">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-4 sm:p-5 shadow-2xl border border-[#2B1B3D]/10 space-y-3.5 text-right">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2B1B3D] to-[#3C2E4C] text-[#FF6B53] flex items-center justify-center shrink-0 shadow-md">
                <MapPin size={22} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#FF6B53] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  موقع الخدمة المختار (Google Maps)
                </span>
                <h3 className="text-xs sm:text-sm font-black text-[#2B1B3D] line-clamp-1 mt-0.5">
                  {addressLabel}
                </h3>
              </div>
            </div>

            <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-[#2B1B3D]/5 text-[#2B1B3D] shrink-0">
              {selectedCoords.lat.toFixed(4)}, {selectedCoords.lng.toFixed(4)}
            </span>
          </div>

          <p className="text-[11px] text-[#3C2E4C]/70">
            انقر على أي نقطة بالخريطة لتحديد عنوان زيارة الفني بدقة أو استكشف أقرب المنشآت المعتمدة.
          </p>
        </div>
      </div>

      {/* Provider Details Modal when clicking on marker */}
      {activeProviderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-4 text-right border border-[#2B1B3D]/10 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#2B1B3D] text-[#FF9EB4] flex items-center justify-center font-bold text-lg shadow-md">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#2B1B3D]">{activeProviderModal.name}</h3>
                  <p className="text-xs text-[#FF6B53] font-bold">{activeProviderModal.specialty}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveProviderModal(null)}
                className="w-8 h-8 rounded-full bg-[#2B1B3D]/5 hover:bg-[#2B1B3D]/10 flex items-center justify-center text-[#2B1B3D] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-[#FDFBF5] rounded-2xl border border-[#2B1B3D]/5">
                <span className="text-[#3C2E4C]/70 block text-[11px]">التقييم العام</span>
                <span className="font-black text-[#2B1B3D] flex items-center gap-1 mt-0.5 text-amber-600">
                  <Star size={13} fill="currentColor" />
                  {activeProviderModal.rating} ({activeProviderModal.completedJobs}+ خدمة)
                </span>
              </div>
              <div className="p-3 bg-[#FDFBF5] rounded-2xl border border-[#2B1B3D]/5">
                <span className="text-[#3C2E4C]/70 block text-[11px]">المسافة التقريبية</span>
                <span className="font-bold text-[#FF6B53] block mt-0.5">{activeProviderModal.distanceKm}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <a
                href={`tel:${activeProviderModal.phone}`}
                className="flex-1 py-3 rounded-2xl bg-[#2B1B3D] text-[#FF9EB4] text-xs font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Phone size={14} />
                <span>اتصال بالمزود</span>
              </a>
              <button
                onClick={() => {
                  onOpenBookingWithLocation(addressLabel, selectedCoords.lat, selectedCoords.lng);
                  setActiveProviderModal(null);
                }}
                className="flex-1 py-3 rounded-2xl brand-gradient-btn text-white text-xs font-black shadow-md cursor-pointer"
              >
                طلب الخدمة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
