"use server";

import { revalidatePath } from "next/cache";
import { MaintenanceStatus } from "@prisma/client";
import { ubahStatusAduan } from "../actions";

/** Wrapper untuk <form action> — status & id dibawa dalam medan tersembunyi */
export async function ubahStatusForm(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as MaintenanceStatus;
  if (!id || !status) return;
  await ubahStatusAduan(id, status);
  revalidatePath(`/dashboard/maintenance/${id}`);
  revalidatePath("/dashboard/maintenance");
}
