"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { kemaskiniProfilPenyewa, muatNaikAvatarPenyewa, type HasilProfil } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const awalan: HasilProfil = {};

type Permohonan = {
  nama: string;
  telefon: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  emergency_address: string | null;
  emergency_relationship: string | null;
} | null;

export function ProfilFormPenyewa({
  id,
  nama,
  email,
  telefon,
  avatarUrl,
  emergencyContact,
  emergencyPhone,
  emergencyAddress,
  emergencyRelationship,
  pending,
}: {
  id: string;
  nama: string;
  email: string;
  telefon: string;
  avatarUrl: string | null;
  emergencyContact: string;
  emergencyPhone: string;
  emergencyAddress: string;
  emergencyRelationship: string;
  pending: Permohonan;
}) {
  const router = useRouter();
  const [hasilProfil, dispatchProfil, menungguProfil] = useActionState(kemaskiniProfilPenyewa, awalan);
  const [hasilAvatar, dispatchAvatar, menungguAvatar] = useActionState(muatNaikAvatarPenyewa, awalan);

  useEffect(() => {
    if (hasilProfil?.berjaya && !menungguProfil) {
      toast.success("Permohonan dihantar untuk kelulusan tuan rumah");
      router.refresh();
    }
  }, [hasilProfil, menungguProfil, router]);

  useEffect(() => {
    if (hasilAvatar?.berjaya && !menungguAvatar) {
      toast.success("Gambar profil dikemaskini");
      router.refresh();
    }
  }, [hasilAvatar, menungguAvatar, router]);

  return (
    <div className="space-y-6">
      {pending && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
          <p className="font-semibold text-amber-700">Menunggu Kelulusan</p>
          <p className="text-amber-700/90">
            Perubahan profil anda sedang menunggu kelulusan tuan rumah:
          </p>
          <ul className="mt-1 list-inside list-disc text-amber-800">
            <li>Nama: {pending.nama}</li>
            {pending.telefon && <li>Telefon: {pending.telefon}</li>}
            {pending.emergency_contact && (
              <li>
                Kontak kecemasan: {pending.emergency_contact}
                {pending.emergency_phone && ` (${pending.emergency_phone})`}
                {pending.emergency_relationship && ` • ${pending.emergency_relationship}`}
                {pending.emergency_address && ` • ${pending.emergency_address}`}
              </li>
            )}
          </ul>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gambar Profil</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/v1/avatar/${id}`}
              alt=""
              className="size-20 rounded-full object-cover ring-1 ring-border"
            />
          ) : (
            <span className="flex size-20 items-center justify-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground">
              {nama.charAt(0).toUpperCase()}
            </span>
          )}
          <form action={dispatchAvatar} className="space-y-2">
            {hasilAvatar?.ralat && (
              <p className="text-xs text-destructive">{hasilAvatar.ralat}</p>
            )}
            <Input type="file" name="gambar" accept="image/jpeg,image/png,image/webp" className="h-8 w-auto max-w-60 text-xs" required />
            <Button type="submit" size="sm" variant="outline" disabled={menungguAvatar}>
              {menungguAvatar ? "Memuat naik..." : "Tukar Gambar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <form action={dispatchProfil} className="space-y-6">
        {hasilProfil?.ralat && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {hasilProfil.ralat}
          </p>
        )}
        <fieldset disabled={!!pending} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Maklumat Akaun</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nama">Nama Penuh</Label>
                <Input id="nama" name="nama" defaultValue={nama} required />
                {hasilProfil?.medan?.nama && (
                  <p className="text-xs text-destructive">{hasilProfil.medan.nama}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mel (tidak boleh ditukar)</Label>
                <Input id="email" value={email} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefon">No. Telefon</Label>
                <Input id="telefon" name="telefon" defaultValue={telefon} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kontak Kecemasan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact">Nama</Label>
                  <Input id="emergency_contact" name="emergency_contact" defaultValue={emergencyContact} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_phone">No. Telefon</Label>
                  <Input id="emergency_phone" name="emergency_phone" defaultValue={emergencyPhone} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_relationship">Hubungan</Label>
                  <Input
                    id="emergency_relationship"
                    name="emergency_relationship"
                    placeholder="cth: Ibu, Abang, Rakan"
                    defaultValue={emergencyRelationship}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_address">Alamat</Label>
                  <Input id="emergency_address" name="emergency_address" defaultValue={emergencyAddress} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={menungguProfil || !!pending}>
            {menungguProfil ? "Menyimpan..." : "Hantar Untuk Kelulusan"}
          </Button>
        </fieldset>
      </form>
    </div>
  );
}
