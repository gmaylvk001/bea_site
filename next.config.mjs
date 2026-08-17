/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/uploads/categories/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/products/:slug",
        destination: "/product/:slug",
        permanent: true,
      },
      {
        source: "/brand",
        destination: "/",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/uploads/:path*.jpg",
        headers: [{ key: "Content-Type", value: "image/jpeg" }],
      },
      {
        source: "/uploads/:path*.jpeg",
        headers: [{ key: "Content-Type", value: "image/jpeg" }],
      },
      {
        source: "/uploads/:path*.png",
        headers: [{ key: "Content-Type", value: "image/png" }],
      },
      {
        source: "/uploads/:path*.webp",
        headers: [{ key: "Content-Type", value: "image/webp" }],
      },
      {
        source: "/uploads/:path*.avif",
        headers: [{ key: "Content-Type", value: "image/avif" }],
      },
    ];
  },
};

export default nextConfig;
