import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

type Props = {
  children: React.ReactNode;
};

export default function DashboardLayout({ children }: Props) {
  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1">
        <Topbar />

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}