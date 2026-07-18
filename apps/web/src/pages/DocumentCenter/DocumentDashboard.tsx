import DashboardStats from "./components/cards/DashboardStats";
import RecentDocuments from "./components/cards/RecentDocuments";
import DocumentDistribution from "./components/cards/DocumentDistribution";
import DocumentActivity from "./components/cards/DocumentActivity";
import QuickActions from "./components/cards/QuickActions";
import OfferLetterGenerator from './components/OfferLetterGenerator';

import useDocumentDashboard from "./useDocumentDashboard";
import { useOfferLetterGeneration } from './hooks/useOfferLetterGeneration';

export default function DocumentDashboard() {
  const {
    loading,

    totalDocuments,
    generatedToday,
    storageUsed,
    totalTemplates,

    recentDocuments,
    activities,
    distribution,

    refresh,
  } = useDocumentDashboard();
  const {
    offers,
    isLoadingOffers,
    isGenerating,
    error,
    generatedFileName,
    generateOfferLetter,
  } = useOfferLetterGeneration();

  return (
    <div className="space-y-8">

      {/* Page Header */}

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold text-slate-800">
            Document Center
          </h1>

          <p className="mt-2 text-slate-500">
            Generate, manage, track and archive all ERP documents.
          </p>

        </div>

      </div>

      <OfferLetterGenerator
        offers={offers}
        isLoadingOffers={isLoadingOffers}
        isGenerating={isGenerating}
        error={error}
        generatedFileName={generatedFileName}
        onGenerate={generateOfferLetter}
      />

      {/* Statistics */}

      <DashboardStats
        loading={loading}
        totalDocuments={totalDocuments}
        generatedToday={generatedToday}
        storageUsed={storageUsed}
        totalTemplates={totalTemplates}
      />

      {/* Main Dashboard */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left Section */}

        <div className="xl:col-span-2 space-y-6">

          <RecentDocuments
            loading={loading}
            documents={recentDocuments}
            onRefresh={refresh}
          />

          <DocumentDistribution
            loading={loading}
            data={distribution}
          />

        </div>

        {/* Right Section */}

        <div className="space-y-6">

          <QuickActions />

          <DocumentActivity
            loading={loading}
            activities={activities}
          />

        </div>

      </div>

    </div>
  );
}
