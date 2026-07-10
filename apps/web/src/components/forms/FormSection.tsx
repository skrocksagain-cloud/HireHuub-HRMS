import type { ReactNode } from "react";
import Card from "../../ui/Card";

interface FormSectionProps {
  title: string;
  children: ReactNode;
}

export default function FormSection({
  title,
  children,
}: FormSectionProps) {
  return (
    <Card>
      <h2 className="text-xl font-semibold mb-6">
        {title}
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {children}
      </div>
    </Card>
  );
}