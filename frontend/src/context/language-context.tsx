"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "EN" | "ID";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (text: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const enToId: Record<string, string> = {
  // Navigation / Sidebar
  "main menu": "menu utama",
  "dashboard": "dasbor",
  "support tickets": "tiket dukungan",
  "tasks tracker": "pelacak tugas",
  "attendance": "kehadiran",
  "attendance terminal": "terminal kehadiran",
  "calendar timesheets": "kalender jadwal kerja",
  "leave hub": "pusat cuti",
  "file manager": "pengelola berkas",
  "management admin": "manajemen admin",
  "management admin panel": "panel admin manajemen",
  "division mappings": "pemetaan divisi",
  "shift scheduler": "penjadwal shift",
  "attendance adjust": "penyesuaian kehadiran",
  "infrastructure": "infrastruktur",
  "vm instances": "instansi vm",
  "service assets": "aset layanan",
  "credential vault": "kubah kredensial",
  "infra management": "manajemen infra",
  "virtualmachines": "mesin virtual",
  "system config": "konfigurasi sistem",
  "user management": "manajemen pengguna",
  "roles & permissions": "peran & izin",
  "system control": "kontrol sistem",
  "audit logs": "log audit",
  "security & mfa": "keamanan & mfa",
  "profile": "profil",
  "sign out": "keluar",
  "save configurations": "simpan konfigurasi",
  "save": "simpan",
  "cancel": "batal",
  "account settings": "pengaturan akun",

  // Attendance Page & Modals
  "network whitelist": "daftar putih jaringan",
  "shift assigned": "shift ditugaskan",
  "time summary": "ringkasan waktu",
  "hours logged": "jam tercatat",
  "live terminal": "terminal langsung",
  "today's attendance logs": "log kehadiran hari ini",
  "check in": "masuk kerja",
  "check out": "pulang kerja",
  "anti-fraud safeguard": "perlindungan anti-fraud",
  "no scheduled shift": "tidak ada shift terjadwal",
  "choose employee": "pilih karyawan",
  "roster shift code": "kode shift roster",
  "roster date": "tanggal roster",
  "administrative notes": "catatan administratif",
  "assign roster day": "tugaskan hari roster",
  "assign roster shift": "tugaskan shift roster",
  "platform session timeout": "batas waktu sesi platform",
  "auto logout": "keluar otomatis",
  "platform session timeout (auto logout)": "batas waktu sesi platform (keluar otomatis)",
  "set the duration of inactivity before users are automatically logged out of their sessions to protect administrative data.": "atur durasi ketidakaktifan sebelum pengguna keluar secara otomatis dari sesi mereka untuk melindungi data administratif.",
  "expand menu": "perluas menu",
  "collapse menu": "perkecil menu",
  "search...": "cari...",
  "status": "status",
  "date": "tanggal",
  "action": "tindakan",
  "all": "semua",
  "loading...": "memuat...",
  "active": "aktif",
  "inactive": "tidak aktif",

  // HRM Admin Panel & Leave Hub Translations
  "leaves oversight": "pengawasan cuti",
  "attendance logs": "log kehadiran",
  "employees on leave": "karyawan sedang cuti",
  "pending requests oversight": "pengajuan pending oversight",
  "total registered active": "total terdaftar aktif",
  "employees on leave today": "karyawan yang sedang cuti hari ini",
  "no employees are on leave today.": "tidak ada karyawan yang sedang cuti hari ini.",
  "leave form customization": "kustomisasi form cuti",
  "enable custom fields": "aktifkan field kustom",
  "require document attachment": "wajib lampiran dokumen",
  "requires uploading supporting certificate url/pdf.": "meminta upload url surat keterangan/pdf pendukung.",
  "handover employee field": "field karyawan handover",
  "input backup employee name during leave.": "input nama karyawan yang membackup tugas selama cuti.",
  "emergency contact field": "field kontak darurat",
  "alternative phone number for emergency contact.": "nomor telepon alternatif yang bisa dihubungi saat darurat.",
  "add/edit leave types": "tambah/edit jenis cuti",
  "example: maternity leave...": "contoh: cuti melahirkan...",
  "employee leave balances": "daftar sisa & jatah cuti karyawan",
  "employee": "karyawan",
  "initial balance": "jatah mula",
  "used": "digunakan",
  "remaining leave": "sisa cuti",
  "all leave requests (admin log)": "semua pengajuan cuti (log admin)",
  "no leave request activity yet.": "belum ada aktivitas pengajuan cuti sama sekali.",
  "type:": "jenis:",
  "reason:": "alasan:",
  "created:": "dibuat:",
  "people": "orang",
  "requests": "pengajuan",
  "employees": "karyawan",
  "days": "hari",
  "reason": "alasan",
  "tasks": "tugas",
  "support": "dukungan",
  "ticket": "tiket",
  "files": "berkas",
  "credentials": "kredensial",
  "vault": "kubah",
  "virtual machines": "mesin virtual",
  "branding settings": "pengaturan branding",
  "general settings": "pengaturan umum",
  "security settings": "pengaturan keamanan",
  "network settings": "pengaturan jaringan",
  "branding": "branding",
  "general": "umum",
  "security": "keamanan",
  "network": "jaringan",
  "roles": "peran",
  "permissions": "izin",
  "users": "pengguna",
  "audit log": "log audit",
  "system stats": "statistik sistem",
  "control center": "pusat kontrol",
  "database status": "status basis data",
  "redis status": "status redis",
  "active sessions": "sesi aktif",
  "system logs": "log sistem",
  "backup & restore": "cadangan & pulihkan",
  "mfa configurations": "konfigurasi mfa",
  "active vm instances": "instansi vm aktif",
  "running": "berjalan",
  "stopped": "berhenti",
  "provisioned": "disediakan",
  "cpu usage": "penggunaan cpu",
  "ram usage": "penggunaan ram",
  "disk usage": "penggunaan disk",
  "ip address": "alamat ip",
  "os version": "versi os",
  "uptime": "waktu aktif",
  "search by employee, email or division...": "cari berdasarkan karyawan, email atau divisi...",
  "employee name": "nama karyawan",
  "email": "email",
  "division": "divisi",
  "check-in": "masuk",
  "check-out": "pulang",
  "lateness reason / notes": "alasan terlambat / catatan",
  "no employees found matching the search criteria.": "tidak ada karyawan yang cocok dengan kriteria pencarian.",
  "fetching attendance data...": "mengambil data kehadiran...",
  "export csv": "ekspor csv",
  "present": "hadir",
  "late": "terlambat",
  "absent": "absen",
  "absent/no log": "absen/tidak ada log",
  "on time": "tepat waktu",
  "late arrival": "kedatangan terlambat",
  "my timesheets": "jadwal kerja saya",
  "terminal clock": "jam terminal",
  "admin panel": "panel admin",
  "clock-in successful": "absen masuk berhasil",
  "clock-out successful": "absen pulang berhasil",
  "lateness reason": "alasan terlambat",
  "notes": "catatan",
  "work hours": "jam kerja",
  "hours": "jam",
  "weekly summary": "ringkasan mingguan",
  "monthly summary": "ringkasan bulanan",
  "request leave": "ajukan cuti",
  "annual leave": "cuti tahunan",
  "sick leave": "cuti sakit",
  "unpaid leave": "cuti di luar tanggungan",
  "maternity leave": "cuti melahirkan",
  "reason for leave": "alasan cuti",
  "start date": "tanggal mulai",
  "end date": "tanggal selesai",
  "submit request": "kirim pengajuan",
  "leave requests": "pengajuan cuti",
  "my leave applications": "pengajuan cuti saya",
  "approvals": "persetujuan",
  "pending": "tertunda",
  "approved": "disetujui",
  "rejected": "ditolak",
  "force approve": "paksa setujui",
  "force reject": "paksa tolak",
  "actioned by": "ditindaklanjuti oleh",
  "no pending requests": "tidak ada pengajuan tertunda",
  "leave balances": "saldo cuti",
  "allocated": "dialokasikan",
  "remaining": "sisa",
  "emergency contact": "kontak darurat",
  "backup employee": "karyawan backup",
  "attachment": "lampiran"
};

// Build optimized reverse maps for clean two-way matching
const lookupId: Record<string, string> = {};
const lookupEn: Record<string, string> = {};

Object.entries(enToId).forEach(([en, id]) => {
  lookupId[en.toLowerCase()] = id;
  lookupId[id.toLowerCase()] = id;
  lookupEn[id.toLowerCase()] = en;
  lookupEn[en.toLowerCase()] = en;
});

function translateText(text: string, targetLang: Language): string {
  const trimmed = text.trim();
  if (!trimmed) return text;

  // Detect and preserve trailing punctuation (like :, ?, ., !)
  const punctuationRegex = /[:\?\.\!]+$/;
  const puncMatch = trimmed.match(punctuationRegex);
  const suffix = puncMatch ? puncMatch[0] : "";
  const cleanText = trimmed.replace(punctuationRegex, "").trim();
  const lower = cleanText.toLowerCase();

  let match: string | undefined = undefined;
  if (targetLang === "ID") {
    match = lookupId[lower];
  } else {
    match = lookupEn[lower];
  }

  if (match) {
    let result = match;
    // Match original case format
    if (cleanText === cleanText.toUpperCase()) {
      result = match.toUpperCase();
    } else if (cleanText[0] === cleanText[0].toUpperCase()) {
      // If it is title case (every word capitalized) or just sentence case (only first letter capitalized)
      const isTitleCase = cleanText.split(" ").every(w => !w || w[0] === w[0].toUpperCase());
      if (isTitleCase) {
        result = match.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      } else {
        result = match.charAt(0).toUpperCase() + match.slice(1);
      }
    }
    return result + suffix;
  }

  return text;
}

function translateNode(node: Node, targetLang: Language) {
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as Element;
    if (el.tagName === "SCRIPT" || el.tagName === "STYLE") return;

    // Placeholders
    const placeholder = el.getAttribute("placeholder");
    if (placeholder) {
      const match = translateText(placeholder, targetLang);
      if (match && match !== placeholder) {
        el.setAttribute("placeholder", match);
      }
    }

    // Input values
    if (el.tagName === "INPUT" && (el.getAttribute("type") === "button" || el.getAttribute("type") === "submit")) {
      const val = el.getAttribute("value");
      if (val) {
        const match = translateText(val, targetLang);
        if (match && match !== val) {
          el.setAttribute("value", match);
        }
      }
    }
  }

  if (node.nodeType === Node.TEXT_NODE) {
    const originalText = node.nodeValue?.trim();
    if (!originalText || originalText.length < 2) return;

    const match = translateText(originalText, targetLang);
    if (match && match !== originalText) {
      const leadingSpace = node.nodeValue!.match(/^\s*/)?.[0] || "";
      const trailingSpace = node.nodeValue!.match(/\s*$/)?.[0] || "";
      node.nodeValue = leadingSpace + match + trailingSpace;
    }
  } else {
    for (let i = 0; i < node.childNodes.length; i++) {
      translateNode(node.childNodes[i], targetLang);
    }
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("EN");

  useEffect(() => {
    const saved = localStorage.getItem("yato_lang") as Language;
    if (saved === "EN" || saved === "ID") {
      setLangState(saved);
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("yato_lang", newLang);
    // Force immediate full translation
    translateNode(document.body, newLang);
  };

  useEffect(() => {
    // Initial translation
    translateNode(document.body, lang);

    // Dynamic translation for added nodes and text changes
    const observer = new MutationObserver((mutations) => {
      // Disconnect observer during translation to prevent infinite recursion loop
      observer.disconnect();

      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            translateNode(node, lang);
          });
        } else if (mutation.type === "characterData") {
          const node = mutation.target;
          const originalText = node.nodeValue?.trim();
          if (originalText && originalText.length >= 2) {
            const match = translateText(originalText, lang);
            if (match && match !== originalText) {
              const leadingSpace = node.nodeValue!.match(/^\s*/)?.[0] || "";
              const trailingSpace = node.nodeValue!.match(/\s*$/)?.[0] || "";
              node.nodeValue = leadingSpace + match + trailingSpace;
            }
          }
        }
      });

      // Reconnect observer
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => observer.disconnect();
  }, [lang]);

  const t = (text: string) => {
    return translateText(text, lang);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
