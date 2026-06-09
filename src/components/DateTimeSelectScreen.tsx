import React, { useState } from "react";
import { ArrowLeft, X, Edit2, ChevronLeft, ChevronRight, Sun, Sunset, ArrowRight, User } from "lucide-react";
import { Service, Stylist } from "../types";

interface DateTimeSelectScreenProps {
  selectedService: Service | null;
  selectedStylist: Stylist | null;
  stepText: string;
  onConfirm: (date: Date, timeSlot: string) => void;
  onBack: () => void;
  onClose: () => void;
  onChangeStylist: () => void;
}

export default function DateTimeSelectScreen({
  selectedService,
  selectedStylist,
  stepText,
  onConfirm,
  onBack,
  onClose,
  onChangeStylist,
}: DateTimeSelectScreenProps) {
  // Current time is June 3, 2026
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(5); // June (0-indexed is 5)
  const [selectedDay, setSelectedDay] = useState(3); // Start with today, June 3rd
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slotsByDate, setSlotsByDate] = useState<Record<string, { slots: string[] }>>({});
  const [loading, setLoading] = useState(false);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysOfWeek = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
  const dotDays = [11, 15, 18];

  // Helper to generate days in current month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Helper to get first day of month index (0 for Sunday, 1 for Monday...)
  const getFirstDayIndex = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayIndex(currentYear, currentMonth);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDay(1); // Reset select to 1st of month
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDay(1); // Reset select to 1st of month
  };

  const handleDaySelect = (dayNum: number) => {
    setSelectedDay(dayNum);
    const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    const daySlots = slotsByDate[formattedDate]?.slots || [];
    if (daySlots.length > 0) {
      setSelectedTime(daySlots[0]);
    } else {
      setSelectedTime(null);
    }
  };

  const handleConfirm = () => {
    if (selectedTime) {
      const targetDate = new Date(currentYear, currentMonth, selectedDay);
      onConfirm(targetDate, selectedTime);
    }
  };

  // Fetch slots from GoHighLevel proxy endpoint
  React.useEffect(() => {
    if (!selectedService) return;

    // Map service to GHL calendarId
    const serviceToCalendarMap: Record<string, string> = {
      "mens-cut": "HdpJwaZsoHDAOG3fn3VV",
      "womens-cut": "f5ofJYfNovH7NH3AQOJF",
      "color": "AKGVsNGC8VME87ZAwwAH",
      "shampoo-haircut": "HdpJwaZsoHDAOG3fn3VV",
      "shampoo-set": "HdpJwaZsoHDAOG3fn3VV",
      "highlights": "AKGVsNGC8VME87ZAwwAH",
    };
    const calendarId = serviceToCalendarMap[selectedService.id] || "HdpJwaZsoHDAOG3fn3VV";

    // Map stylist to GHL userId
    const stylistToUserMap: Record<string, string> = {
      "amy": "fpKRyPPF3LiqtOcPUpzH",
      "jan": "x0aX48kKnxlVJsKZGFvI",
      "mai": "FlWwhX8WMGwJ1wZmfVJr",
      "ratchanee": "etpPCuCDmIrhZ5KBIv66",
    };
    const userId = selectedStylist ? stylistToUserMap[selectedStylist.id] : undefined;

    const startTimestamp = new Date(currentYear, currentMonth, 1, 0, 0, 0).getTime();
    const endTimestamp = new Date(currentYear, currentMonth, getDaysInMonth(currentYear, currentMonth), 23, 59, 59).getTime();

    setLoading(true);
    let url = `/api/ghl/free-slots?calendarId=${calendarId}&startDate=${startTimestamp}&endDate=${endTimestamp}`;
    if (userId) {
      url += `&userId=${userId}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const { traceId, ...slots } = data;
        setSlotsByDate(slots);
        setLoading(false);

        // Auto-select first slot of selected day
        const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
        const daySlots = slots[formattedDate]?.slots || [];
        if (daySlots.length > 0) {
          setSelectedTime(daySlots[0]);
        } else {
          setSelectedTime(null);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch GHL slots:", err);
        setLoading(false);
      });
  }, [currentMonth, currentYear, selectedService, selectedStylist]);

  // Helper to format ISO slot string to 12-hour format
  const formatSlotTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch (e) {
      return isoString;
    }
  };

  // Calendar rendering matrix structure
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
  const daySlots = slotsByDate[formattedDate]?.slots || [];

  const morningSlots = daySlots.filter((slotStr) => {
    const date = new Date(slotStr);
    return date.getHours() < 12;
  });

  const afternoonSlots = daySlots.filter((slotStr) => {
    const date = new Date(slotStr);
    return date.getHours() >= 12;
  });

  return (
    <div className="bg-[#faf8f6] min-h-screen flex flex-col justify-between text-[#1c1a19]">
      <div className="w-full max-w-[480px] bg-white min-h-screen flex flex-col mx-auto shadow-xl relative overflow-hidden">
        {/* Header App Bar */}
        <header className="flex justify-between items-center px-4 py-3 border-b border-[#efe8e6] bg-white">
          <button
            onClick={onBack}
            className="text-[#5c5a59] hover:bg-gray-50 transition-colors rounded-full p-2"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-sans text-xs font-bold text-[#5c5a59] text-center flex-1">
            {stepText}
          </h1>
          <button
            onClick={onClose}
            className="text-[#5c5a59] hover:bg-gray-50 transition-colors rounded-full p-2"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Content View */}
        <main className="flex-1 px-4 py-3 space-y-3.5 overflow-y-auto pb-24">
          <h2 className="text-lg font-bold tracking-tight text-[#1c1a19] font-serif">
            Select Date & Time
          </h2>

          {/* Service/Stylist Summary Card with Edit pencil */}
          <div className="bg-[#faf8f6] border border-[#efe8e6] rounded-xl p-2.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              {selectedStylist && selectedStylist.id !== "first_available" ? (
                <img
                  src={selectedStylist.avatarUrl}
                  alt={selectedStylist.name}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover border border-[#efe8e6]"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#ffdad5] text-[#80140b] flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
              )}
              <div>
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#5c5a59] block">
                  {selectedService ? selectedService.name : "MEN'S HAIRCUT"}
                </span>
                <span className="text-xs font-bold text-[#1c1a19]">
                  with {selectedStylist ? selectedStylist.name : "First Available"}
                </span>
              </div>
            </div>
            <button
              onClick={onChangeStylist}
              className="text-[#5c5a59] hover:text-[#80140b] hover:bg-gray-50 transition-all p-1.5 rounded-full"
              title="Edit Stylist"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Calendar Block */}
          <div className="space-y-2">
            {/* Header controls */}
            <div className="flex items-center justify-between px-1">
              <h3 className="font-extrabold text-xs font-sans text-[#1c1a19]">
                {monthNames[currentMonth]} {currentYear}
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  className="w-7 h-7 rounded-full border border-[#efe8e6] flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 text-[#1c1a19] transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={nextMonth}
                  className="w-7 h-7 rounded-full border border-[#efe8e6] flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 text-[#1c1a19] transition"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-y-1 text-center text-xs font-semibold">
              {/* Day title headers */}
              {daysOfWeek.map((day) => (
                <div key={day} className="text-gray-400 font-bold tracking-wider py-0.5 text-[10px]">
                  {day}
                </div>
              ))}

              {/* Day dates */}
              {calendarDays.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="py-1"></div>;
                }

                const isSelected = selectedDay === day;
                const hasDot = dotDays.includes(day);

                return (
                  <button
                    key={`day-${day}`}
                    onClick={() => handleDaySelect(day)}
                    className="flex flex-col items-center justify-center relative py-0.5 focus:outline-none"
                  >
                    <div
                      className={`w-7.5 h-7.5 rounded-full flex items-center justify-center text-xs font-semibold transition ${
                        isSelected
                          ? "bg-[#80140b] text-white font-bold shadow-md transform scale-105"
                          : "text-[#1c1a19] hover:bg-gray-100"
                      }`}
                    >
                      {day}
                    </div>
                    {/* Tiny popular dot indicator */}
                    {hasDot && !isSelected && (
                      <div className="absolute bottom-0 w-1 h-1 bg-[#80140b] rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slot Picker Block */}
          <div className="space-y-2 pt-1">
            <h3 className="font-bold text-xs tracking-tight text-[#1c1a19]">Available Times</h3>

            {loading ? (
              <div className="text-center py-6 text-xs text-[#5c5a59] font-medium animate-pulse">
                Loading available times...
              </div>
            ) : daySlots.length === 0 ? (
              <div className="text-center py-6 text-xs text-red-500 font-medium bg-red-50/50 rounded-xl border border-red-100">
                No slots available on this date.
              </div>
            ) : (
              <>
                {/* Morning Times */}
                {morningSlots.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-[10px] text-[#5c5a59] uppercase tracking-wider font-extrabold">
                      <Sun className="w-3.5 h-3.5 text-[#80140b]" />
                      <span>Morning</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {morningSlots.map((slot) => {
                        const isSelected = selectedTime === slot;
                        return (
                          <button
                            key={slot}
                            onClick={() => setSelectedTime(slot)}
                            className={`py-2 px-1 rounded-lg border text-[11px] font-bold text-center transition-all ${
                              isSelected
                                ? "border-[#80140b] text-[#80140b] bg-[#fdfaf9] font-extrabold ring-1 ring-[#80140b]"
                                : "border-[#efe8e6] text-[#1c1a19] bg-[#faf8f6] hover:border-gray-300"
                            }`}
                          >
                            {formatSlotTime(slot)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Afternoon Times */}
                {afternoonSlots.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center gap-1 text-[10px] text-[#5c5a59] uppercase tracking-wider font-extrabold">
                      <Sunset className="w-3.5 h-3.5 text-[#80140b]" />
                      <span>Afternoon</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {afternoonSlots.map((slot) => {
                        const isSelected = selectedTime === slot;
                        return (
                          <button
                            key={slot}
                            onClick={() => setSelectedTime(slot)}
                            className={`py-2 px-1 rounded-lg border text-[11px] font-bold text-center transition-all ${
                              isSelected
                                ? "border-[#80140b] text-[#80140b] bg-[#fdfaf9] font-extrabold ring-1 ring-[#80140b]"
                                : "border-[#efe8e6] text-[#1c1a19] bg-[#faf8f6] hover:border-gray-300"
                            }`}
                          >
                            {formatSlotTime(slot)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {/* Floating bottom sticky CTA button */}
        <footer className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-[#efe8e6] shadow-lg z-10">
          <button
            onClick={handleConfirm}
            disabled={!selectedTime}
            className={`w-full text-white py-3.5 px-6 rounded-lg font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all ${
              selectedTime ? "bg-[#80140b] hover:bg-[#680f08] shadow-md" : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            <span>Confirm Booking</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </footer>
      </div>
    </div>
  );
}
