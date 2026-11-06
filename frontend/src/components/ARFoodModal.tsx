import React, { useEffect, useRef, useState } from 'react';
import '@google/model-viewer';

// Extend React's JSX namespace
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }
}

interface ARFoodModalProps {
  foodName: string;
  foodPrice: number;
  foodImage: string;
  tableNumber?: string;
  modelGlb?: string;
  modelUsdz?: string;
  onClose: () => void;
  onAddToCart?: () => void;
}

export const ARFoodModal: React.FC<ARFoodModalProps> = ({
  foodName,
  foodPrice,
  foodImage,
  tableNumber,
  modelGlb,
  modelUsdz,
  onClose,
  onAddToCart,
}) => {
  const modelViewerRef = useRef<any>(null);
  const [loadingModel, setLoadingModel] = useState<boolean>(true);

  // Fallback high-fidelity sample realistic 3D food models if item has none
  const defaultModel =
    modelGlb ||
    'https://modelviewer.dev/shared-assets/models/glTF-Sample-Assets/Models/Burger/glTF-Binary/Burger.glb';

  useEffect(() => {
    const el = modelViewerRef.current;
    if (el) {
      const handleLoad = () => setLoadingModel(false);
      el.addEventListener('load', handleLoad);
      return () => {
        el.removeEventListener('load', handleLoad);
      };
    }
  }, []);

  const triggerAR = () => {
    if (modelViewerRef.current && typeof modelViewerRef.current.activateAR === 'function') {
      modelViewerRef.current.activateAR();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 text-xl">
              👓
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-extrabold text-base sm:text-lg">{foodName}</h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full">
                  AR 3D Reality
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {tableNumber ? `Showing for Table ${tableNumber}` : 'Place on your table in 3D'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 3D / AR Viewport Container */}
        <div className="relative flex-1 min-h-[340px] sm:min-h-[420px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center overflow-hidden">
          {loadingModel && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 z-10 gap-3">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-semibold text-slate-400">Loading 3D Food Hologram...</p>
            </div>
          )}

          {/* Web Component: <model-viewer> */}
          <model-viewer
            ref={modelViewerRef}
            src={defaultModel}
            ios-src={modelUsdz}
            alt={`3D Augmented Reality Model of ${foodName}`}
            ar
            ar-modes="webxr scene-viewer quick-look"
            ar-scale="auto"
            ar-placement="floor"
            camera-controls
            auto-rotate
            shadow-intensity="1.5"
            exposure="1.2"
            poster={foodImage}
            style={{ width: '100%', height: '100%', minHeight: '340px' }}
          >
            {/* AR Button slotted inside model-viewer */}
            <button
              slot="ar-button"
              className="absolute top-4 right-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black px-4 py-2 rounded-2xl text-xs uppercase tracking-wider shadow-xl shadow-orange-500/30 flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
            >
              <span>📱</span> View on My Table (AR)
            </button>
          </model-viewer>

          {/* Table Placement Indicator Hint */}
          <div className="absolute bottom-4 left-4 right-4 pointer-events-none flex justify-center">
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800/80 rounded-2xl px-4 py-2 text-center text-xs text-slate-300 shadow-xl flex items-center gap-2">
              <span className="text-base">👆</span>
              <span>Drag to rotate 360° • Pinch to zoom • Tap <strong>View on My Table</strong> for camera AR</span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Controls */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Real Portion Size</p>
            <p className="text-2xl font-black text-amber-400">
              ETB {Number(foodPrice).toFixed(2)}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={triggerAR}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black px-5 py-3 rounded-2xl text-sm transition-all shadow-lg shadow-orange-500/20 active:scale-95"
            >
              <span>✨</span> Show On My Table (AR)
            </button>
            {onAddToCart && (
              <button
                onClick={() => {
                  onAddToCart();
                  onClose();
                }}
                className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-700 text-white font-bold px-5 py-3 rounded-2xl text-sm transition-all border border-slate-700"
              >
                + Order This Food
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
