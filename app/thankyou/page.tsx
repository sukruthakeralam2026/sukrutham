"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import axios from "axios";
import toast from "react-hot-toast";

type PaymentDetails = {
  payment_gateway: string;
  payment_status: string;
  sbiepay_ref_id?: string | null;
  phonepe_order_id?: string | null;
};

type Donation = {
  order_id: string;
  full_name: string;
  amount: number;
  status: string;
  need_g80_certificate: boolean;
  payment_details: PaymentDetails;
};

function ThankYouContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const certificateRef = useRef<HTMLDivElement>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [donationStatus, setDonationStatus] = useState<Donation | null>(null);
  const [orderId, setOrderId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState("pending");
  const [collectedAmount, setCollectedAmount] = useState(0);
  // const [paymentUrl, setPaymentUrl] = useState("");

  useEffect(() => {
    const order_id = searchParams.get("order_id");
    const message = searchParams.get("message");

    if (!order_id) {
      if (message) {
        toast.error(message);
      } else {
        toast.error("Unable to fetch payment status.");
      }
      router.push(`/`);
      return;
    }
    setOrderId(order_id);
    fetchPaymentStatus(order_id);
    fetchCollectedAmount();
  }, [searchParams]);

  const fetchCollectedAmount = () => {
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/api/donation/total_amount`, {})
      .then((response) => {
        if (response.data) {
          setCollectedAmount(
            Math.round((response.data.total_donation_amount / 10000000) * 100) /
              100
          );
        }
      })
      .catch((error) => {
        console.error("Error fetching collected amount:", error);
      });
  };

  const fetchPaymentStatus = (order_id: string) => {
    setIsLoading(true);
    axios
      .get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/donation/status/${order_id}`,
        {}
      )
      .then((response) => {
        setIsLoading(false);
        if (response.data) {
          if (localStorage.getItem("pending_order_id"))
            localStorage.removeItem("pending_order_id");

          setDonationStatus(response.data);
          setIsLoading(false);
          setStatus(response.data?.payment_details.payment_status);
          if (
            response.data?.payment_details.payment_status == "completed" ||
            response.data?.payment_details.payment_status == "success"
          ) {
            toast.success("Your payment is successful!");
            const completedOrderIds = localStorage.getItem(
              "completed_order_ids"
            );
            if (completedOrderIds) {
              const ids = JSON.parse(completedOrderIds);
              if (!ids.includes(response.data.merchant_order_id)) {
                ids.push(response.data.merchant_order_id);
                localStorage.setItem(
                  "completed_order_ids",
                  JSON.stringify(ids)
                );
              }
            } else {
              localStorage.setItem(
                "completed_order_ids",
                JSON.stringify([response.data.merchant_order_id])
              );
            }
          } else if (
            response.data?.payment_details.payment_status == "failed" ||
            response.data?.payment_details.payment_status == "expired"
          ) {
            toast.error("Your payment has failed. Please try again.");
          } else if (
            response.data?.payment_details.payment_status == "pending"
          ) {
            // if (response.data?.payment_details.is_payment_url_expired == false)
            //   setPaymentUrl(response.data?.payment_details.payment_url);
            localStorage.setItem("pending_order_id", order_id);
            toast.error(
              "Your payment is still pending. Please complete the payment. If already done, please refresh the page.",
              {
                icon: "⏳",
              }
            );
          }
        } else {
          toast.error(
            "There was an issue with your payment status. Please refresh the page."
          );
        }
      })
      .catch((error) => {
        localStorage.setItem("pending_order_id", order_id);
        setIsLoading(false);
        toast.error("Error fetching your payment status please try again");
      });
  };

  const targetAmount = 100;

  const copyDonationLink = async () => {
    try {
      await navigator.clipboard.writeText("https://donate.sukruthakeralam.com");
      setCopySuccess(true);
      // Hide success message after 3 seconds
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (error) {
      console.error("Failed to copy link:", error);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = "https://donate.sukruthakeralam.com";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
      } catch (fallbackError) {
        console.error("Fallback copy failed:", fallbackError);
      }
      document.body.removeChild(textArea);
    }
  };

  const downloadCertificate = async () => {
    if (certificateRef.current) {
      try {
        // Create canvas from the certificate section using html2canvas-pro
        const canvas = await html2canvas(certificateRef.current, {
          useCORS: true,
          allowTaint: false,
          backgroundColor: "#ffffff",
          scale: 2, // Higher resolution for better quality
          logging: false,
          ignoreElements: (element) => {
            // Ignore elements that might cause issues
            return element.tagName === "SCRIPT" || element.tagName === "STYLE";
          },
        });

        // Create PDF
        const imgData = canvas.toDataURL("image/png", 1.0);
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        // Calculate dimensions to fit the page
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;

        // Scale to fit within page margins
        const maxWidth = pdfWidth - 20; // 10mm margin on each side
        const maxHeight = pdfHeight - 20; // 10mm margin top and bottom

        const ratio = Math.min(
          maxWidth / (imgWidth * 0.75),
          maxHeight / (imgHeight * 0.75)
        );
        const scaledWidth = imgWidth * 0.75 * ratio;
        const scaledHeight = imgHeight * 0.75 * ratio;

        const imgX = (pdfWidth - scaledWidth) / 2;
        const imgY = 10;

        pdf.addImage(imgData, "PNG", imgX, imgY, scaledWidth, scaledHeight);

        // Download the PDF
        pdf.save(`Sukrutha_Kerala_Certificate_${orderId}.pdf`);
      } catch (error) {
        console.error("Error generating certificate:", error);
        toast.error("Error generating certificate. Please try again.");
      }
    }
  };

  return isLoading ? (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
      <div className="text-center">
        <div className="loader mb-4"></div>
        <div className="flex justify-center">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-teal-500 rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  ) : status == "completed" || status == "success" ? (
    <div className=" bg-gray-50 ">
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-6 overflow-scroll ">
        {/* certificate section */}
        <div className="bg-white rounded-3xl shadow-lg p-12 max-w-7xl w-full mx-auto border border-gray-200 overflow-y-scroll">
          <div ref={certificateRef} className="p-8">
            <div className="flex justify-center mb-1">
              <Image
                src="/images/thankyouimage.avif"
                alt="Community celebration"
                width={300}
                height={200}
                className="rounded-lg"
              />
            </div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
                Because of you, we are one step closer to
                <br />
                our goal of transforming Kerala. Thank you
                <br />
                for being a hero to our communities.
              </h2>
              <p className="text-gray-600 text-sm">
                Thank you, {donationStatus?.full_name}! Your generosity is
                <br />
                creating a ripple effect of positive change in Kerala.
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 font-medium">Donor Name:</span>
                <span className="text-gray-900 font-semibold">
                  {donationStatus?.full_name}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 font-medium">
                  Payment Amount:
                </span>
                <span className="text-gray-900 font-semibold">
                  {donationStatus?.amount}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 font-medium">
                  Transaction ID:
                </span>
                <span className="text-gray-900 font-semibold">
                  {donationStatus?.order_id}
                </span>
              </div>
            </div>
          </div>
          {/* certificate end */}

          <div className="mb-8">
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-gray-900 font-semibold mb-4">
                Donation Progress So Far
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-teal-600 font-medium">
                    {collectedAmount} Cr Collected
                  </span>
                  <span className="text-gray-600">
                    Target: {targetAmount}Cr
                  </span>
                </div>
                <Progress
                  value={(collectedAmount / targetAmount) * 100}
                  className="h-2"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 mb-8">
            <Button
              onClick={copyDonationLink}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium"
            >
              Ask Others To Donate
            </Button>
            {/* {wantsCertificate && ( */}
            <Button
              onClick={downloadCertificate}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg font-medium"
            >
              Download Certificate
            </Button>
            {/* )} */}
          </div>

          {/* Copy Success Message */}
          {copySuccess && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg text-center">
              <div className="flex items-center justify-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">
                  Donation link copied successfully! Share with others to spread
                  the impact.
                </span>
              </div>
            </div>
          )}

          <div className="text-center text-sm text-gray-600 space-y-2">
            {donationStatus?.need_g80_certificate && (
              <p>
                80(G) Certificate: Your request for an 80(G) certificate has
                been received. You will
                <br />
                be contacted shortly for the necessary details.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {status === "failed" ? "Payment Failed" : "Payment Status Pending"}
        </h2>
        <p className="text-gray-600 mb-4">
          {status === "failed"
            ? "Your payment could not be processed. Please try again."
            : "Your payment status is still pending. Please refresh the page to check again."}
        </p>
        {orderId && (
          <p className="text-gray-600 mb-4">
            Order ID: <span className="font-semibold">{orderId}</span>
          </p>
        )}
        <Button
          onClick={() => fetchPaymentStatus(orderId)}
          className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-lg font-medium"
        >
          Refresh
        </Button>
        {/* {paymentUrl ? (
          <div className="flex flex-col items-center gap-4 mt-5">
            <p>
              <a
                href={paymentUrl}
                className="underline text-blue-400 cursor-pointer"
              >
                Go back to payment page
              </a>
            </p>
          </div>
        ) : ( */}
        <div className="flex flex-col items-center gap-4 mt-5">
          <p>
            <a
              href=""
              onClick={(e) => {
                e.preventDefault();
                localStorage.removeItem("pending_order_id");
                router.push("/");
              }}
              className="underline text-blue-400 cursor-pointer"
            >
              Go back to home page
            </a>
          </p>
        </div>
        {/* )} */}
      </div>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ThankYouContent />
    </Suspense>
  );
}
