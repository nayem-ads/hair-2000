import React from "react";
import { Service } from "../types";
import { SERVICES } from "../data";
import { Scissors, Star, Flame, Award, Gift, Coffee, GlassWater, Trophy, ChevronRight, CalendarCheck, Phone, Calendar } from "lucide-react";

interface LandingScreenProps {
  onStartBooking: (initialService?: Service) => void;
  onViewBookings: () => void;
  bookingCount: number;
}

export default function LandingScreen({ onStartBooking, onViewBookings, bookingCount }: LandingScreenProps) {
  return (
    <div className="bg-[#faf8f6] min-h-screen pb-24 text-[#1c1a19] font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#efe8e6] py-3.5 shadow-xs">
        <div className="max-w-[480px] mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#80140b]">
            <Scissors className="w-4.5 h-4.5 animate-pulse" />
            <span className="font-black tracking-[0.15em] text-lg uppercase font-sans">
              HAIR 2000
            </span>
          </div>
          {bookingCount > 0 && (
            <button
              onClick={onViewBookings}
              className="flex items-center gap-1 bg-[#ffdad5] text-[#80140b] px-3 py-1.5 rounded-full text-xs font-bold hover:bg-[#ffe5e1] transition-colors"
            >
              <CalendarCheck className="w-4 h-4" />
              My Bookings ({bookingCount})
            </button>
          )}
        </div>
      </header>

      {/* Main Container constrained to mobile preview width */}
      <div className="max-w-[480px] mx-auto px-4 pt-5 space-y-6">
        {/* Hero Section */}
        <section className="space-y-4 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-[#f4ecea] text-[#80140b] px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase">
            <span>🏆</span> 35+ Years of cutting great hair
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-[#1c1a19] leading-tight font-serif">
            Look Sharp. <br />Book in 60 Seconds.
          </h2>
          <p className="text-[#5c5a59] text-sm leading-relaxed font-normal">
            Premium cuts from $32. Includes a free styling product with your first visit to our luxury salon retreat.
          </p>
          <button
            onClick={() => onStartBooking()}
            id="hero-book-btn"
            className="w-full bg-[#80140b] text-white py-4 rounded-full font-bold hover:bg-[#680f08] transition-all flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(128,20,11,0.25)] hover:shadow-[0_6px_20px_rgba(128,20,11,0.35)] transform hover:-translate-y-0.5 active:translate-y-0 text-sm tracking-wider uppercase"
          >
            Book My Appointment
            <ChevronRight className="w-4 h-4" />
          </button>
          <p className="text-xs text-[#5c5a59] text-center font-medium">No credit card required to book.</p>
        </section>

        {/* Social Proof Strip */}
        <section className="bg-white border border-[#efe8e6] rounded-2xl py-3 px-2 text-center text-xs text-[#5c5a59] flex justify-around divide-x divide-[#efe8e6] shadow-xs">
          <div className="flex-1 flex flex-col items-center justify-center gap-0.5">
            <span className="font-extrabold text-[#1c1a19] flex items-center gap-1 text-sm">
              <Star className="w-3.5 h-3.5 text-[#EAB308] fill-current" /> 4.9
            </span>
            <span className="text-[9px] tracking-wider uppercase font-bold text-[#7d7977]">500+ Reviews</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center gap-0.5">
            <span className="font-extrabold text-[#1c1a19] text-sm">Est. 1991</span>
            <span className="text-[9px] tracking-wider uppercase font-bold text-[#7d7977]">Est. 35 Years</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center gap-0.5">
            <span className="font-extrabold text-[#1c1a19] text-sm">Same-Day</span>
            <span className="text-[9px] tracking-wider uppercase font-bold text-[#7d7977]">Slots Available</span>
          </div>
        </section>

        {/* Premium Benefits Box (Moved here to outlined area, converted to compact 2x2) */}
        <section className="border-[3px] border-[#80140b] bg-white rounded-2xl p-4 shadow-sm space-y-3.5">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-[#ffdad5] rounded-lg text-[#80140b] shrink-0">
                <Gift className="w-4 h-4" />
              </div>
              <span className="font-bold text-[#1c1a19] text-xs">Free Hair Product</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-[#ffdad5] rounded-lg text-[#80140b] shrink-0">
                <Coffee className="w-4 h-4" />
              </div>
              <span className="font-bold text-[#1c1a19] text-xs">Free Premium Coffee</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-[#ffdad5] rounded-lg text-[#80140b] shrink-0">
                <GlassWater className="w-4 h-4" />
              </div>
              <span className="font-bold text-[#1c1a19] text-xs">Free Champagne</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-[#ffdad5] rounded-lg text-[#80140b] shrink-0">
                <Flame className="w-4 h-4" />
              </div>
              <span className="font-bold text-[#1c1a19] text-xs">Free Chocolate</span>
            </div>
          </div>

          <div className="border-t border-[#efe8e6] pt-2.5 text-center">
            <p className="text-[9px] font-extrabold tracking-wider text-[#80140b] uppercase">
              WE ONLY OPEN 30 MVP SPOTS EACH MONTH TO KEEP WAIT TIMES LOW.
            </p>
          </div>
        </section>

        {/* Our Services List */}
        <section className="space-y-3">
          <h3 className="text-lg font-bold tracking-tight text-[#1c1a19] border-b border-[#efe8e6] pb-2 font-serif">
            Our Services
          </h3>
          <div className="divide-y divide-[#efe8e6]">
            {SERVICES.map((srv) => (
              <div
                key={srv.id}
                onClick={() => onStartBooking(srv)}
                className="flex items-center justify-between py-3 group cursor-pointer hover:bg-[#faf8f6] px-2 rounded-xl transition-all"
              >
                <div className="space-y-0.5">
                  <h4 className="font-bold text-sm text-[#1c1a19] group-hover:text-[#80140b] transition-colors">
                    {srv.name}
                  </h4>
                  <p className="text-[11px] text-[#7d7977]">{srv.duration} mins</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-[#80140b]">
                    ${srv.price}
                    {srv.isStartingPrice && "+"}
                  </span>
                  <div className="w-7 h-7 bg-[#ffdad5] group-hover:bg-[#80140b] text-[#80140b] group-hover:text-white rounded-full flex items-center justify-center transition-all shadow-xs">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Big Booking Footer Section */}
        <section className="bg-[#80140b] text-white rounded-2xl p-6 text-center space-y-4 shadow-lg">
          <h3 className="text-xl font-bold font-serif tracking-wide">Ready to Book?</h3>
          <p className="text-xs opacity-90 max-w-[280px] mx-auto leading-relaxed">Secure your spot in seconds. Our master barbers are ready for you.</p>
          <button
            onClick={() => onStartBooking()}
            className="w-full bg-white text-[#80140b] font-bold py-3.5 rounded-full hover:bg-opacity-95 transition-opacity flex items-center justify-center gap-2 shadow-md uppercase tracking-wider text-xs"
          >
            Book Now — $32+
            <ChevronRight className="w-4 h-4" />
          </button>
        </section>

        {/* Footer info */}
        <footer className="pt-2 text-center text-[#7d7977] space-y-1">
          <div className="flex items-center justify-center gap-1.5">
            <Scissors className="w-3.5 h-3.5 opacity-60" />
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase">HAIR 2000 • EST. 1991</span>
          </div>
          <p className="text-[9px] opacity-75">All appointments include our dynamic hospitality treatments.</p>
        </footer>
      </div>

      {/* Sticky Bottom booking trigger bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#efe8e6] py-3.5 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div className="max-w-[480px] mx-auto px-4 grid grid-cols-2 gap-3">
          <a
            href="tel:+15550002000"
            className="flex items-center justify-center gap-2 border-2 border-[#80140b] text-[#80140b] hover:bg-[#ffdad5]/20 h-12 rounded-full font-bold transition-all text-xs tracking-wider uppercase active:scale-[0.98]"
          >
            <Phone className="w-4 h-4" />
            <span>Call Now</span>
          </a>
          <button
            onClick={() => onStartBooking()}
            className="flex items-center justify-center gap-2 bg-[#80140b] text-white hover:bg-[#680f08] h-12 rounded-full font-bold transition-all text-xs tracking-wider uppercase active:scale-[0.98] shadow-md border-2 border-[#80140b]"
          >
            <Calendar className="w-4 h-4" />
            <span>Book Now</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
