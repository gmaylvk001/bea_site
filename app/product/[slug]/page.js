

import ProductClient from "./ProductClient"; 
import { redirect } from "next/navigation"; // ✅ add this

//import { useParams } from "next/navigation";

export async function generateMetadata({ params  }) {
  const slug = params.slug;

  // Always use absolute URL
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(`${baseUrl}/api/product/${slug}`, {
    // Disable caching so metadata is always fresh
    cache: "no-store",
  });

  // if (!response.ok) {
  //   console.error("Metadata fetch failed:", response.status);
  //   return {
  //     title: "Product not found",
  //   };
  // }

  if (!response.ok) {
    console.error("Metadata fetch failed:", response.status);
    // Redirect to home page if product not found (404 or other error)
    redirect("/404"); // ✅ this immediately redirects to home page
  }


  

  const data = await response.json();
  console.log("Fetched product for metadata:", `${baseUrl}/product/${slug}`);

  return {
  title: data.name,
  openGraph: {
    title: data.name,
    description: 'Buy Now ' + data.name,
    images: [`${baseUrl}/uploads/products/${data.images[0]}`],
    url: `${baseUrl}/product/${slug}`,
    type: "website",
  },
}
}

/*
export const metadata = {
  title: 'new product',
  openGraph: {
    title: 'new product',
    description: 'new product',
    images: ['https://sathyamobiles.com/img/product/oIPmpsryJ0DW1wrF.jpg'],
    url: 'https://bea.divinfosys.com/newme2',
    type: "website",
  },
}
  */

export default function ProductNew({ currentProductId }) {
  //const product = await getProductById(params.id);
  //console.log("Server-side Product ID:", currentProductId); 

  return <ProductClient currentProductId={currentProductId} />;
}



 /*
export default function ProductPage(currentProductId) {

  console.log("Server-side Product ID:", currentProductId);
  return (
    <main>
      <h1>product lastest</h1>
    </main>
  )
}
  */