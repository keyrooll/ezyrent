"use client";

import { useEffect } from "react";

/** Buka dialog cetak secara automatik apabila halaman resit dibuka */
export function CetakAutomatik() {
  useEffect(() => {
    window.print();
  }, []);
  return null;
}
