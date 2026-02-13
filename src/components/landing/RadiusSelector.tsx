"use client";

const RADIUS_OPTIONS = [
  { value: 5, label: "5 miles" },
  { value: 10, label: "10 miles" },
  { value: 25, label: "25 miles" },
  { value: 50, label: "50 miles" },
  { value: 100, label: "100 miles" },
];

interface RadiusSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

export function RadiusSelector({ value, onChange }: RadiusSelectorProps) {
  return (
    <div className="w-full">
      <label
        htmlFor="radius"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Search Radius
      </label>
      <select
        id="radius"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent text-gray-900 bg-white"
      >
        {RADIUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
