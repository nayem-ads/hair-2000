import React, { useState } from "react";
import { ArrowLeft, X, Check, ArrowRight } from "lucide-react";
import { Service } from "../types";
import { SERVICES } from "../data";

interface ServiceSelectScreenProps {
  selectedService: Service | null;
  stepText: string;
  onSelect: (service: Service) => void;
  onBack: () => void;
  onClose: () => void;
}

export default function ServiceSelectScreen({
  selectedService,
  stepText,
  onSelect,
  onBack,
  onClose,
}: ServiceSelectScreenProps) {
  const [activeService, setActiveService] = useState<Service | null>(
    selectedService || SERVICES[0]
  );

  const handleSelectService = (srv: Service) => {
    setActiveService(srv);
  };

  const handleContinue = () => {
    if (activeService) {
      onSelect(activeService);
    }
  };

  return (
    <div className="bg-[#faf8f6] min-h-dvh flex justify-center items-center text-[#1c1a19] font-sans">
      {/* Container constrained for mobile scale */}
      <div className="w-full max-w-[480px] bg-white h-dvh flex flex-col shadow-xl relative overflow-hidden">
        {/* Top Header */}
        <header className="flex justify-between items-center px-4 py-3.5 border-b border-[#efe8e6] bg-white">
          <button
            onClick={onBack}
            className="text-[#5c5a59] hover:bg-gray-50 transition-colors rounded-full p-2"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center flex-1">
            <h1 className="font-extrabold tracking-[0.15em] text-[#80140b] uppercase text-xs">
              Hair 2000
            </h1>
          </div>
          <span className="text-xs font-bold text-[#5c5a59] px-2">{stepText}</span>
        </header>

        {/* Main Header Guide */}
        <div className="text-center pt-5 pb-3 bg-white border-b border-[#efe8e6]">
          <h2 className="text-lg font-bold tracking-tight text-[#1c1a19] font-serif">
            Select Service
          </h2>
          <p className="text-xs text-[#5c5a59]">
            Choose a service for your appointment.
          </p>
        </div>

        {/* List of Services */}
        <main className="flex-1 px-4 py-4 overflow-y-auto pb-24 space-y-3">
          {SERVICES.map((srv) => {
            const isSelected = activeService?.id === srv.id;
            return (
              <div
                key={srv.id}
                onClick={() => handleSelectService(srv)}
                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  isSelected
                    ? "border-[#80140b] bg-[#fdfaf9] shadow-xs"
                    : "border-[#efe8e6] hover:border-gray-200 bg-[#faf8f6]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                        isSelected
                          ? "border-[#80140b] bg-[#80140b] text-white"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-sm text-[#1c1a19]">{srv.name}</h3>
                    <p className="text-[11px] text-[#7d7977]">{srv.duration} mins</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-sm text-[#80140b]">
                    ${srv.price}
                    {srv.isStartingPrice && "+"}
                  </span>
                </div>
              </div>
            );
          })}
        </main>

        {/* Bottom Booking Button - Sticky */}
        <footer className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-[#efe8e6] shadow-[0_-4px_12px_rgba(0,0,0,0.03)] z-10">
          <button
            onClick={handleContinue}
            disabled={!activeService}
            className={`w-full text-white py-3.5 px-6 rounded-lg font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all ${
              activeService
                ? "bg-[#80140b] hover:bg-[#680f08] shadow-md"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </footer>
      </div>
    </div>
  );
}
