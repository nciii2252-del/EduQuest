export const INFORMATIKA_TOPICS = [
  "Pengertian Pemrograman",
  "Bahasa Pemrograman",
  "Pengenalan Python",
  "Variabel Python",
] as const;

export type InformatikaTopic = typeof INFORMATIKA_TOPICS[number];
