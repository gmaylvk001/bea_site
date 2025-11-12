"use client";
import { useState, useEffect } from "react";

import HomeComponent from "@/components/index";


export default function Dashboard() {
  const [time, setTime] = useState(null);

  useEffect(() => {
    setTime(Date.now());
  }, []);

  return (
    <div>
      
      <HomeComponent /> {/* Use the Home component here */}
    </div>
  );
}
