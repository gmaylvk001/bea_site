"use client";
import { useState, useEffect } from "react";

import Productpage from "@/components/product";


export default function Dashboard() {
  const [time, setTime] = useState(null);

  useEffect(() => {
    setTime(Date.now());
  }, []);

  return (
    <div>
      
      <Productpage /> 
    </div>
  );
}
