import React from "react";
import { CheckCircle2, Scissors, Calendar, Clock, User, Sparkles, Receipt, Trash2 } from "lucide-react";
import { Service, Stylist } from "../types";

export interface HistoricBooking {
  id: string;
  serviceName: string;
  servicePrice: number;
  stylistName: string;
  stylistRole: string;
  dateStr: string;
  timeSlot: string;
  customerName: string;
  customerPhone: string;
  leadSource: string;
  createdAt: string;
}

interface ConfirmationScreenProps {
  currentBooking: {
    service: Service;
    stylist: Stylist;
    date: Date;
    timeSlot: string;
    customerName: string;
    customerPhone: string;
  } | null;
  historyCheckouts: HistoricBooking[];
  onBackToMenu: () => void;
  onCancelBooking: (id: string) => void;
}

export default function ConfirmationScreen({
  currentBooking,
  historyCheckouts,
  onBackToMenu,
  onCancelBooking,
}: ConfirmationScreenProps) {
  // Format Date gracefully: e.g. "Wednesday, June 3rd, 2026"
  const formatDate = (dateObj: Date | string) => {
    const d = typeof dateObj === "string" ? new Date(dateObj) : dateObj;
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="bg-[#faf8f6] min-h-screen flex flex-col justify-between text-[#1c1a19] pb-12 font-sans">
      <div className="w-full max-w-[480px] bg-white min-h-screen flex flex-col mx-auto shadow-xl relative overflow-hidden">
        {/* Header */}
        <header className="flex justify-between items-center px-4 py-3.5 border-b border-[#efe8e6] bg-white">
          <div className="flex items-center gap-2 text-[#80140b] mx-auto">
            <Scissors className="w-4 h-4 animate-spin-slow" />
            <h1 className="font-sans text-xs font-black tracking-[0.15em] uppercase">
              HAIR 2000 salon
            </h1>
          </div>
        </header>

        {/* Scrollable Contents */}
        <main className="flex-1 px-6 py-6 space-y-6 overflow-y-auto pb-10">
          {/* Main Booking Success Status */}
          {currentBooking && (
            <div className="text-center space-y-3 animate-fade-in">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full">
                <CheckCircle2 className="w-8 h-8 fill-current text-white stroke-2 stroke-emerald-600" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 font-serif">
                  Booking Confirmed!
                </h2>
                <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Premium Treatment Reserved
                </p>
              </div>
            </div>
          )}

          {/* Conversion Tracking Tag Information */}
          {currentBooking && (
            <div className="bg-[#fdfaf9] border border-[#ffdad5] rounded-xl p-3.5 text-center space-y-1 animate-pulse shadow-xs">
              <p className="text-[10px] font-extrabold text-[#80140b] tracking-widest uppercase">
                Conversion Tracking Enabled
              </p>
              <p className="text-[9px] text-[#5c5a59] font-medium">
                Google Tag Manager & Custom Webhook dispatches are active for conversion optimization.
              </p>
            </div>
          )}

          {/* Golden Ticket / Receipt Stub Card */}
          {currentBooking && (
            <div className="bg-[#faf8f6] border-2 border-dashed border-[#efe8e6] rounded-2xl overflow-hidden shadow-xs relative">
              {/* Header section */}
              <div className="bg-[#80140b] text-white p-4 flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase tracking-wider opacity-90">Booking Ticket Code</span>
                  <p className="text-sm font-mono font-bold">H2K-{Math.floor(Math.random() * 90000 + 10000)}</p>
                </div>
                <Receipt className="w-5 h-5 opacity-90" />
              </div>

              {/* Information body */}
              <div className="p-5 space-y-4">
                {/* Guest Details */}
                <div className="text-xs border-b border-[#efe8e6] pb-3 flex justify-between items-center">
                  <span className="text-gray-400 uppercase tracking-widest font-bold">Guest</span>
                  <span className="font-extrabold text-[#1c1a19]">{currentBooking.customerName}</span>
                </div>

                {/* Service Block */}
                <div className="flex justify-between items-start gap-4 py-1">
                  <div>
                    <h4 className="font-bold text-sm text-[#1c1a19]">{currentBooking.service.name}</h4>
                    <span className="text-[10px] text-gray-400 font-semibold">
                      Treatment Duration • {currentBooking.service.duration} mins
                    </span>
                  </div>
                  <span className="font-extrabold text-sm text-[#80140b]">
                    ${currentBooking.service.price}
                  </span>
                </div>

                {/* Date & Time Segment */}
                <div className="bg-white p-3 rounded-lg border border-[#efe8e6] flex flex-col gap-2 shadow-xs">
                  <div className="flex items-center gap-2.5 text-xs">
                    <Calendar className="w-4 h-4 text-[#80140b]" />
                    <span className="font-bold text-[#1c1a19]">{formatDate(currentBooking.date)}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs">
                    <Clock className="w-4 h-4 text-[#80140b]" />
                    <span className="font-bold text-[#1c1a19]">{currentBooking.timeSlot} sharp</span>
                  </div>
                </div>

                {/* Stylist block */}
                <div className="flex items-center gap-3 pt-2 text-xs border-t border-[#efe8e6]">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500 font-medium">Reserved Stylist:</span>
                  <span className="font-bold text-[#1c1a19] ml-auto">
                    {currentBooking.stylist.name}
                  </span>
                </div>
              </div>

              {/* Bottom coupon label */}
              <div className="bg-[#ffdad5]/30 py-2.5 px-4 text-center text-[10px] text-[#80140b] font-bold border-t border-[#efe8e6]">
                🎁 Free Styling Treatment + Beverage selection active
              </div>
            </div>
          )}

          {/* Bookings Vault / History Section */}
          {historyCheckouts.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#5c5a59] border-b border-[#efe8e6] pb-2 flex items-center gap-1.5">
                <span>📚</span> Appointment Vault ({historyCheckouts.length})
              </h3>

              <div className="space-y-2.5">
                {historyCheckouts.map((hist) => (
                  <div
                    key={hist.id}
                    className="p-3.5 bg-[#faf8f6] border border-[#efe8e6] rounded-xl flex justify-between items-center text-xs group hover:shadow-xs transition"
                  >
                    <div className="space-y-1 relative pr-10">
                      <div className="flex items-center gap-1.5 font-bold text-[#1c1a19]">
                        <span>{hist.serviceName}</span>
                        <span className="text-[#efe8e6] font-normal">|</span>
                        <span className="text-[#80140b]">${hist.servicePrice}</span>
                      </div>
                      <div className="text-[10px] text-[#5c5a59] font-semibold">
                        Stylist: <strong>{hist.stylistName}</strong>
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {hist.dateStr} @ <strong>{hist.timeSlot}</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => onCancelBooking(hist.id)}
                      className="text-gray-400 hover:text-[#80140b] hover:bg-[#ffdad5]/30 p-2.5 rounded-full transition-all"
                      title="Cancel Reservation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action to head back to primary catalogs */}
          <div className="pt-2">
            <button
              onClick={onBackToMenu}
              className="w-full bg-[#1c1a19] hover:bg-[#80140b] py-3.5 px-6 rounded-lg text-white font-bold text-xs tracking-widest uppercase text-center transition-all shadow-md"
            >
              Back to Hair Salon Home
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
