"use client";

import Image from "next/image";
import { useState, useEffect, useRef, RefObject } from "react";

export default function LawyerPage() {
  const lawyer = {
    name: "Mr. Jawad Bhutta",
    city: "Multan",
    court: "High Court",
    winRatio: "97%",
    image: "/lawyers/jawadbhutta.jpg",
  };

  const [loaded, setLoaded] = useState(false);
  const [paddingBottom, setPaddingBottom] = useState(150);
  const [breakpointKey, setBreakpointKey] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [visibleElements, setVisibleElements] = useState<{ [key: string]: boolean }>({});
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const updatePadding = () => {
      const isMobile = window.innerWidth < 768;
      if (imgRef.current && isMobile) {
        const ratio = imgRef.current.naturalHeight / imgRef.current.naturalWidth;
        setPaddingBottom(ratio * 100);
      } else setPaddingBottom(0);

      setBreakpointKey((prev) => {
        const prevIsDesktop = prev % 2 === 0;
        const currentIsDesktop = !isMobile;
        return prevIsDesktop !== currentIsDesktop ? prev + 1 : prev;
      });
    };

    if (typeof window !== "undefined") {
      updatePadding();
      window.addEventListener("resize", updatePadding);
      return () => window.removeEventListener("resize", updatePadding);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    if (typeof window !== "undefined") {
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const handleImageLoad = () => {
    if (typeof window !== "undefined") {
      const isMobile = window.innerWidth < 768;
      if (imgRef.current && isMobile) {
        const ratio = imgRef.current.naturalHeight / imgRef.current.naturalWidth;
        setPaddingBottom(ratio * 100);
      }
    }
  };

  // --- SEO Content ---
  const seoContent = {
    introduction: `Mr. Jawad Bhutta is a highly respected **High Court lawyer in Multan, Pakistan**, specializing in complex **constitutional law, civil, and criminal matters**. With an impressive win ratio of **97%**, he delivers strategic and results-driven legal representation before the **Lahore High Court Multan Bench** and throughout the judicial districts of **South Punjab**. His expertise as a **top-rated advocate** ensures clients receive the highest level of legal mastery.`,
    specializationsTitle: "Key Areas of Legal Mastery",
    specializations: [
      "**Constitutional Petitions Multan**: Challenging governmental and regulatory actions, and defending fundamental rights under Article 199.",
      "**Property Dispute Lawyer Multan**: Resolving complex land ownership, real estate partition suits, and commercial property conflicts.",
      "**Commercial Litigation Advocate**: High-stakes contract enforcement, shareholder disputes, banking laws, and corporate debt recovery.",
      "**Civil Law Specialist Multan**: Expertise in filing and defending suits for damages, injunctions, specific relief, and inheritance matters.",
      "**Criminal Defense (High Court)**: Handling bail matters, appeals, revisions, and serious criminal litigation at the appellate level.",
      "**Corporate Law & Advisory**: Guiding businesses through regulatory compliance, transactional documentation, and governance issues.",
    ],
    professionalismTitle: "Commitment to Professional Excellence",
    professionalism: [
      "**Client-First Approach**: Ensuring transparent and open communication and personalized strategies tailored to client objectives.",
      "**Ethical Practice**: Upholding the highest standards of integrity, professional conduct, and legal ethics in all court submissions.",
      "**Modern Case Management**: Employing efficient systems for tracking deadlines, organizing complex documentation, and maintaining case momentum.",
      "**Jurisdictional Depth**: Providing expert representation across Multan, Bahawalpur, and Dera Ghazi Khan judicial jurisdictions.",
    ],
    resultsTitle: "Why Clients Choose Mr. Bhutta",
    results: [
      "**Thorough Legal Research**: Every case is backed by exhaustive analysis of relevant statutes, precedents, and legal interpretations.",
      "**Analytical Insight**: Strategic, clear, and comprehensive legal opinions tailored to solve complex and protracted legal challenges.",
      "**Persuasive Advocacy**: Effective and compelling courtroom presence designed to achieve the most favorable judicial outcomes.",
      "**Proven Track Record**: Demonstrated history of success in obtaining favorable judgments in high-stakes civil and constitutional matters.",
    ],
    conclusion: `Clients rely on Mr. Bhutta's comprehensive expertise for reliable, professional legal support in **Multan** and **South Punjab**. As a **Leading High Court Lawyer** and part of **Pakistan Top Lawyers**, he continues to set benchmarks in excellence, integrity, and results-driven advocacy. Contact his chambers for expert legal consultation today.`,
  };

  // Scroll Reveal Hook
  function useScrollReveal<T extends HTMLElement>(id: string): RefObject<T | null> {
    const ref = useRef<T | null>(null);
    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setVisibleElements((prev) => ({ ...prev, [id]: true }));
            }
          });
        },
        { threshold: 0.2 }
      );
      const el = ref.current;
      if (el) observer.observe(el);
      return () => {
        if (el) observer.unobserve(el);
        observer.disconnect();
      };
    }, [id]);
    return ref;
  }

  // List Card with hover shimmer
  const ListCardItem = ({
    item,
    index,
    isNumbered,
    id,
  }: {
    item: string;
    index?: number;
    isNumbered: boolean;
    id: string;
  }) => {
    const ref = useScrollReveal<HTMLLIElement>(id);
    const numberLabel = isNumbered ? index! + 1 : "•";

    return (
      <li
        ref={ref}
        className={`
          relative p-6 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50
          shadow-md flex items-start text-gray-900 text-lg md:text-xl transition-all duration-700
          transform hover:shadow-2xl hover:-translate-y-1
          group overflow-hidden
          ${visibleElements[id] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}
        `}
        style={{ transitionDelay: `${index ? index * 100 : 0}ms` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none animate-shimmer"></div>

        <span
          className={`
            flex-shrink-0 mr-5 font-bold w-10 h-10 flex items-center justify-center rounded-full text-white text-lg md:text-xl
            ${isNumbered ? "bg-indigo-600" : "bg-purple-500"}
          `}
        >
          {numberLabel}
        </span>
        <span className="leading-relaxed relative z-10" dangerouslySetInnerHTML={{ __html: item }} />
      </li>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-start p-4 pt-12">
      {/* FULL-WIDTH Container for Desktop */}
      <div className="w-full bg-white flex flex-col md:flex-row">
        {/* Text Section */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center order-2 md:order-1">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-5 leading-tight tracking-wide drop-shadow-md">
            {lawyer.name}
          </h1>
          <p className="text-xl md:text-3xl font-semibold text-gray-700 mb-3 tracking-wide">
            {lawyer.court} Lawyer — {lawyer.city}
          </p>
          <p className="text-xl md:text-2xl font-bold text-white mb-8 shadow-md px-4 py-2 inline-block rounded-lg bg-indigo-600">
            Win Ratio: {lawyer.winRatio}
          </p>

          <p className="text-gray-800 text-lg md:text-xl leading-relaxed md:leading-loose mb-6">
            {seoContent.introduction}
          </p>

          <hr className="my-4 border-gray-200" />

          <h2 className="text-2xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-4 tracking-wide">
            {seoContent.specializationsTitle}
          </h2>
          <ul className="list-none space-y-6 mb-6">
            {seoContent.specializations.map((item, i) => (
              <ListCardItem key={i} id={`special-${i}`} item={item} index={i} isNumbered={false} />
            ))}
          </ul>

          <hr className="my-4 border-gray-200" />

          <h2 className="text-2xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-4 tracking-wide">
            {seoContent.professionalismTitle}
          </h2>
          <ul className="list-none space-y-6 mb-6">
            {seoContent.professionalism.map((item, i) => (
              <ListCardItem key={i} id={`prof-${i}`} item={item} index={i} isNumbered={false} />
            ))}
          </ul>

          <hr className="my-4 border-gray-200" />

          <h2 className="text-2xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-4 tracking-wide">
            {seoContent.resultsTitle}
          </h2>
          <ol className="list-none space-y-6 mb-6">
            {seoContent.results.map((item, i) => (
              <ListCardItem key={i} id={`res-${i}`} item={item} index={i} isNumbered={true} />
            ))}
          </ol>

          <p className="text-gray-800 text-lg md:text-xl leading-relaxed md:leading-loose">
            {seoContent.conclusion}
          </p>
        </div>

        {/* Image Section */}
        <div className="w-full md:w-1/2 order-1 md:order-2 relative overflow-hidden rounded-3xl">
          <div
            className="relative w-full md:pb-0 md:h-full rounded-3xl overflow-hidden"
            style={{
              paddingBottom: `${paddingBottom}%`,
              transform: `translateY(${scrollY * 0.1}px)`,
              transition: "transform 0.1s ease-out",
            }}
          >
            <Image
              key={lawyer.image + breakpointKey}
              ref={imgRef as RefObject<HTMLImageElement>}
              src={lawyer.image}
              alt={lawyer.name}
              fill
              onLoad={handleImageLoad}
              className={`object-contain object-top sm:object-cover md:object-cover md:rounded-3xl rounded-3xl transition-all duration-800 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] transform hover:scale-105 hover:brightness-110 ${loaded ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
              priority
              sizes="100vw"
            />
          </div>
        </div>
      </div>

      {/* --- Shimmer Animation --- */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0) 100%);
          animation: shimmer 1.2s infinite;
        }
      `}</style>
    </div>
  );
}
