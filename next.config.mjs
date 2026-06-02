/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    "/api/proposals/[id]/send": ["./node_modules/pdfkit/js/data/**/*"],
  },
  async headers() {
    return [
      {
        source: "/sw-portal.js",
        headers: [
          { key: "Service-Worker-Allowed", value: "/" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
