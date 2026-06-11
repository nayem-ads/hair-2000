/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { BookingStep, Service, Stylist, BookingState } from "./types";
import { SERVICES, STYLISTS } from "./data";
import LandingScreen from "./components/LandingScreen";
import CustomerInfoScreen from "./components/CustomerInfoScreen";
import ServiceSelectScreen from "./components/ServiceSelectScreen";
import StylistSelectScreen from "./components/StylistSelectScreen";
import DateTimeSelectScreen from "./components/DateTimeSelectScreen";
import ConfirmationScreen, { HistoricBooking } from "./components/ConfirmationScreen";

export default function App() {
  const [currentStep, setCurrentStep] = useState<BookingStep>(BookingStep.Landing);
  const [isServicePreselected, setIsServicePreselected] = useState<boolean>(false);

  // Core Booking wizard state
  const [booking, setBooking] = useState<BookingState>({
    service: null,
    stylist: null,
    date: null,
    timeSlot: null,
    customerName: "",
    customerPhone: "",
  });

  // History list from local storage
  const [historyList, setHistoryList] = useState<HistoricBooking[]>([]);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("hair_2000_appointments");
      if (stored) {
        setHistoryList(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load local storage appointments", e);
    }
  }, []);

  // Sync to local storage on changes
  const saveHistoryList = (newList: HistoricBooking[]) => {
    setHistoryList(newList);
    try {
      localStorage.setItem("hair_2000_appointments", JSON.stringify(newList));
    } catch (e) {
      console.error("Failed to save local storage appointments", e);
    }
  };

  const handleStartBooking = (initialService?: Service) => {
    setIsServicePreselected(!!initialService);
    setBooking({
      service: initialService || null, // null if they need to choose in the flow
      stylist: STYLISTS[0], // Default to first available
      date: new Date(2026, 5, 3), // Default to June 3, 2026
      timeSlot: "11:00 AM", // Start with 11:00 AM as selected in mockups
      customerName: booking.customerName, // Keep name if already typed previously
      customerPhone: booking.customerPhone,
    });
    setCurrentStep(BookingStep.CustomerInfo);
  };

  const handleCustomerInfoContinue = (name: string, phone: string) => {
    setBooking((prev) => ({
      ...prev,
      customerName: name,
      customerPhone: phone,
    }));
    if (isServicePreselected) {
      setCurrentStep(BookingStep.StylistSelect);
    } else {
      setCurrentStep(BookingStep.ServiceSelect);
    }
  };

  const handleServiceSelect = (selected: Service) => {
    setBooking((prev) => ({
      ...prev,
      service: selected,
    }));
    setCurrentStep(BookingStep.StylistSelect);
  };

  const handleStylistSelect = (selected: Stylist) => {
    setBooking((prev) => ({
      ...prev,
      stylist: selected,
    }));
    setCurrentStep(BookingStep.DateTimeSelect);
  };

  const handleDateTimeConfirm = (date: Date, slot: string) => {
    // Map service to GHL calendarId
    const serviceToCalendarMap: Record<string, string> = {
      "mens-cut": "HdpJwaZsoHDAOG3fn3VV",
      "womens-cut": "f5ofJYfNovH7NH3AQOJF",
      "color": "AKGVsNGC8VME87ZAwwAH",
      "shampoo-haircut": "HdpJwaZsoHDAOG3fn3VV",
      "shampoo-set": "HdpJwaZsoHDAOG3fn3VV",
      "highlights": "AKGVsNGC8VME87ZAwwAH",
    };
    const calendarId = booking.service ? serviceToCalendarMap[booking.service.id] : "HdpJwaZsoHDAOG3fn3VV";

    // Map stylist to GHL userId
    const stylistToUserMap: Record<string, string> = {
      "amy": "fpKRyPPF3LiqtOcPUpzH",
      "jan": "x0aX48kKnxlVJsKZGFvI",
      "mai": "FlWwhX8WMGwJ1wZmfVJr",
      "ratchanee": "etpPCuCDmIrhZ5KBIv66",
    };
    const userId = booking.stylist ? stylistToUserMap[booking.stylist.id] : undefined;

    const humanTime = new Date(slot).toLocaleTimeString("en-US", {
      timeZone: "America/Los_Angeles",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const humanDateStr = new Date(slot).toLocaleDateString("en-US", {
      timeZone: "America/Los_Angeles",
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const finalBooking = {
      ...booking,
      date,
      timeSlot: humanTime,
    };
    setBooking(finalBooking);

    // Send booking to GoHighLevel proxy endpoint
    fetch("/api/ghl/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        calendarId,
        startTime: slot,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        userId,
        serviceName: booking.service?.name || "Premium Cut",
        servicePrice: booking.service?.price || 32,
        stylistName: booking.stylist?.name || "First Available",
        stylistRole: booking.stylist?.role || "Hair Expert",
        dateStr: humanDateStr,
        timeSlot: humanTime
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("GHL booking request failed");
        return res.json();
      })
      .then((newReservation) => {
        console.log("Successfully created GHL booking:", newReservation);
        // Save last booking to local storage as fallback for thank-you page
        localStorage.setItem("last_booking", JSON.stringify(newReservation));

        const updatedHistory = [newReservation, ...historyList];
        saveHistoryList(updatedHistory);

        // Redirect to the dedicated separate thank-you page
        window.location.href = `/thank-you?id=${newReservation.id}`;
      })
      .catch((err) => {
        console.error("GHL booking failed:", err);
        alert("GHL Booking failed. Please try again.");
      });
  };

  const handleCancelReservation = (id: string) => {
    // Send DELETE to server API
    fetch(`/api/bookings/${id}`, {
      method: "DELETE",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to delete booking on server");
        console.log("Booking successfully deleted on server database.");
      })
      .catch((err) => {
        console.error("Server deletion failed:", err);
      });

    const updated = historyList.filter((item) => item.id !== id);
    saveHistoryList(updated);
  };

  const handleCloseOrReset = () => {
    if (confirm("Are you sure you want to cancel the booking flow? Your progress will be lost.")) {
      setCurrentStep(BookingStep.Landing);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff]">
      {currentStep === BookingStep.Landing && (
        <LandingScreen
          onStartBooking={handleStartBooking}
          onViewBookings={() => setCurrentStep(BookingStep.Confirmation)}
          bookingCount={historyList.length}
        />
      )}

      {currentStep === BookingStep.CustomerInfo && (
        <CustomerInfoScreen
          initialName={booking.customerName}
          initialPhone={booking.customerPhone}
          stepText={isServicePreselected ? "Step 1 of 3" : "Step 1 of 4"}
          onContinue={handleCustomerInfoContinue}
          onBack={() => setCurrentStep(BookingStep.Landing)}
          onClose={handleCloseOrReset}
        />
      )}

      {currentStep === BookingStep.ServiceSelect && (
        <ServiceSelectScreen
          selectedService={booking.service}
          stepText="Step 2 of 4"
          onSelect={handleServiceSelect}
          onBack={() => setCurrentStep(BookingStep.CustomerInfo)}
          onClose={handleCloseOrReset}
        />
      )}

      {currentStep === BookingStep.StylistSelect && (
        <StylistSelectScreen
          selectedStylist={booking.stylist}
          stepText={isServicePreselected ? "Step 2 of 3" : "Step 3 of 4"}
          onSelect={handleStylistSelect}
          onBack={() => setCurrentStep(isServicePreselected ? BookingStep.CustomerInfo : BookingStep.ServiceSelect)}
        />
      )}

      {currentStep === BookingStep.DateTimeSelect && (
        <DateTimeSelectScreen
          selectedService={booking.service}
          selectedStylist={booking.stylist}
          stepText={isServicePreselected ? "Step 3 of 3" : "Step 4 of 4"}
          onConfirm={handleDateTimeConfirm}
          onBack={() => setCurrentStep(BookingStep.StylistSelect)}
          onClose={handleCloseOrReset}
          onChangeStylist={() => setCurrentStep(BookingStep.StylistSelect)}
        />
      )}

      {currentStep === BookingStep.Confirmation && (
        <ConfirmationScreen
          currentBooking={
            booking.service && booking.stylist && booking.date && booking.timeSlot
              ? {
                  service: booking.service,
                  stylist: booking.stylist,
                  date: booking.date,
                  timeSlot: booking.timeSlot,
                  customerName: booking.customerName,
                  customerPhone: booking.customerPhone,
                }
              : null
          }
          historyCheckouts={historyList}
          onBackToMenu={() => {
            // Reset booking target fields but preserve name/phone
            setBooking({
              service: null,
              stylist: null,
              date: null,
              timeSlot: null,
              customerName: booking.customerName,
              customerPhone: booking.customerPhone,
            });
            setCurrentStep(BookingStep.Landing);
          }}
          onCancelBooking={handleCancelReservation}
        />
      )}
    </div>
  );
}
