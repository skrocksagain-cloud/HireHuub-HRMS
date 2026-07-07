export default function Topbar() {
  return (
    <div className="h-16 bg-white border-b flex items-center justify-between px-6">
      <h2 className="font-semibold text-lg">
        Dashboard
      </h2>

      <div className="flex items-center gap-3">
        <div className="text-sm text-gray-600">
          HH001 Admin
        </div>
      </div>
    </div>
  );
}