import React, { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import ConfirmationScreen, { HistoricBooking } from './components/ConfirmationScreen';
import { SERVICES, STYLISTS } from './data';
import { Service, Stylist } from './types';
import './index.css';

function ThankYouPage() {
  const [currentBooking, setCurrentBooking] = useState<any | null>(null);
  const [historyCheckouts, setHistoryCheckouts] = useState<HistoricBooking[]>([]);

  useEffect(() => {
    // 1. Get the booking ID from the URL query parameters
    const params = new URLSearchParams(window.location.search);
    const bookingId = params.get('id');

    // 2. Load history from local storage first
    let localHistory: HistoricBooking[] = [];
    try {
      const stored = localStorage.getItem('hair_2000_appointments');
      if (stored) {
        localHistory = JSON.parse(stored);
        setHistoryCheckouts(localHistory);
      }
    } catch (e) {
      console.error('Failed to load local storage appointments', e);
    }

    // 3. Fetch current booking details if ID is present
    if (bookingId) {
      fetch(`/api/bookings/${bookingId}`)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch booking');
          return res.json();
        })
        .then((data: HistoricBooking) => {
          // Resolve current booking display
          resolveBooking(data);

          // Update local history checkouts with the fetched booking details
          const exists = localHistory.some((b) => b.id === data.id);
          let updatedHistory = localHistory;
          if (exists) {
            updatedHistory = localHistory.map((b) => (b.id === data.id ? data : b));
          } else {
            updatedHistory = [data, ...localHistory];
          }
          setHistoryCheckouts(updatedHistory);
          localStorage.setItem('hair_2000_appointments', JSON.stringify(updatedHistory));
        })
        .catch((err) => {
          console.warn('API error, using local storage fallbacks:', err);
          // Look for matched booking in local history
          const matched = localHistory.find((b) => b.id === bookingId);
          if (matched) {
            resolveBooking(matched);
          } else {
            checkFallback(bookingId);
          }
        });
    } else {
      checkFallback(bookingId);
    }
  }, []);

  const checkFallback = (bookingId: string | null) => {
    try {
      const storedLast = localStorage.getItem('last_booking');
      if (storedLast) {
        const lastObj = JSON.parse(storedLast);
        if (!bookingId || lastObj.id === bookingId) {
          resolveBooking(lastObj);
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const resolveBooking = (hist: HistoricBooking) => {
    // Map service name and stylist name back to full structures for the confirmation ticket
    const srv = SERVICES.find((s) => s.name === hist.serviceName) || {
      id: 'custom',
      name: hist.serviceName,
      duration: 30,
      price: hist.servicePrice,
    };

    const sty = STYLISTS.find((s) => s.name === hist.stylistName) || {
      id: 'custom',
      name: hist.stylistName,
      role: hist.stylistRole || 'Stylist',
      avatarUrl: '',
      description: '',
    };

    // Reconstruct Date object
    const parsedDate = new Date(hist.dateStr || Date.now());

    const solvedBooking = {
      service: srv,
      stylist: sty,
      date: isNaN(parsedDate.getTime()) ? new Date() : parsedDate,
      timeSlot: hist.timeSlot,
      customerName: hist.customerName,
      customerPhone: hist.customerPhone,
    };

    setCurrentBooking(solvedBooking);

    // Dispatch conversion tracking event on page load/resolution
    window.dispatchEvent(
      new CustomEvent("booking_confirmed", {
        detail: {
          bookingId: hist.id,
          value: hist.servicePrice,
          currency: "USD",
          service: hist.serviceName,
          stylist: hist.stylistName,
          customerName: hist.customerName,
        },
      })
    );

    // Dispatch standard Meta Pixel conversion tracking event (Lead)
    if (typeof (window as any).fbq === "function") {
      (window as any).fbq("track", "Lead", {
        content_name: hist.serviceName,
        value: hist.servicePrice,
        currency: "USD",
      });
    }
  };

  const handleCancelBooking = (id: string) => {
    fetch(`/api/bookings/${id}`, {
      method: 'DELETE',
    })
      .then((res) => {
        if (!res.ok) throw new Error('API delete failed');
        console.log('Successfully deleted booking.');
      })
      .catch((err) => {
        console.error('Server deletion failed:', err);
      });

    // Update state lists
    const updated = historyCheckouts.filter((item) => item.id !== id);
    setHistoryCheckouts(updated);
    try {
      localStorage.setItem('hair_2000_appointments', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    // Clear ticket display if cancelling the active one
    const params = new URLSearchParams(window.location.search);
    if (params.get('id') === id) {
      setCurrentBooking(null);
    }
  };

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  return (
    <ConfirmationScreen
      currentBooking={currentBooking}
      historyCheckouts={historyCheckouts}
      onBackToMenu={handleBackToHome}
      onCancelBooking={handleCancelBooking}
    />
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThankYouPage />
  </StrictMode>
);
