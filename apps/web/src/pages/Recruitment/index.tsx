import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RecruitmentPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/workbench/staffing-hub', { replace: true });
  }, [navigate]);

  return (
    <div className="flex h-screen items-center justify-center text-slate-500 font-medium text-xs">
      Redirecting to Recruitment & Staffing Hub…
    </div>
  );
}