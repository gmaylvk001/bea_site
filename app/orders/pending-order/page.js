"use client";
import { useState, useEffect } from "react";

import ShippedOrders from "../components/shipping/shipping";


export default function Dashboard() {
  const [time, setTime] = useState(null);

  useEffect(() => {
    setTime(Date.now());
  }, []);

  return (
    <div>
      
      <ShippedOrders /> {/* Use the order component here */}
    </div>
  );
}
