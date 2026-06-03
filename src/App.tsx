/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { BookingStep, Service, Stylist, BookingState } from "./types";
import { SERVICES, STYLISTS } from "./data";
import LandingScreen from "./components/LandingScreen";
import CustomerInfoScreen from "./components/CustomerInfoScreen";
import StylistSelectScreen from "./components/StylistSelectScreen";
import DateTimeSelectScreen from "./components/DateTimeSelectScreen";
import ConfirmationScreen, { HistoricBooking } from "./components/ConfirmationScreen";

export default function App() {
  const [currentStep, setCurrentStep] = useState<BookingStep>(BookingStep.Landing);

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

  // Load from API with local storage fallback
  useEffect(() => {
    fetch("/api/bookings")
      .then((res) => {
        if (!res.ok) throw new Error("API failed");
        return res.json();
      })
      .then((data) => {
        setHistoryList(data);
        localStorage.setItem("hair_2000_appointments", JSON.stringify(data));
      })
      .catch((err) => {
        console.warn("Could not sync with API, using local storage fallback:", err);
        try {
          const stored = localStorage.getItem("hair_2000_appointments");
          if (stored) {
            setHistoryList(JSON.parse(stored));
          }
        } catch (e) {
          console.error("Failed to load local storage appointments", e);
        }
      });
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
    setBooking({
      service: initialService || SERVICES[0], // Default to Men's Cut if nothing selected
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
    const finalBooking = {
      ...booking,
      date,
      timeSlot: slot,
    };
    setBooking(finalBooking);

    // Persist to local storage database checkouts
    const newReservation: HistoricBooking = {
      id: Math.random().toString(36).substr(2, 9),
      serviceName: finalBooking.service?.name || "Premium Cut",
      servicePrice: finalBooking.service?.price || 32,
      stylistName: finalBooking.stylist?.name || "First Available",
      stylistRole: finalBooking.stylist?.role || "Hair Expert",
      dateStr: date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      timeSlot: slot,
      customerName: finalBooking.customerName,
      customerPhone: finalBooking.customerPhone,
      createdAt: new Date().toISOString(),
    };

    // Send POST to server database API
    fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newReservation),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to sync to database");
        console.log("Booking successfully synchronized to server database.");
      })
      .catch((err) => {
        console.error("Database sync failed, falling back to local client storage:", err);
      });

    // Save last booking to local storage as fallback for thank-you page
    localStorage.setItem("last_booking", JSON.stringify(newReservation));

    const updatedHistory = [newReservation, ...historyList];
    saveHistoryList(updatedHistory);

    // Redirect to the dedicated separate thank-you page
    window.location.href = `/thank-you?id=${newReservation.id}`;
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
          stepText="Step 1 of 3"
          onContinue={handleCustomerInfoContinue}
          onBack={() => setCurrentStep(BookingStep.Landing)}
          onClose={handleCloseOrReset}
        />
      )}

      {currentStep === BookingStep.StylistSelect && (
        <StylistSelectScreen
          selectedStylist={booking.stylist}
          stepText="Step 2 of 3"
          onSelect={handleStylistSelect}
          onBack={() => setCurrentStep(BookingStep.CustomerInfo)}
        />
      )}

      {currentStep === BookingStep.DateTimeSelect && (
        <DateTimeSelectScreen
          selectedService={booking.service}
          selectedStylist={booking.stylist}
          stepText="Step 3 of 3"
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
