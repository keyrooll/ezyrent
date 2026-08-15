/** Senarai negeri Malaysia untuk dropdown alamat hartanah */
export const NEGERI_MALAYSIA = [
  "Johor",
  "Kedah",
  "Kelantan",
  "Melaka",
  "Negeri Sembilan",
  "Pahang",
  "Perak",
  "Perlis",
  "Pulau Pinang",
  "Sabah",
  "Sarawak",
  "Selangor",
  "Terengganu",
  "Wilayah Persekutuan",
] as const;

export type Negeri = (typeof NEGERI_MALAYSIA)[number];
