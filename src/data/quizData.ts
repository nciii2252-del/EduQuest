export interface Question {
  id: number | string;
  text: string;
  options: string[];
  correctAnswer: number;
}

export interface QuizData {
  id: number | string;
  title: string;
  subject: string;
  questions: Question[];
  timePerQuestion: number;
  xpReward: number;
}

export const quizzes: QuizData[] = [
  {
    id: 1,
    title: "Quiz Pengertian Pemrograman",
    subject: "Pengertian Pemrograman",
    timePerQuestion: 30,
    xpReward: 300,
    questions: [
      { id: 1, text: "Apa yang dimaksud dengan pemrograman?", options: ["Proses memperbaiki komputer", "Proses menulis instruksi agar komputer melakukan tugas", "Belajar mengetik cepat", "Mendesain hardware"], correctAnswer: 1 },
      { id: 2, text: "Orang yang menulis program komputer disebut?", options: ["Designer", "Programmer", "Operator", "Teknisi"], correctAnswer: 1 },
      { id: 3, text: "Kumpulan instruksi yang dijalankan komputer disebut?", options: ["Program", "Hardware", "Mouse", "Layar"], correctAnswer: 0 },
      { id: 4, text: "Tujuan utama dari pemrograman adalah?", options: ["Menghias komputer", "Menyelesaikan masalah dengan bantuan komputer", "Membuat komputer rusak", "Mengganti sistem operasi"], correctAnswer: 1 },
      { id: 5, text: "Langkah-langkah berurutan untuk menyelesaikan masalah disebut?", options: ["Variabel", "Algoritma", "Sintaks", "Bug"], correctAnswer: 1 },
      { id: 6, text: "Kesalahan dalam program disebut?", options: ["Error/Bug", "Fitur", "Update", "Install"], correctAnswer: 0 },
      { id: 7, text: "Proses memperbaiki kesalahan dalam program disebut?", options: ["Coding", "Debugging", "Compiling", "Testing"], correctAnswer: 1 },
      { id: 8, text: "Manakah yang BUKAN tahapan dalam pemrograman?", options: ["Analisis masalah", "Membuat algoritma", "Menulis kode", "Mengecat komputer"], correctAnswer: 3 },
    ],
  },
  {
    id: 2,
    title: "Quiz Bahasa Pemrograman",
    subject: "Bahasa Pemrograman",
    timePerQuestion: 25,
    xpReward: 250,
    questions: [
      { id: 1, text: "Bahasa pemrograman adalah?", options: ["Bahasa untuk berbicara dengan teman", "Bahasa untuk memberi instruksi ke komputer", "Bahasa asing", "Bahasa isyarat"], correctAnswer: 1 },
      { id: 2, text: "Berikut adalah bahasa pemrograman, KECUALI?", options: ["Python", "JavaScript", "HTML", "Microsoft Word"], correctAnswer: 3 },
      { id: 3, text: "Bahasa tingkat tinggi (high-level language) lebih mudah dipahami oleh?", options: ["Komputer", "Manusia", "Robot", "Internet"], correctAnswer: 1 },
      { id: 4, text: "Proses menerjemahkan kode program ke bahasa mesin disebut?", options: ["Debugging", "Kompilasi", "Eksekusi", "Instalasi"], correctAnswer: 1 },
      { id: 5, text: "Bahasa pemrograman yang dijalankan baris demi baris tanpa kompilasi disebut?", options: ["Compiled language", "Interpreted language", "Markup language", "Query language"], correctAnswer: 1 },
      { id: 6, text: "Python termasuk bahasa pemrograman?", options: ["Compiled", "Interpreted", "Markup", "Query"], correctAnswer: 1 },
      { id: 7, text: "Bahasa mesin (machine language) terdiri dari?", options: ["Huruf A-Z", "Angka 0 dan 1 (biner)", "Simbol matematika", "Bahasa Inggris"], correctAnswer: 1 },
      { id: 8, text: "Berikut adalah contoh bahasa tingkat tinggi, KECUALI?", options: ["Python", "Java", "C++", "Bahasa Mesin"], correctAnswer: 3 },
    ],
  },
  {
    id: 3,
    title: "Quiz Pengenalan Python",
    subject: "Pengenalan Python",
    timePerQuestion: 25,
    xpReward: 250,
    questions: [
      { id: 1, text: "Siapakah pencipta bahasa Python?", options: ["Bjarne Stroustrup", "Guido van Rossum", "Dennis Ritchie", "James Gosling"], correctAnswer: 1 },
      { id: 2, text: "Python pertama kali dirilis pada tahun?", options: ["1985", "1991", "2000", "2010"], correctAnswer: 1 },
      { id: 3, text: "Ekstensi file Python adalah?", options: [".py", ".python", ".pt", ".p"], correctAnswer: 0 },
      { id: 4, text: "Perintah untuk menampilkan teks di Python adalah?", options: ["echo()", "print()", "display()", "write()"], correctAnswer: 1 },
      { id: 5, text: "Apa output dari: print(\"Halo Dunia\")?", options: ["Halo", "Dunia", "Halo Dunia", "Error"], correctAnswer: 2 },
      { id: 6, text: "Simbol yang digunakan untuk membuat komentar satu baris di Python adalah?", options: ["//", "#", "/*", "--"], correctAnswer: 1 },
      { id: 7, text: "Python termasuk bahasa pemrograman yang?", options: ["Sulit dipelajari", "Mudah dibaca dan dipelajari", "Hanya untuk web", "Hanya untuk game"], correctAnswer: 1 },
      { id: 8, text: "Berikut adalah kegunaan Python, KECUALI?", options: ["Data Science", "Web Development", "Artificial Intelligence", "Membuat hardware"], correctAnswer: 3 },
    ],
  },
  {
    id: 4,
    title: "Quiz Variabel Python",
    subject: "Variabel Python",
    timePerQuestion: 25,
    xpReward: 250,
    questions: [
      { id: 1, text: "Apa itu variabel di Python?", options: ["Sebuah fungsi", "Wadah untuk menyimpan nilai/data", "Sebuah error", "Sebuah loop"], correctAnswer: 1 },
      { id: 2, text: "Cara mendeklarasikan variabel di Python yang benar adalah?", options: ["var x = 5", "int x = 5", "x = 5", "let x = 5"], correctAnswer: 2 },
      { id: 3, text: "Tipe data dari: x = \"Halo\" adalah?", options: ["Integer", "Float", "String", "Boolean"], correctAnswer: 2 },
      { id: 4, text: "Tipe data dari: x = 3.14 adalah?", options: ["Integer", "Float", "String", "Boolean"], correctAnswer: 1 },
      { id: 5, text: "Tipe data dari: x = True adalah?", options: ["Integer", "String", "Boolean", "Float"], correctAnswer: 2 },
      { id: 6, text: "Apa output dari: x = 5; y = 3; print(x + y)?", options: ["53", "8", "5+3", "Error"], correctAnswer: 1 },
      { id: 7, text: "Nama variabel berikut yang TIDAK valid di Python adalah?", options: ["nama_siswa", "umur1", "1nilai", "_data"], correctAnswer: 2 },
      { id: 8, text: "Fungsi untuk mengetahui tipe data variabel di Python adalah?", options: ["typeof()", "type()", "datatype()", "kind()"], correctAnswer: 1 },
    ],
  },
];

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  time: string;
  avatar: string;
}

export const generateLeaderboard = (quizId: number, userScore: number, userName: string): LeaderboardEntry[] => {
  const fakeStudents: LeaderboardEntry[] = [
    { rank: 0, name: "Siti Nurhaliza", score: 100, time: "3:20", avatar: "SN" },
    { rank: 0, name: "Budi Santoso", score: 90, time: "4:15", avatar: "BS" },
    { rank: 0, name: "Dewi Lestari", score: 85, time: "5:00", avatar: "DL" },
    { rank: 0, name: "Raka Pratama", score: 80, time: "4:45", avatar: "RP" },
    { rank: 0, name: "Maya Putri", score: 75, time: "5:30", avatar: "MP" },
    { rank: 0, name: "Fajar Hidayat", score: 70, time: "6:00", avatar: "FH" },
    { rank: 0, name: "Anisa Rahma", score: 65, time: "5:15", avatar: "AR" },
  ];

  const userEntry: LeaderboardEntry = {
    rank: 0,
    name: userName,
    score: userScore,
    time: "—",
    avatar: userName.split(" ").map(n => n[0]).join("").substring(0, 2),
  };

  const all = [...fakeStudents, userEntry].sort((a, b) => b.score - a.score);
  return all.map((entry, i) => ({ ...entry, rank: i + 1 }));
};
