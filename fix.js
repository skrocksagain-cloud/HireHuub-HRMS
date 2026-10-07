const fs = require('fs');

// --- performanceService.ts ---
const svc_path = 'apps/web/src/pages/People/services/performanceService.ts';
let svc = fs.readFileSync(svc_path, 'utf8');

svc = svc.replace(
    /async getPerformanceForBrand\([\s\S]*?\): Promise<\{ summaries: PerformanceSummary\[\]; targets: PerformanceTarget\[\] \}> \{/,
    `async getPerformanceData(
    month: string,
    actorContext?: { assignedRole?: string; departmentId?: string; department?: string; employeeId?: string; employeeName?: string; employeeRole?: string }
  ): Promise<{ summaries: PerformanceSummary[]; targets: PerformanceTarget[] }> {`
);

svc = svc.replace(
    "const targets = await performanceTargetRepository.getTargetsForMonth(brandId, month);",
    "const targets = await performanceTargetRepository.getTargetsForMonth('ALL', month);"
);

svc = svc.replace(
    /calculateIncentiveForEmployee\(\s*s\.employeeId,\s*brandId,\s*month\s*\);/,
    "calculateIncentiveForEmployee(s.employeeId, 'ALL', month);"
);

svc = svc.replace(
    /async getMonthlyRegisterForBrand\([\s\S]*?\): Promise<MonthlyRegisterItem\[\]> \{/,
    `async getMonthlyRegister(
    currentMonth: string,
    currentMonthTarget: number,
    currentMonthPoints: number,
    currentActiveCandidates: number,
    actorContext?: { assignedRole?: string; departmentId?: string; department?: string; employeeId?: string; employeeName?: string; employeeRole?: string }
  ): Promise<MonthlyRegisterItem[]> {`
);

svc = svc.replace(
    "performanceTargetRepository.getAllTargetsForBrand(brandId)",
    "performanceTargetRepository.getAllTargetsForBrand('ALL')"
);

svc = svc.replace(
    /brandId,\s*scope: scope as any,/,
    "brandId: 'ALL',\n        scope: scope as any,"
);

fs.writeFileSync(svc_path, svc, 'utf8');

// --- PerformancePage.tsx ---
const page_path = 'apps/web/src/pages/People/PerformancePage.tsx';
let page = fs.readFileSync(page_path, 'utf8');

page = page.replace(/import \{ adminService \} from '\.\.\/\.\.\/services\/admin\/adminService';\r?\n?/, "");
page = page.replace(/import type \{ BrandProfile \} from '\.\.\/\.\.\/types\/Admin';\r?\n?/, "");
page = page.replace(/const \[brands, setBrands\] = useState<BrandProfile\[\]>\(\[\]\);\r?\n?/, "");
page = page.replace(/const \[selectedBrandId, setSelectedBrandId\] = useState<string>\(''\);\r?\n?/, "");
page = page.replace(/const \[targetBrandId, setTargetBrandId\] = useState<string>\(''\);\r?\n?/, "");

page = page.replace(/const activeRole: any = null;\s*\/\/ Placeholder.*?\r?\n?/, "");
page = page.replace(/const userEmpId = user\?\.employeeId \|\| '';\r?\n?/, "");
page = page.replace(/const viewScope = 'GLOBAL';\s*\/\/ Authorization.*?\r?\n?/, "");

page = page.replace(/\s*\/\/ Load Active Brands from Company Settings[\s\S]*?\.catch\(\(\) => setBrands\(\[\]\)\);\s*\}, \[\]\);\r?\n?/, "");
page = page.replace(/\s*\/\/ Selected Brand Profile Object[\s\S]*?\}, \[brands, selectedBrandId\]\);\r?\n?/, "");

page = page.replace(/if \(\!selectedBrandId\) return;\r?\n?/, "");
page = page.replace("getPerformanceForBrand(selectedBrandId, selectedMonth, actorContext);", "getPerformanceData(selectedMonth, actorContext);");

page = page.replace(/if \(selectedBrandId\) \{\s*void loadPerformanceData\(\);\s*\}/, "void loadPerformanceData();");
page = page.replace("}, [selectedBrandId, selectedMonth]);", "}, [selectedMonth]);");

page = page.replace(/if \(\!selectedBrandId\) return \[\];\s*const firstBrandId = brands\[0\]\?\.id;\r?\n?/, "");
page = page.replace(/\s*\/\/ Brand Filter Scoping[\s\S]*?return \([\s\S]*?\}\);/, "\n        return true;\n      });");
page = page.replace("}, [summaries, selectedBrandId, selectedBrandObj, brands, activeRole, viewScope, userEmpId, user?.department, user?.name]);", "}, [summaries]);");

page = page.replace(/if \(\!selectedBrandId\) \{\s*setMonthlyRegister\(\[\]\);\s*return;\s*\}/, "");
page = page.replace(/\.getMonthlyRegisterForBrand\(\s*selectedBrandId,/, ".getMonthlyRegister(");
page = page.replace("}, [selectedBrandId, selectedMonth, totalMonthlyTarget, totalAchievedPoints, totalActiveCandidates, totalIncentive]);", "}, [selectedMonth, totalMonthlyTarget, totalAchievedPoints, totalActiveCandidates, totalIncentive]);");

page = page.replace(/const initialBrand = selectedBrandId \|\| brands\[0\]\?\.id \|\| '';\s*setTargetBrandId\(initialBrand\);\r?\n?/, "");
page = page.replace("if (!targetEmpId || !targetBrandId || !targetPointsInput) {", "if (!targetEmpId || !targetPointsInput) {");
page = page.replace("'Employee, Brand, and Target Points are required.'", "'Employee and Target Points are required.'");
page = page.replace(/const brandObj = brands\.find\(\(b\) => b\.id === targetBrandId\);\r?\n?/, "");
page = page.replace(/brandId: targetBrandId,\s*brandName: brandObj\?\.brandName \|\| 'Brand',/, "brandId: 'ALL',\n          brandName: 'Hire Huub',");

page = page.replace(/\{selectedBrandObj\?\.brandName \|\| 'Selected Brand'\}/g, "Hire Huub");
page = page.replace(/\{selectedBrandObj\?\.brandName \|\| 'Brand'\}/g, "Hire Huub");

page = page.replace(/<div>\s*<label className="block text-xs font-semibold text-slate-700 mb-1">Target Brand \*<\/label>\s*<select\s*aria-label="Select Brand"[\s\S]*?<\/select>\s*<\/div>/, "");

page = page.replace(
    /\{\/\* Active Brand Selector & Actions Bar \*\/\}[\s\S]*?\{\/\* Employee Performance Table \*\/\}/,
    `{/* Actions Bar */}
        <div className="flex items-center justify-end gap-2 mb-4">
            <select
              aria-label="Select Performance Month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              {availableMonths.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
            {canManage && (
              <button
                type="button"
                onClick={() => handleOpenTargetModal()}
                className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-xs"
              >
                <Plus size={14} /> Assign Target
              </button>
            )}
        </div>

        {/* Employee Performance Table */}`
);

page = page.replace(
    /\{loading \? \([\s\S]*?\) : brands\.length === 0 \? \([\s\S]*?\) : filteredSummaries\.length === 0 \? \(/,
    `{loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading performance data...</div>
          ) : filteredSummaries.length === 0 ? (`
);

fs.writeFileSync(page_path, page, 'utf8');

console.log("Fixes applied.");
