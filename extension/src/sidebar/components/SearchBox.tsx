type SearchBoxProps = {
  label: string;
  placeholder: string;
  value: string;
  className?: string;
  onChange(value: string): void;
};

export function SearchBox({ label, placeholder, value, className = "search-field", onChange }: SearchBoxProps) {
  return (
    <label className={className}>
      <span className="sr-only">{label}</span>
      <input
        className="input"
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
