import type { InputHTMLAttributes } from "react";
import Input from "../../ui/Input";

interface FormInputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export default function FormInput({
  label,
  ...props
}: FormInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        {label}
      </label>

      <Input {...props} />
    </div>
  );
}