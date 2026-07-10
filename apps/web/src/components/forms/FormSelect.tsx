interface Option {
  label: string;
  value: string;
}

interface FormSelectProps {
  label: string;
  name: string;
  value: string;
  options: Option[];
  onChange: (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => void;
}

export default function FormSelect({
  label,
  name,
  value,
  options,
  onChange,
}: FormSelectProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        {label}
      </label>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-600"
      >
        <option value="">
          Select {label}
        </option>

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}