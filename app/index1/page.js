"use client";
import { useState, useEffect } from "react";

import HomeComponent1 from "@/components/index1";


export default function Dashboard() {
  const [time, setTime] = useState(null);

  useEffect(() => {
    setTime(Date.now());
  }, []);

  return (
    <div>
      
      <HomeComponent1 /> {/* Use the Home component here */}
    </div>
  );
}
