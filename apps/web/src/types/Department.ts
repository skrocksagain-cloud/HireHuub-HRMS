export interface Department {
  id?: string;

  name: string;

  code: string;

  description: string;

  status: "Active" | "Inactive";

  createdAt?: Date;

  updatedAt?: Date;
}