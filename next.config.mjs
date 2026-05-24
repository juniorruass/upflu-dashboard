/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    "/api/proposals/[id]/send": ["./node_modules/pdfkit/js/data/**/*"],
  },
};

export default nextConfig;
