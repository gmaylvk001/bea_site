"use client";
import { useState, useEffect } from "react";

import CategoryComponent from "@/components/category/[slug]/[sub_slug]/[sub_slug_one]/page";


export default function Dashboard({ params }) {
  const [time, setTime] = useState(null);

  useEffect(() => {
    setTime(Date.now());
  }, []);

  return (
    <div>
      
      <CategoryComponent params={params} /> {/* Use the category component here */}
    </div>
  );
}