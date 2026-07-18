import Input from '../../../ui/Input';

interface EmployeeSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function EmployeeSearchBar({ value, onChange }: EmployeeSearchBarProps) {
  return (
    <Input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Search by name, employee ID, code, or email"
    />
  );
}
