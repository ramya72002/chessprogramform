import React, { useEffect, useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import convertToSubcurrency from "@/lib/convertToSubcurrency";
// import axios from "axios";

interface CheckoutPageProps {
  amount: number;
  formData: {
    parent_first_name: string;
    parent_last_name: string;
    child_first_name: string;
    child_last_name: string;
    child_grade:string;
    email: string;
    phone: string;
    SchoolName:string;
    RequestFinancialAssistance:boolean;
    // Add any other fields you need from formData
  };
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({ amount, formData }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(false);
  // const [showThankYou, setShowThankYou] = useState(false);

  useEffect(() => {
    fetch("/api/create-payment-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        amount: convertToSubcurrency(amount), 
        email: formData.email, 
        phone: formData.phone 
      }),
    })
      .then((res) => res.json())
      .then((data) => setClientSecret(data.clientSecret));
  }, [amount, formData.email, formData.phone]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
  
    if (!stripe || !elements) {
      return;
    }
  
    const { error: submitError } = await elements.submit();
  
    if (submitError) {
      setErrorMessage(submitError.message);
      setLoading(false);
      return;
    }
   
    // Confirm payment
    const result = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: `http://localhost:3000/payment-success?amount=${amount}&redirect_status=succeeded&parent_first_name=${encodeURIComponent(formData.parent_first_name)}&parent_last_name=${encodeURIComponent(formData.parent_last_name)}&child_first_name=${encodeURIComponent(formData.child_first_name)}&child_last_name=${encodeURIComponent(formData.child_last_name)}&child_grade=${encodeURIComponent(formData.child_grade)}&email=${encodeURIComponent(formData.email)}&phone=${encodeURIComponent(formData.phone)}&SchoolName=${encodeURIComponent(formData.SchoolName)}&RequestFinancialAssistance=${formData.RequestFinancialAssistance}`,
      },
    });
  
    // Handle payment result
    if (result.error) {
      setErrorMessage(result.error.message);
      setLoading(false);
      return;
    }
     
   
  };                              
  

  if (!clientSecret || !stripe || !elements) {
    return (
      <div className="flex items-center justify-center">
        <div
          className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white"
          role="status"
        >
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-2 rounded-md">
      {clientSecret && <PaymentElement />}
      {errorMessage && <div>{errorMessage}</div>}
      {/* {showThankYou && <div>Thank you for your payment and form submission!</div>} */}
      <button
        disabled={!stripe || loading}
        className="text-white w-full p-5 bg-black mt-2 rounded-md font-bold disabled:opacity-50 disabled:animate-pulse"
      >
        {!loading ? `Pay $${amount}` : "Processing..."}
      </button>
    </form>
  );
};

export default CheckoutPage;