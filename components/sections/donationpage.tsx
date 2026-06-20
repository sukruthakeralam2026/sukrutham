"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";

export default function DonationPage() {
  const router = useRouter();
  const [wantsCertificate, setWantsCertificate] = useState(false);
  const [amount, setAmount] = useState("1000");
  const [showCustomAmount, setShowCustomAmount] = useState(false);
  const [selectedAmountPill, setSelectedAmountPill] = useState("1000");
  const [customAmountError, setCustomAmountError] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsError, setShowTermsError] = useState(false);

  // Form field states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+91"); // Default to India
  const [contact, setContact] = useState("");
  const [pan, setPan] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // "What inspired you" states
  const [inspiredBy, setInspiredBy] = useState("");
  const [inspiredByFriendName, setInspiredByFriendName] = useState("");

  // Form validation states
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showErrors, setShowErrors] = useState(false);

  // Country codes for the dropdown
  const countryCodes = [
    { code: "+91", country: "India", flag: "🇮🇳" },
    { code: "+1", country: "USA/Canada", flag: "🇺🇸" },
    { code: "+44", country: "UK", flag: "🇬🇧" },
    { code: "+61", country: "Australia", flag: "🇦🇺" },
    { code: "+65", country: "Singapore", flag: "🇸🇬" },
    { code: "+971", country: "UAE", flag: "🇦🇪" },
    { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
    { code: "+974", country: "Qatar", flag: "🇶🇦" },
    { code: "+965", country: "Kuwait", flag: "🇰🇼" },
    { code: "+968", country: "Oman", flag: "🇴🇲" },
    { code: "+973", country: "Bahrain", flag: "🇧🇭" },
    { code: "+49", country: "Germany", flag: "🇩🇪" },
    { code: "+33", country: "France", flag: "🇫🇷" },
    { code: "+39", country: "Italy", flag: "🇮🇹" },
    { code: "+34", country: "Spain", flag: "🇪🇸" },
    { code: "+81", country: "Japan", flag: "🇯🇵" },
    { code: "+86", country: "China", flag: "🇨🇳" },
    { code: "+82", country: "South Korea", flag: "🇰🇷" },
    { code: "+60", country: "Malaysia", flag: "🇲🇾" },
    { code: "+66", country: "Thailand", flag: "🇹🇭" },
  ];

  useEffect(() => {
    const pending_order_id = localStorage.getItem("pending_order_id");
    if (pending_order_id) {
      setIsLoading(true);
      toast.loading(
        "Previous pending transactions found, redirecting to status page ..."
      );
      setTimeout(() => {
        toast.dismiss();
      }, 2000);
      router.push("/thankyou?order_id=" + pending_order_id);
    }
  }, []);

  const handleAmountSelect = (value: string) => {
    setAmount(value);
    setSelectedAmountPill(value);
    setShowCustomAmount(false);
    setCustomAmountError(""); // Clear custom amount error when selecting predefined amount
  };

  const handleOtherAmountClick = () => {
    setSelectedAmountPill("other");
    setShowCustomAmount(true);
    setAmount(""); // Clear the amount when switching to custom
  };

  const handleCustomAmountChange = (value: string) => {
    setAmount(value);

    // Real-time validation for custom amount
    if (value && parseFloat(value) > 0 && parseFloat(value) < 1000) {
      setCustomAmountError("Minimum donation amount is ₹1,000");
    } else {
      setCustomAmountError("");
    }

    // Clear amount error if user is typing and meets minimum requirement
    if (value && parseFloat(value) >= 1000 && errors.amount) {
      const newErrors = { ...errors };
      delete newErrors.amount;
      setErrors(newErrors);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Required fields validation
    if (!fullName.trim()) newErrors.fullName = "Full name is required";
    else if (!/^[A-Za-z][A-Za-z .'-]*[A-Za-z]$/.test(fullName))
      newErrors.fullName =
        "Please enter a valid full name. It should start and end with a letter and can contain spaces, periods, apostrophes, or hyphens.";
    // if (!email.trim()) newErrors.email = "Email is required";
    if (email && !/\S+@\S+\.\S+/.test(email))
      newErrors.email = "Please enter a valid email";
    if (!contact.trim()) newErrors.contact = "Contact number is required";
    else {
      // Remove spaces and hyphens for validation
      const cleanContact = contact.replace(/[\s\-]/g, "");
      // Basic validation - should be digits and reasonable length
      if (!/^\+?[0-9]{1,4}[0-9]{5,14}$/.test(cleanContact)) {
        newErrors.contact = "Please enter a valid contact number (7-15 digits)";
      } else {
        setContact(cleanContact); // Update contact to cleaned version
      }
    }
    if (!amount || parseFloat(amount) <= 0)
      newErrors.amount = "Please enter a valid donation amount";
    else if (parseFloat(amount) < 1000)
      newErrors.amount = "Minimum donation amount is ₹1,000";

    // 80G Certificate conditional validation
    if (wantsCertificate) {
      if (!pan.trim())
        newErrors.pan = "PAN number is required for 80G certificate";
      else if (!/^[A-Za-z0-9]+$/.test(pan.toUpperCase()))
        newErrors.pan = "Please enter a valid PAN number";
      if (!address.trim())
        newErrors.address = "Full address is required for 80G certificate";
      else if (!/^[a-zA-Z0-9\s.,'#/-]+$/.test(address))
        newErrors.address =
          "Please enter a valid address. The address should only contain letters, numbers, spaces, and common punctuation like commas, periods, and hyphens";
      if (!city.trim()) newErrors.city = "City is required for 80G certificate";
      else if (!/^[A-Za-z\s-]+$/.test(city))
        newErrors.city =
          "Please enter a valid city name. It should only contain letters, spaces, and hyphens.";
      if (!state.trim())
        newErrors.state = "State is required for 80G certificate";
      else if (!/^[A-Za-z\s-]+$/.test(state))
        newErrors.state =
          "Please enter a valid state name. It should only contain letters, spaces, and hyphens.";
      if (!country.trim())
        newErrors.country = "Country is required for 80G certificate";
      else if (!/^[A-Za-z\s-]+$/.test(country))
        newErrors.country =
          "Please enter a valid country name. It should only contain letters, spaces, and hyphens.";
      if (!pinCode.trim())
        newErrors.pinCode = "PIN code is required for 80G certificate";
      else if (!/^\d{6}$/.test(pinCode))
        newErrors.pinCode = "Please enter a valid 6-digit PIN code";
    }

    // Inspired by validation
    if (inspiredBy === "friend" && !inspiredByFriendName.trim())
      newErrors.inspiredByFriendName =
        "Please enter the name of the friend who inspired you";

    // Terms validation
    if (!termsAccepted)
      newErrors.terms = "Please accept the Terms & Conditions to proceed";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowErrors(true);

    if (!validateForm()) {
      if (!termsAccepted) setShowTermsError(true);
      return;
    }

    setShowTermsError(false);
    setIsLoading(true);

    axios
      .post(`${process.env.NEXT_PUBLIC_API_URL}/api/donation/donate`, {
        full_name: fullName,
        email: email,
        contact_number: `${countryCode} ${contact}`,
        amount: amount,
        need_g80_certificate: wantsCertificate,
        confirmed_terms: termsAccepted,
        inspired_by: inspiredBy || null,
        inspired_by_friend_name:
          inspiredBy === "friend" ? inspiredByFriendName : null,
        form_g80: wantsCertificate
          ? {
              pan_number: pan,
              full_address: address,
              city: city,
              state: state,
              country: country,
              pin_code: pinCode,
            }
          : null,
      })
      .then((response) => {
        console.log(response);
        if (response.data) {
          if (response.data.gateway == "sbiepay") {
            localStorage.setItem(
              "pending_order_id",
              response.data.merchant_order_id
            );

            const form = document.createElement("form");
            form.method = "post";
            form.action = response.data.gateway_url;

            const hiddenField = document.createElement("input");
            hiddenField.type = "hidden";
            hiddenField.name = "EncryptTrans";
            hiddenField.value = response.data.payment_form_data.EncryptTrans;
            form.appendChild(hiddenField);
            const hiddenField2 = document.createElement("input");
            hiddenField2.type = "hidden";
            hiddenField2.name = "merchIdVal";
            hiddenField2.value = response.data.payment_form_data.merchIdVal;
            form.appendChild(hiddenField2);

            // Append the form to the body and submit it
            document.body.appendChild(form);
            form.submit();
          } else if (response.data.gateway == "phonepe") {
            localStorage.setItem(
              "pending_order_id",
              response.data.merchant_order_id
            );
            const redirect_url = response.data.payment_url;
            window.location.href = redirect_url;
          }
        } else {
          setIsLoading(false);
          toast.error(
            "There was an issue with your donation. Please try again."
          );
        }
      })
      .catch((error) => {
        setIsLoading(false);
        toast.error(
          "An error occurred while processing your request! Please try again."
        );
      });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <div className="flex flex-col lg:flex-row px-4 lg:px-16">
        {/* Left Column - Image Grid (Fixed on desktop, scrollable on mobile) */}
        <div className="w-full lg:w-1/2 p-3 lg:p-6">
          <div className="space-y-2 lg:space-y-4 -mt-5 lg:-mt-10 lg:flex lg:flex-col lg:justify-center">
            <div className="space-y-0">
              {/* Row 1: Large image LEFT + 4 small images RIGHT */}
              <div className="flex flex-col sm:flex-row gap-2 lg:gap-0 h-32 sm:h-48">
                {/* Left: Large image */}
                <div className="flex-1 rounded-xl overflow-hidden relative">
                  <Image
                    src="/images/rectangle 6.avif"
                    alt="rectangle 6"
                    width={400}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-orange-400/60 mix-blend-soft-light"></div>
                </div>
                {/* Right: 2x2 grid of 4 images */}
                <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-1 lg:gap-0 h-full">
                  <div className="rounded-xl overflow-hidden relative">
                    <Image
                      src="/images/rectangle 7.avif"
                      alt="rectangle 11"
                      width={900}
                      height={900}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-teal-500/50 mix-blend-soft-light"></div>
                  </div>
                  <div className="rounded-xl overflow-hidden relative">
                    <Image
                      src="/images/rectangle 8.avif"
                      alt="rectangle 12"
                      width={900}
                      height={900}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-green-600/40 mix-blend-soft-light"></div>
                  </div>
                  <div className="rounded-xl overflow-hidden relative">
                    <Image
                      src="/images/rectangle 9.avif"
                      alt="rectangle 13"
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-blue-500/50 mix-blend-soft-light"></div>
                  </div>
                  <div className="rounded-xl overflow-hidden relative">
                    <Image
                      src="/images/rectangle 10.avif"
                      alt="rectangle 14"
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-amber-500/60 mix-blend-soft-light"></div>
                  </div>
                </div>
              </div>

              {/* Row 2: 4 small images LEFT + Large image RIGHT */}
              <div className="flex flex-col sm:flex-row gap-2 lg:gap-0 h-32 sm:h-48">
                {/* Left: 2x2 grid of 4 images */}
                <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-1 lg:gap-0 h-full">
                  <div className="rounded-xl overflow-hidden relative">
                    <Image
                      src="/images/rectangle 11.avif"
                      alt="rectangle 11"
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-primary/50 mix-blend-soft-light"></div>
                  </div>
                  <div className="rounded-xl overflow-hidden relative">
                    <Image
                      src="/images/rectangle 12.avif"
                      alt="rectangle 12"
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-orange-400/70 mix-blend-soft-light"></div>
                  </div>
                  <div className="rounded-xl overflow-hidden relative">
                    <Image
                      src="/images/rectangle 13.avif"
                      alt="rectangle 13"
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-green-500/60 mix-blend-soft-light"></div>
                  </div>
                  <div className="rounded-xl overflow-hidden relative">
                    <Image
                      src="/images/rectangle 14.avif"
                      alt="rectangle 14"
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-cyan-600/50 mix-blend-soft-light"></div>
                  </div>
                </div>
                {/* Right: Large image */}
                <div className="flex-1 rounded-xl overflow-hidden relative">
                  <Image
                    src="/images/rectangle 15.jpg"
                    alt="rectangle 15"
                    width={400}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-blue-400/60 mix-blend-soft-light"></div>
                </div>
              </div>

              {/* Row 3: Large image LEFT + 4 small images RIGHT */}
              <div className="md:flex flex-col sm:flex-row gap-2 lg:gap-0 h-32 sm:h-48 hidden">
                {/* Left: Large image */}
                <div className="flex-1 rounded-xl overflow-hidden relative">
                  <Image
                    src="/images/rectangle 16.avif"
                    alt="rectangle 6"
                    width={400}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-orange-500/50 mix-blend-soft-light"></div>
                </div>
                {/* Right: 2x2 grid of 4 images */}
                <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-1 lg:gap-0 h-full">
                  <div className="rounded-xl overflow-hidden relative">
                    <Image
                      src="/images/rectangle 17.avif"
                      alt="rectangle 12"
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-orange-600/40 mix-blend-soft-light"></div>
                  </div>
                  <div className="rounded-xl overflow-hidden relative">
                    <Image
                      src="/images/rectangle 18.avif"
                      alt="rectangle 13"
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-pink-400/60 mix-blend-soft-light"></div>
                  </div>
                  <div className="rounded-xl overflow-hidden relative">
                    <Image
                      src="/images/rectangle 19.avif"
                      alt="rectangle 14"
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-green-600/50 mix-blend-soft-light"></div>
                  </div>
                  <div className="rounded-xl overflow-hidden relative">
                    <Image
                      src="/images/rectangle 20.avif"
                      alt="rectangle 15"
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-teal-500/60 mix-blend-soft-light"></div>
                  </div>
                </div>
              </div>

              {/* Row 4: 4 small images LEFT + Large image RIGHT */}
              <div className="hidden md:flex flex-col sm:flex-row gap-2 lg:gap-0 h-32 sm:h-48">
                {/* Left: 2x2 grid of 4 images */}
                <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-1 lg:gap-0 h-full">
                  <div className="rounded-xl overflow-hidden relative">
                    <Image
                      src="/images/rectangle 11.avif"
                      alt="rectangle 11"
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-orange-600/50 mix-blend-soft-light"></div>
                  </div>
                  <div className="rounded-xl overflow-hidden relative">
                    <Image
                      src="/images/rectangle 12.avif"
                      alt="rectangle 12"
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-pink-500/60 mix-blend-soft-light"></div>
                  </div>
                  <div className="rounded-xl overflow-hidden relative">
                    <Image
                      src="/images/rectangle 13.avif"
                      alt="rectangle 13"
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-green-500/40 mix-blend-soft-light"></div>
                  </div>
                  <div className="rounded-xl overflow-hidden relative">
                    <Image
                      src="/images/rectangle 14.avif"
                      alt="rectangle 14"
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-cyan-500/50 mix-blend-soft-light"></div>
                  </div>
                </div>
                {/* Right: Large image */}
                <div className="flex-1 rounded-xl overflow-hidden relative">
                  <Image
                    src="/images/rectangle 15.jpg"
                    alt="rectangle 15"
                    width={400}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-blue-600/60 mix-blend-soft-light"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Donation Form (Scrollable) */}
        <div className="w-full lg:w-1/2 p-3 lg:py-24 lg:px-12 ">
          <div className="space-y-6 flex flex-col items-center justify-start lg:justify-center lg:min-h-full py-4 lg:py-0">
            <div className="text-center lg:text-left">
              <h1 className="text-xl lg:text-2xl font-bold mb-2">
                Become a Part of the Sukrutha Kerala Initiative
              </h1>
              <p className="text-muted-foreground text-sm lg:text-base">
                Your contribution will directly fuel our efforts to build a
                better future for Kerala. Please fill out this form to complete
                your donation and make an immediate impact.
              </p>
            </div>

            <form className="space-y-4 w-full lg:w-3/4" onSubmit={handleSubmit}>
              {/* Full Name */}
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Enter your full name"
                  className="bg-gray-50"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  minLength={2}
                  maxLength={100}
                />
                {showErrors && errors.fullName && (
                  <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
                )}
              </div>

              {/* Email ID */}
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Email ID
                  {/* <span className="text-red-500">*</span> */}
                </label>
                <Input
                  type="email"
                  placeholder="Enter your email ID"
                  className="bg-gray-50 active:border-blue-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {showErrors && errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              {/* Contact Number */}
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="w-[140px] bg-gray-50">
                      <SelectValue placeholder="Code" />
                    </SelectTrigger>
                    <SelectContent>
                      {countryCodes.map((item) => (
                        <SelectItem key={item.code} value={item.code}>
                          <span className="flex items-center gap-2">
                            <span>{item.flag}</span>
                            <span>{item.code}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="tel"
                    placeholder="Enter your contact number"
                    className="bg-gray-50 flex-1"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    minLength={5}
                    maxLength={25}
                  />
                </div>
                {showErrors && errors.contact && (
                  <p className="text-red-500 text-sm mt-1">{errors.contact}</p>
                )}
              </div>

              {/* Enter Amount */}
              <div>
                <label className="text-sm font-medium mb-3 block">
                  Enter Amount (in ₹) <span className="text-red-500">*</span>
                </label>

                {/* Amount Pills */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {/* Default Amount Pills */}
                  <Button
                    type="button"
                    variant={
                      selectedAmountPill === "1000" ? "default" : "outline"
                    }
                    className={`h-12 text-sm font-medium ${
                      selectedAmountPill === "1000"
                        ? "bg-primary hover:bg-teal-700 text-white border-primary"
                        : "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
                    }`}
                    onClick={() => handleAmountSelect("1000")}
                  >
                    ₹1,000
                  </Button>

                  {/* Other Amount Pill */}
                  <Button
                    type="button"
                    variant={
                      selectedAmountPill === "other" ? "default" : "outline"
                    }
                    className={`h-12 text-sm font-medium ${
                      selectedAmountPill === "other"
                        ? "bg-primary hover:bg-teal-700 text-white border-primary"
                        : "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
                    }`}
                    onClick={handleOtherAmountClick}
                  >
                    Other Amount
                  </Button>
                </div>

                {/* Custom Amount Input - Only shown when "Other Amount" is selected */}
                <div
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    showCustomAmount
                      ? "max-h-20 opacity-100 mb-3"
                      : "max-h-0 opacity-0 mb-0"
                  }`}
                >
                  <div
                    className={`transition-transform duration-500 ease-in-out ${
                      showCustomAmount ? "translate-y-0" : "-translate-y-4"
                    }`}
                  >
                    <Input
                      type="number"
                      placeholder="Enter custom amount (min ₹1,000)"
                      className={`bg-gray-50 h-12 ${
                        customAmountError
                          ? "border-red-300 focus:border-red-500"
                          : ""
                      }`}
                      value={amount}
                      onChange={(e) => handleCustomAmountChange(e.target.value)}
                      autoFocus={showCustomAmount}
                      min="1000"
                    />
                    {/* Real-time error for custom amount */}
                    {customAmountError && (
                      <p className="text-red-500 text-sm mt-1 animate-fade-in">
                        {customAmountError}
                      </p>
                    )}
                  </div>
                </div>

                {showErrors && errors.amount && (
                  <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
                )}
              </div>

              {/* 80G Certificate Checkbox */}
              {/* <div className="flex items-center space-x-2">
                <Checkbox
                  id="certificate"
                  checked={wantsCertificate}
                  onCheckedChange={(checked) =>
                    setWantsCertificate(checked as boolean)
                  }
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <label htmlFor="certificate" className="text-sm">
                  I would like to receive 80(G) Certificate
                </label>
              </div> */}

              {/* <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  wantsCertificate
                    ? "max-h-[800px] opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div
                  className={`space-y-4 transition-transform duration-500 ease-in-out ${
                    wantsCertificate ? "translate-y-0" : "-translate-y-4"
                  }`}
                > */}
                  {/* PAN Number */}
                  {/* <div>
                    <label className="text-sm font-medium mb-1 block">
                      PAN number <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Enter PAN number"
                      className="bg-gray-50"
                      value={pan}
                      onChange={(e) => setPan(e.target.value)}
                      minLength={10}
                      maxLength={10}
                    />
                    {showErrors && errors.pan && (
                      <p className="text-red-500 text-sm mt-1">{errors.pan}</p>
                    )}
                  </div> */}

                  {/* Full Address */}
                  {/* <div>
                    <label className="text-sm font-medium mb-1 block">
                      Full Address <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      placeholder="Enter your full address"
                      className="bg-gray-50 min-h-[80px]"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      minLength={5}
                      maxLength={500}
                    />
                    {showErrors && errors.address && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.address}
                      </p>
                    )}
                  </div> */}

                  {/* City */}
                  {/* <div>
                    <label className="text-sm font-medium mb-1 block">
                      City <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Enter city"
                      className="bg-gray-50"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      minLength={2}
                      maxLength={100}
                    />
                    {showErrors && errors.city && (
                      <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                    )}
                  </div> */}

                  {/* State */}
                  {/* <div>
                    <label className="text-sm font-medium mb-1 block">
                      State <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Enter state"
                      className="bg-gray-50"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      minLength={2}
                      maxLength={100}
                    />
                    {showErrors && errors.state && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.state}
                      </p>
                    )}
                  </div> */}

                  {/* Country */}
                  {/* <div>
                    <label className="text-sm font-medium mb-1 block">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Enter country"
                      className="bg-gray-50"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      minLength={2}
                      maxLength={100}
                    />
                    {showErrors && errors.country && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.country}
                      </p>
                    )}
                  </div> */}

                  {/* PIN Code */}
                  {/* <div>
                    <label className="text-sm font-medium mb-1 block">
                      PIN Code <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Enter PIN code"
                      className="bg-gray-50"
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value)}
                      minLength={6}
                      maxLength={6}
                    />
                    {showErrors && errors.pinCode && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.pinCode}
                      </p>
                    )}
                  </div>
                </div>
              </div> */}

              {/* What inspired you to support this initiative? */}
              <div>
                <label className="text-sm font-medium mb-1 block">
                  What inspired you to support this initiative?
                </label>
                <Select
                  value={inspiredBy}
                  onValueChange={(val) => {
                    setInspiredBy(val);
                    if (val !== "friend") setInspiredByFriendName("");
                  }}
                >
                  <SelectTrigger className="bg-gray-50 w-full">
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="news">News</SelectItem>
                    <SelectItem value="community">Community</SelectItem>
                    <SelectItem value="groups">Groups</SelectItem>
                    <SelectItem value="friend">Friend</SelectItem>
                  </SelectContent>
                </Select>

                {/* Conditional friend name text box */}
                <div
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    inspiredBy === "friend"
                      ? "max-h-24 opacity-100 mt-3"
                      : "max-h-0 opacity-0 mt-0"
                  }`}
                >
                  <div
                    className={`transition-transform duration-500 ease-in-out ${
                      inspiredBy === "friend" ? "translate-y-0" : "-translate-y-4"
                    }`}
                  >
                    <Input
                      placeholder="Enter your friend's name"
                      className="bg-gray-50"
                      value={inspiredByFriendName}
                      onChange={(e) => setInspiredByFriendName(e.target.value)}
                      minLength={2}
                      maxLength={100}
                    />
                    {showErrors && errors.inspiredByFriendName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.inspiredByFriendName}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Terms & Conditions Checkbox */}
 <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => {
                      setTermsAccepted(checked as boolean);
                      if (checked) setShowTermsError(false);
                    }}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-teal-600"
                  />
                  <label htmlFor="terms" className="text-sm">
                    I hereby accepting{" "}
                    <Link 
                      href="/terms-and-conditions" 
                      className="text-primary underline hover:text-teal-700"
                      target="_blank"
                    >
                      Terms & Conditions
                    </Link>{" "}
                    <span className="text-red-500">*</span>
                  </label>
                </div>
                {(showTermsError || (showErrors && errors.terms)) && (
                  <p className="text-red-500 text-sm">
                    {errors.terms ||
                      "I hereby accepting the terms and conditions"}
                  </p>
                )}
              </div>

              {/* Donate Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-teal-700 text-white py-3 text-base font-medium flex items-center justify-center"
              >
                {isLoading ? (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    ></path>
                  </svg>
                ) : (
                  "Donate Now"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
