import React, { useState } from "react";
import { ArrowLeft, Check, Calendar, ArrowRight } from "lucide-react";
import { Stylist } from "../types";
import { STYLISTS } from "../data";

interface StylistSelectScreenProps {
  selectedStylist: Stylist | null;
  stepText: string;
  onSelect: (stylist: Stylist) => void;
  onBack: () => void;
}

export default function StylistSelectScreen({
  selectedStylist,
  stepText,
  onSelect,
  onBack,
}: StylistSelectScreenProps) {
  // If nothing selected, select the first option (First Available) by default, or keep null
  const [activeStylist, setActiveStylist] = useState<Stylist | null>(
    selectedStylist || STYLISTS[0]
  );

  const handleSelectStylist = (sty: Stylist) => {
    setActiveStylist(sty);
  };

  const handleContinue = () => {
    if (activeStylist) {
      onSelect(activeStylist);
    }
  };

  return (
    <div className="bg-[#faf8f6] min-h-screen flex flex-col justify-between text-[#1c1a19]">
      {/* Container constrained for mobile scale */}
      <div className="w-full max-w-[480px] bg-white min-h-screen flex flex-col mx-auto shadow-xl relative overflow-hidden">
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
            Choose Your Stylist
          </h2>
          <p className="text-xs text-[#5c5a59]">
            Select a professional to refine your look.
          </p>
        </div>

        {/* List of Stylists */}
        <main className="flex-1 px-4 py-4 overflow-y-auto pb-24">
          <div className="grid grid-cols-2 gap-2.5">
            {/* Find and render First Available at the top spanning 2 columns */}
            {STYLISTS.filter((sty) => sty.id === "first_available").map((sty) => {
              const isSelected = activeStylist?.id === sty.id;
              return (
                <div
                  key={sty.id}
                  onClick={() => handleSelectStylist(sty)}
                  className={`col-span-2 flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer ${
                    isSelected
                      ? "border-[#80140b] bg-[#fdfaf9] shadow-xs"
                      : "border-[#efe8e6] hover:border-gray-200 bg-[#faf8f6]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-11 h-11 rounded-full bg-[#ffdad5] text-[#80140b] flex items-center justify-center">
                        <Calendar className="w-5 h-5" />
                      </div>
                      {isSelected && (
                        <div className="absolute -bottom-1 -right-1 bg-[#80140b] text-white rounded-full p-0.5">
                          <Check className="w-3 h-3 font-bold" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#1c1a19]">{sty.name}</h3>
                      <p className="text-xs text-[#5c5a59] mt-0.5">{sty.role}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="text-[#80140b]">
                      <Check className="w-4 h-4 inline animate-bounce" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Render the other stylists in 2-column grid */}
            {STYLISTS.filter((sty) => sty.id !== "first_available").map((sty) => {
              const isSelected = activeStylist?.id === sty.id;
              return (
                <div
                  key={sty.id}
                  onClick={() => handleSelectStylist(sty)}
                  className={`flex flex-col items-center text-center p-3.5 rounded-xl border-2 transition-all cursor-pointer relative ${
                    isSelected
                      ? "border-[#80140b] bg-[#fdfaf9] shadow-xs"
                      : "border-[#efe8e6] hover:border-gray-200 bg-[#faf8f6]"
                  }`}
                >
                  {/* Select check badge at top-right */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-[#80140b] text-white rounded-full p-0.5 z-10">
                      <Check className="w-3 h-3 font-bold" />
                    </div>
                  )}
                  
                  <img
                    src={sty.avatarUrl}
                    alt={sty.name}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-full object-cover border border-[#efe8e6] shadow-xs mb-2"
                  />
                  <div>
                    <h3 className="font-bold text-xs text-[#1c1a19] truncate max-w-[120px]">
                      {sty.name}
                    </h3>
                    <p className="text-[10px] text-[#5c5a59] mt-0.5 truncate max-w-[120px]">
                      {sty.role}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {/* Bottom Booking Button - Sticky */}
        <footer className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-[#efe8e6] shadow-[0_-4px_12px_rgba(0,0,0,0.03)] z-10">
          <button
            onClick={handleContinue}
            disabled={!activeStylist}
            className={`w-full text-white py-3.5 px-6 rounded-lg font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all ${
              activeStylist ? "bg-[#80140b] hover:bg-[#680f08] shadow-md" : "bg-gray-300 cursor-not-allowed"
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
