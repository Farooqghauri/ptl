"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";

export default function AboutAnimation() {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch("/aboutus.json")
      .then((res) => res.json())
      .then(setAnimationData);
  }, []);

  if (!animationData) return null;

  return (
    <div className="w-72 h-72 mx-auto">
      <Lottie
        animationData={animationData}
        loop
        autoplay
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}