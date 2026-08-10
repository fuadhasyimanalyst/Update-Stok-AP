"use client";

import { Search, Building2, Truck, Tags, Warehouse, RotateCcw } from "lucide-react";
import SearchableSelect from "./SearchableSelect";

export default function FilterBar({
  options,
  namaBarang,
  setNamaBarang,
  depo,
  setDepo,
  supp,
  setSupp,
  kategori,
  setKategori,
  gudang,
  setGudang,
  onReset,
}) {
  return (
    <div className="px-4 sm:px-5 py-4 border-b border-[var(--border)] bg-[var(--bg)]">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
        <SearchableSelect
          label="Supplier"
          icon={<Truck size={12} />}
          value={supp}
          onChange={setSupp}
          options={options.supp}
          placeholder="Semua Supplier"
        />
        <SearchableSelect
          label="Nama Barang"
          icon={<Search size={12} />}
          value={namaBarang}
          onChange={setNamaBarang}
          options={options.namaBarang}
          placeholder="Semua Barang"
        />
        <SearchableSelect
          label="Kategori"
          icon={<Tags size={12} />}
          value={kategori}
          onChange={setKategori}
          options={options.kategori}
          placeholder="Semua Kategori"
          labelMap={{ DEAD: "Dead Stock" }}
        />
        <SearchableSelect
          label="Depo"
          icon={<Building2 size={12} />}
          value={depo}
          onChange={setDepo}
          options={options.depo}
          placeholder="Semua Depo"
        />
        <SearchableSelect
          label="Gudang"
          icon={<Warehouse size={12} />}
          value={gudang}
          onChange={setGudang}
          options={options.gudang}
          placeholder="Semua Gudang"
        />
      </div>

      <div className="flex justify-end mt-3">
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--ink-300,#b5b5bd)] transition-colors"
        >
          <RotateCcw size={13} />
          Reset Filter
        </button>
      </div>
    </div>
  );
}
