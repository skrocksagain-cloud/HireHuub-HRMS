interface TableLoadingProps {
  rows?: number;
  columns?: number;
}

export default function TableLoading({
  rows = 8,
  columns = 6,
}: TableLoadingProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead className="bg-slate-100">
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th
                key={index}
                className="border-b border-slate-200 px-4 py-3"
              >
                <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {Array.from({ length: rows }).map((_, row) => (
            <tr
              key={row}
              className="border-b border-slate-100"
            >
              {Array.from({ length: columns }).map((_, col) => (
                <td
                  key={col}
                  className="px-4 py-4"
                >
                  <div
                    className={`
                      h-4
                      animate-pulse
                      rounded
                      bg-slate-200
                      ${
                        col === 0
                          ? "w-20"
                          : col === columns - 1
                          ? "w-16"
                          : "w-full"
                      }
                    `}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}