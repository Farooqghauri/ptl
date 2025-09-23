"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";

export default function ServicesAnimation() {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch("/services.json")
      .then((res) => res.json())
      .then(setAnimationData);
  }, []);

  if (!animationData) return null;

  return (
    <div className="w-full flex justify-center items-center mb-8">
      <div className="w-full max-w-3xl h-[300px] md:h-[400px] lg:h-[500px] rounded-5xl overflow-hidden bg-white shadow">
        <Lottie
          animationData={animationData}
          loop
          autoplay
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </div>
  );
}