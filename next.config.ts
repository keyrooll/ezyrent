import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Benarkan akses dev melalui 127.0.0.1 & IP LAN (telefon, dsb.)
  // Next.js dev menyekat origin lain daripada localhost secara default
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
