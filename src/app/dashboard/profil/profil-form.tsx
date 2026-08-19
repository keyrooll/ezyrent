"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { kemaskiniProfil, muatNaikAvatar, type HasilProfil } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const awalan: HasilProfil = {};

export function ProfilForm({
  id,
  nama,
  email,
  telefon,
  avatarUrl,
  ialahStaf,
  kecemasan,
  pending,
}: {
  id: string;
  nama: string;
  email: string;
  telefon: string;
  avatarUrl: string | null;
  ialahStaf: boolean;
  kecemasan: { nama: string; telefon: string; alamat: string; hubungan: string };
  pending: {
    nama: string;
    telefon: string | null;
    emergency_contact: string | null;
    emergency_phone: string | null;
    emergency_address: string | null;
    emergency_relationship: string | null;
  } | null;
}) {
  const router = useRouter();
  const [hasilProfil, dispatchProfil, menungguProfil] = useActionState(kemaskiniProfil, awalan);
  const [hasilAvatar, dispatchAvatar, menungguAvatar] = useActionState(muatNaikAvatar, awalan);

  useEffect(() => {
    if (hasilProfil?.berjaya && !menungguProfil) {
      toast.success(
        ialahStaf ? "Permohonan dihantar untuk kelulusan tuan rumah" : "Profil dikemaskini"
      );
      router.refresh();
    }
  }, [hasilProfil, menungguProfil, router, ialahStaf]);

  useEffect(() => {
    if (hasilAvatar?.berjaya && !menungguAvatar) {
      toast.success("Gambar profil dikemaskini");
      router.refresh();
    }
  }, [hasilAvatar, menungguAvatar, router]);

  return (
    <div className="space-y-6">
      {/* Gambar profil */}
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

      {/* Maklumat akaun */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Maklumat Akaun</CardTitle>
        </CardHeader>
        <CardContent>
          {ialahStaf && pending && (
            <div className="mb-4 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
              <p className="font-semibold text-amber-700">Menunggu Kelulusan</p>
              <p className="text-amber-700/90">
                Perubahan profil anda sedang menunggu kelulusan tuan rumah:
              </p>
              <ul className="mt-1 list-inside list-disc text-amber-800">
                <li>Nama: {pending.nama}</li>
                {pending.telefon && <li>Telefon: {pending.telefon}</li>}
                {pending.emergency_contact && (
                  <li>Kontak Kecemasan: {pending.emergency_contact}</li>
                )}
              </ul>
            </div>
          )}
          <form action={dispatchProfil} className="space-y-4">
            {hasilProfil?.ralat && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {hasilProfil.ralat}
              </p>
            )}
            <fieldset disabled={!!pending} className="space-y-4">
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

              {ialahStaf && (
                <div className="space-y-4 rounded-md border px-4 py-3">
                  <p className="text-sm font-semibold">Kontak Kecemasan</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="namaKecemasan">Nama Kontak</Label>
                      <Input
                        id="namaKecemasan"
                        name="namaKecemasan"
                        defaultValue={kecemasan.nama}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefonKecemasan">No. Telefon</Label>
                      <Input
                        id="telefonKecemasan"
                        name="telefonKecemasan"
                        defaultValue={kecemasan.telefon}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hubungan">Hubungan</Label>
                      <Input id="hubungan" name="hubungan" defaultValue={kecemasan.hubungan} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="alamatKecemasan">Alamat</Label>
                      <Input
                        id="alamatKecemasan"
                        name="alamatKecemasan"
                        defaultValue={kecemasan.alamat}
                      />
                    </div>
                  </div>
                </div>
              )}

              <Button type="submit" disabled={menungguProfil || !!pending}>
                {menungguProfil ? "Menyimpan..." : ialahStaf ? "Hantar Untuk Kelulusan" : "Simpan Perubahan"}
              </Button>
            </fieldset>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
