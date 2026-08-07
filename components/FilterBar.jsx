"use client";

import { Search, Building2, Truck, Tags, Warehouse, Tag, RotateCcw } from "lucide-react";
import SearchWithHistory from "./SearchWithHistory";

function FilterSelect({ label, icon, value, onChange, options, placeholder, labelMap = {} }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
        {icon}
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-2 text-sm outline-none focus:border-[var(--blue)] transition-colors"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {labelMap[o] || o}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function FilterBar({
  options,
  search,
  setSearch,
  depo,
  setDepo,
  supp,
  setSupp,
  kategori,
  setKategori,
  gudang,
  setGudang,
  promo,
  setPromo,
  onReset,
}) {
  return (
    <div className="px-4 sm:px-5 py-4 border-b border-[var(--border)] bg-[var(--bg)]">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
        <div className="flex flex-col gap-1 col-span-2 sm:col-span-1 lg:col-span-2 min-w-0">
          <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
            <Search size={12} />
            Cari Barang
          </label>
          <SearchWithHistory
            value={search}
            onChange={setSearch}
            placeholder="Cari nama / kode barang..."
          />
        </div>

        <FilterSelect
          label="Depo"
          icon={<Building2 size={12} />}
          value={depo}
          onChange={setDepo}
          options={options.depo}
          placeholder="Semua Depo"
        />
        <FilterSelect
          label="Supplier"
          icon={<Truck size={12} />}
          value={supp}
          onChange={setSupp}
          options={options.supp}
          placeholder="Semua Supplier"
        />
        <FilterSelect
          label="Kategori"
          icon={<Tags size={12} />}
          value={kategori}
          onChange={setKategori}
          options={options.kategori}
          placeholder="Semua Kategori"
          labelMap={{ DEAD: "Dead Stock", "-": "Belum Dikategorikan" }}
        />
        <FilterSelect
          label="Gudang"
          icon={<Warehouse size={12} />}
          value={gudang}
          onChange={setGudang}
          options={options.gudang}
          placeholder="Semua Gudang"
        />
        <FilterSelect
          label="Promo"
          icon={<Tag size={12} />}
          value={promo}
          onChange={setPromo}
          options={["YA", "TIDAK"]}
          placeholder="Semua (Promo & Non Promo)"
          labelMap={{ YA: "Barang Promo", TIDAK: "Barang Non Promo" }}
        />
      </div>

      <div className="flex justify-end mt-3">
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--ink-300,#b5b5bd)] transition-colors"
        >
          <RotateCcw size={13} />
          Reset Semua Filter
        </button>
      </div>
    </div>
  );
}
