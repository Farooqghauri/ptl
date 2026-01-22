"use client";

import { useState } from "react";
import { 
  Check, 
  X, 
  Zap, 
  Crown, 
  Building,
  MessageCircle,
  Mail,
  Scale,
  FileText,
  Languages,
  Search,
  Sparkles
} from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  const plans = [
    {
      name: "Free",
      price: "0",
      priceYearly: "0",
      currency: "Rs",
      description: "Try our AI tools for free. Best for students and new lawyers.",
      icon: Zap,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
      borderColor: "border-gray-200",
      buttonStyle: "bg-gray-900 hover:bg-gray-800 text-white",
      popular: false,
      features: [
        { text: "5 queries per day", included: true },
        { text: "Case Summarizer", included: true },
        { text: "Legal Research (limited)", included: true },
        { text: "Legal Drafter", included: false },
        { text: "Legal Translator", included: false },
        { text: "Priority Support", included: false },
        { text: "Download as Word/PDF", included: false },
      ],
    },
    {
      name: "Basic",
      price: "500",
      priceYearly: "5,000",
      currency: "Rs",
      description: "For practicing lawyers who need daily legal assistance.",
      icon: Scale,
      color: "text-[#E85D2A]",
      bgColor: "bg-[#E85D2A]/10",
      borderColor: "border-[#E85D2A]",
      buttonStyle: "bg-[#E85D2A] hover:bg-[#d14f1f] text-white",
      popular: true,
      features: [
        { text: "50 queries per day", included: true },
        { text: "Case Summarizer", included: true },
        { text: "Legal Research (full)", included: true },
        { text: "Legal Drafter", included: true },
        { text: "Legal Translator", included: true },
        { text: "Email Support", included: true },
        { text: "Download as Word/PDF", included: true },
      ],
    },
    {
      name: "Pro",
      price: "800",
      priceYearly: "8,000",
      currency: "Rs",
      description: "For busy lawyers and small law firms who need more power.",
      icon: Crown,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      borderColor: "border-purple-300",
      buttonStyle: "bg-purple-600 hover:bg-purple-700 text-white",
      popular: false,
      features: [
        { text: "Unlimited queries", included: true },
        { text: "Case Summarizer", included: true },
        { text: "Legal Research (full)", included: true },
        { text: "Legal Drafter", included: true },
        { text: "Legal Translator", included: true },
        { text: "Priority WhatsApp Support", included: true },
        { text: "Download as Word/PDF", included: true },
      ],
    },
  ];

  const enterprisePlan = {
    name: "Unlimited / Enterprise",
    description: "For large law firms, corporate legal teams, and organizations who need custom solutions.",
    features: [
      "Unlimited users",
      "Custom AI training on your documents",
      "API access",
      "Dedicated account manager",
      "Custom integrations",
      "On-premise deployment option",
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-slate-50">
      {/* Hero Section */}
      <div className="pt-16 pb-12 px-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 bg-[#E85D2A]/10 text-[#E85D2A]">
          <Sparkles className="w-4 h-4" />
          Simple Pricing
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          Choose Your <span className="text-[#E85D2A]">Plan</span>
        </h1>
        
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Start free, upgrade when you need more. All plans include access to Pakistan&apos;s 
          largest legal database with 3,340+ law sections and 78+ court judgments.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-sm font-medium ${!isYearly ? "text-gray-900" : "text-gray-500"}`}>
            Monthly
          </span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              isYearly ? "bg-[#E85D2A]" : "bg-gray-300"
            }`}
          >
            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              isYearly ? "translate-x-8" : "translate-x-1"
            }`} />
          </button>
          <span className={`text-sm font-medium ${isYearly ? "text-gray-900" : "text-gray-500"}`}>
            Yearly
            <span className="ml-2 text-xs text-green-600 font-semibold">Save 17%</span>
          </span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border-2 bg-white p-6 transition-all hover:shadow-xl ${
                plan.popular 
                  ? `${plan.borderColor} shadow-lg` 
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 bg-[#E85D2A] text-white text-sm font-semibold rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${plan.bgColor} mb-4`}>
                  <plan.icon className={`w-7 h-7 ${plan.color}`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              </div>

              {/* Price */}
              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-2xl font-bold text-gray-900">{plan.currency}</span>
                  <span className="text-5xl font-bold text-gray-900">
                    {isYearly ? plan.priceYearly : plan.price}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {isYearly ? "per year" : "per month"}
                </p>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 text-center mb-6">
                {plan.description}
              </p>

              {/* CTA Button */}
              <Link href="/sign-up">
                <button className={`w-full py-3 rounded-xl font-semibold transition-all ${plan.buttonStyle}`}>
                  {plan.price === "0" ? "Start Free" : "Get Started"}
                </button>
              </Link>

              {/* Features */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${feature.included ? "text-gray-700" : "text-gray-400"}`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Enterprise Plan */}
        <div className="rounded-2xl border-2 border-gray-200 bg-white p-8 hover:shadow-xl transition-all">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center">
                  <Building className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{enterprisePlan.name}</h3>
                </div>
              </div>
              <p className="text-gray-600 mb-6">{enterprisePlan.description}</p>
              
              <div className="grid sm:grid-cols-2 gap-3">
                {enterprisePlan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="lg:w-auto w-full">
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <p className="text-gray-600 mb-4">Contact us for custom pricing</p>
                <div className="space-y-3">
                  <a 
                    href="https://wa.me/923001234567" 
                    target="_blank"
                    className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all"
                  >
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp
                  </a>
                  <a 
                    href="mailto:contact@ptl.com"
                    className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold transition-all"
                  >
                    <Mail className="w-5 h-5" />
                    Email Us
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Comparison */}
      <div className="bg-white border-t border-gray-200 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            What&apos;s Included
          </h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
            All plans give you access to our AI-powered legal tools built specifically for Pakistani lawyers.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-xl bg-blue-50 border border-blue-100">
              <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Case Summarizer</h3>
              <p className="text-sm text-gray-600">
                Upload 50-page judgments, get 1-page summary. Save hours of reading.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-orange-50 border border-orange-100">
              <div className="w-12 h-12 rounded-xl bg-[#E85D2A] flex items-center justify-center mb-4">
                <Scale className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Legal Drafter</h3>
              <p className="text-sm text-gray-600">
                Generate Bail Petitions, Legal Notices, Writ Petitions in minutes.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-green-50 border border-green-100">
              <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center mb-4">
                <Languages className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Legal Translator</h3>
              <p className="text-sm text-gray-600">
                English to Urdu, Urdu to English with correct legal terminology.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-amber-50 border border-amber-100">
              <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Legal Research</h3>
              <p className="text-sm text-gray-600">
                Search PPC, CrPC, CPC sections and Supreme Court judgments.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Common Questions
          </h2>

          <div className="space-y-4">
            {[
              {
                q: "How do I pay?",
                a: "Contact us on WhatsApp or Email. We accept JazzCash, EasyPaisa, and Bank Transfer. After payment, your account will be upgraded within 1 hour."
              },
              {
                q: "Can I try before buying?",
                a: "Yes! The Free plan lets you use Case Summarizer and Legal Research with 5 queries per day. No credit card needed."
              },
              {
                q: "What if I need more queries?",
                a: "Upgrade to Basic (50/day) or Pro (unlimited). You can upgrade anytime from your dashboard."
              },
              {
                q: "Is my data safe?",
                a: "Yes. We do not store your documents. All processing is done in real-time and deleted after. We follow strict privacy rules."
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes. No lock-in contracts. Cancel anytime and you won't be charged for the next month."
              },
            ].map((faq, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-[#E85D2A] py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Save Time?
          </h2>
          <p className="text-orange-100 mb-8">
            Join 150+ Pakistani lawyers already using PTL. Start free today.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/sign-up">
              <button className="px-8 py-4 bg-white text-[#E85D2A] rounded-xl font-bold hover:shadow-lg transition-all">
                Start Free Now
              </button>
            </Link>
            <Link href="/contact">
              <button className="px-8 py-4 border-2 border-white text-white rounded-xl font-bold hover:bg-white/10 transition-all">
                Contact Sales
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}