export interface Service {
  id: string;
  name: string;
  duration: number; // in minutes
  price: number;
  isStartingPrice?: boolean;
}

export interface Stylist {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  description: string;
}

export interface TimeSlot {
  time: string;
  period: "morning" | "afternoon";
  isAvailable: boolean;
}

export interface BookingState {
  service: Service | null;
  stylist: Stylist | null;
  date: Date | null;
  timeSlot: string | null;
  customerName: string;
  customerPhone: string;
  leadSource: string;
}

export enum BookingStep {
  Landing = "landing",
  CustomerInfo = "customer_info",
  StylistSelect = "stylist_select",
  DateTimeSelect = "date_time",
  Confirmation = "confirmation",
}
