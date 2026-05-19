"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  
  const getPageTitle = () => {
    const path = pathname.split("/").pop();
    if (!path || path === "dashboard") return "Overview";
    return path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " ");
  };

  return (
    <header className="h-16 bg-white border-b border-slate-50 px-8 items-center justify-between sticky top-0 z-40 hidden xl:flex">
      <div className="flex items-center gap-8">
        <h1 className="text-[14px] font-semibold text-slate-900 tracking-tight">{getPageTitle()}</h1>
        
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const query = (e.currentTarget.elements.namedItem('search') as HTMLInputElement).value;
            if (query) router.push(`/dashboard?search=${encodeURIComponent(query)}`);
          }}
          className="hidden md:flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-50 w-72 group focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/5 transition-all"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          <input 
            name="search"
            type="text" 
            placeholder="Search resources..." 
            className="bg-transparent border-none outline-none text-[11px] font-semibold w-full placeholder:text-slate-300 placeholder:font-medium"
          />
        </form>
      </div>

      <div className="flex items-center gap-5">
        <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest hidden sm:block">
          System Operational
        </div>
      </div>
    </header>
  );
}
