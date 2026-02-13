"use client";

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function LocationInput({ value, onChange }: LocationInputProps) {
  return (
    <div className="w-full">
      <label
        htmlFor="location"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Location
      </label>
      <input
        id="location"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. Brooklyn, NY"
        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent text-gray-900 placeholder-gray-400"
      />
    </div>
  );
}
