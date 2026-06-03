import { Service, Stylist, TimeSlot } from "./types";

export const SERVICES: Service[] = [
  {
    id: "mens-cut",
    name: "Men's Cut",
    duration: 30,
    price: 32,
  },
  {
    id: "womens-cut",
    name: "Women's Cut",
    duration: 45,
    price: 45,
  },
  {
    id: "color",
    name: "Color",
    duration: 60,
    price: 85,
  },
  {
    id: "shampoo-haircut",
    name: "Shampoo & Haircut",
    duration: 45,
    price: 55,
  },
  {
    id: "shampoo-set",
    name: "Shampoo Set",
    duration: 30,
    price: 40,
  },
  {
    id: "highlights",
    name: "Highlights",
    duration: 120,
    price: 120,
    isStartingPrice: true,
  },
];

export const STYLISTS: Stylist[] = [
  {
    id: "first_available",
    name: "First Available",
    role: "Maximum flexibility",
    avatarUrl: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=256&h=256",
    description: "Match with whoever is free first to fit your schedule.",
  },
  {
    id: "amy",
    name: "Amy",
    role: "Master Barber",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256&h=256",
    description: "Specializes in modern fades, beard sculpting, and sharp classic cuts.",
  },
  {
    id: "jan",
    name: "Jan",
    role: "Senior Stylist",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256&h=256",
    description: "Expert in layering, women's styles, and precision texturizing.",
  },
  {
    id: "mai",
    name: "Mai",
    role: "Artistic Director",
    avatarUrl: "https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?auto=format&fit=crop&q=80&w=256&h=256",
    description: "Over 15 years crafting unique statement cuts and editorial hair shapes.",
  },
  {
    id: "ratchanee",
    name: "Ratchanee",
    role: "Color Specialist",
    avatarUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=256&h=256",
    description: "Master colorist specializing in balayage, vivids, and seamless blending.",
  },
];

export const TIME_SLOTS: TimeSlot[] = [
  // Morning
  { time: "9:00 AM", period: "morning", isAvailable: true },
  { time: "9:30 AM", period: "morning", isAvailable: false },
  { time: "10:00 AM", period: "morning", isAvailable: true },
  { time: "10:30 AM", period: "morning", isAvailable: true },
  { time: "11:00 AM", period: "morning", isAvailable: true },
  { time: "11:30 AM", period: "morning", isAvailable: true },
  // Afternoon
  { time: "1:00 PM", period: "afternoon", isAvailable: true },
  { time: "1:30 PM", period: "afternoon", isAvailable: true },
  { time: "2:00 PM", period: "afternoon", isAvailable: false },
  { time: "2:30 PM", period: "afternoon", isAvailable: true },
  { time: "3:00 PM", period: "afternoon", isAvailable: true },
  { time: "4:30 PM", period: "afternoon", isAvailable: true },
];
