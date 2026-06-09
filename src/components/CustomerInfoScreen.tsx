import React, { useState } from "react";
import { ArrowLeft, X, ArrowRight } from "lucide-react";

interface CustomerInfoScreenProps {
  initialName: string;
  initialPhone: string;
  stepText: string;
  onContinue: (name: string, phone: string) => void;
  onBack: () => void;
  onClose: () => void;
}

export default function CustomerInfoScreen({
  initialName,
  initialPhone,
  stepText,
  onContinue,
  onBack,
  onClose,
}: CustomerInfoScreenProps) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!phone.trim() || phone.length < 8) {
      setError("Please enter a valid phone number.");
      return;
    }
    setError("");
    onContinue(name, phone);
  };

  return (
    <div className="bg-[#faf8f6] min-h-dvh flex justify-center items-center text-[#1c1a19] font-sans">
      {/* Container constrained to mobile preview */}
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

        {/* Main Content */}
        <main className="flex-1 px-6 pt-6 pb-6 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            <div className="text-center space-y-1.5">
              <h2 className="font-serif text-3xl font-bold tracking-tight text-[#1c1a19]">
                Get Started
              </h2>
              <p className="text-sm text-[#5c5a59] leading-relaxed max-w-[320px] mx-auto font-medium">
                Enter your details to secure your premium experience.
              </p>
            </div>

            {/* Error badge */}
            {error && (
              <div className="bg-[#ffdad6] text-[#80140b] text-xs font-bold py-2 px-4 rounded-lg text-center">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Field */}
              <div className="space-y-1">
                <label
                  htmlFor="fullName"
                  className="text-[10px] font-bold tracking-wider text-[#5c5a59] uppercase block ml-1"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full border-b border-[#efe8e6] focus:border-[#80140b] py-2.5 px-4 outline-none transition-all text-sm bg-[#faf8f6] rounded-t-lg font-medium"
                  required
                />
              </div>

              {/* Phone Field */}
              <div className="space-y-1">
                <label
                  htmlFor="phoneNumber"
                  className="text-[10px] font-bold tracking-wider text-[#5c5a59] uppercase block ml-1"
                >
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full border-b border-[#efe8e6] focus:border-[#80140b] py-2.5 px-4 outline-none transition-all text-sm bg-[#faf8f6] rounded-t-lg font-medium"
                  required
                />
              </div>

              {/* Push button right under fields */}
              <div className="pt-6">
                <button
                  type="submit"
                  className="w-full bg-[#80140b] text-white py-3.5 px-6 rounded-lg font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 hover:bg-[#680f08] transition-colors shadow-md"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Bottom Watermark Footer */}
          <footer className="text-center pt-4 border-t border-[#efe8e6]">
            <p className="text-[9px] font-bold tracking-[0.2em] text-[#7d7977] uppercase">
              © Hair 2000. Est. 1991
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
