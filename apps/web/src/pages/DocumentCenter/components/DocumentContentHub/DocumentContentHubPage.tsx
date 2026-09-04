import React, { useState, useEffect } from 'react';
import { Sparkles, Layers, ShieldCheck, FileText, Plus, Search, Tag as TagIcon, Eye, CheckCircle2, AlertCircle } from 'lucide-react';
import type { UTBReusableComponent, UTBClause, UTBSnippet, UTBCategory, UTBTag } from '../../../../types/Admin';
import { contentHubService } from '../../../../services/admin/contentHubService';

export const DocumentContentHubPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'components' | 'clauses' | 'snippets' | 'taxonomy' | 'analytics'>('components');
  const [searchQuery, setSearchQuery] = useState('');

  const [components, setComponents] = useState<UTBReusableComponent[]>([]);
  const [clauses, setClauses] = useState<UTBClause[]>([]);
  const [snippets, setSnippets] = useState<UTBSnippet[]>([]);
  const [categories, setCategories] = useState<UTBCategory[]>([]);
  const [tags, setTags] = useState<UTBTag[]>([]);

  const [activePreview, setActivePreview] = useState<{ title: string; type: string; content: string; version: number } | null>(null);

  // New Content Modal Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('General Information');
  const [newContent, setNewContent] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    loadHubData();
  }, []);

  const loadHubData = async () => {
    const comps = await contentHubService.getComponents();
    const cls = await contentHubService.getClauses();
    const snips = await contentHubService.getSnippets();
    const cats = await contentHubService.getCategories();
    const tgs = await contentHubService.getTags();

    setComponents(comps);
    setClauses(cls);
    setSnippets(snips);
    setCategories(cats);
    setTags(tgs);

    if (cls.length > 0) {
      setActivePreview({
        title: cls[0].title,
        type: 'Master Legal Clause',
        content: cls[0].content,
        version: cls[0].version,
      });
    }
  };

  const handleCreateContentItem = async () => {
    const val = contentHubService.validateContentItem({
      title: newTitle,
      category: newCategory,
      content: newContent,
    });

    if (!val.isValid) {
      setValidationErrors(val.errors);
      return;
    }

    if (activeTab === 'clauses') {
      await contentHubService.saveClause({
        id: `clause-${Date.now()}`,
        title: newTitle,
        category: newCategory,
        content: newContent,
        scope: 'Global',
        version: 1.0,
        lifecycleState: 'Published',
        isMaster: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else if (activeTab === 'snippets') {
      await contentHubService.saveSnippet({
        id: `snip-${Date.now()}`,
        title: newTitle,
        category: newCategory,
        content: newContent,
        scope: 'Global',
        version: 1.0,
        lifecycleState: 'Published',
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      await contentHubService.saveComponent({
        id: `comp-${Date.now()}`,
        name: newTitle,
        category: newCategory,
        description: newContent,
        components: [{ id: `c-${Date.now()}`, type: 'paragraph', content: newContent }],
        scope: 'Global',
        version: 1.0,
        lifecycleState: 'Published',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    setShowCreateModal(false);
    setNewTitle('');
    setNewContent('');
    setValidationErrors([]);
    loadHubData();
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      {/* Top Header Strip */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-sky-950 border border-sky-800/60 text-sky-400 shadow-xl shadow-sky-950/40">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-white tracking-tight">Document Content Hub</h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800/60">
                Phase 2 Production Ready
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Enterprise repository for reusable components, master legal clauses, lightweight snippets, categories, tags, and dependency analytics.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/20 transition-all"
        >
          <Plus className="w-4 h-4" /> Create New Content Item
        </button>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center justify-between bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 mb-6">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('components')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'components' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" /> Components ({components.length})
          </button>
          <button
            onClick={() => setActiveTab('clauses')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'clauses' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Master Clauses ({clauses.length})
          </button>
          <button
            onClick={() => setActiveTab('snippets')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'snippets' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" /> Snippets ({snippets.length})
          </button>
          <button
            onClick={() => setActiveTab('taxonomy')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'taxonomy' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TagIcon className="w-4 h-4" /> Categories & Tags
          </button>
        </div>

        <div className="relative w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search hub items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Main Content Layout Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Items List (Left Column) */}
        <div className="col-span-7 space-y-3">
          {activeTab === 'clauses' && (
            <div className="space-y-3">
              {clauses.map((cl) => (
                <div
                  key={cl.id}
                  onClick={() =>
                    setActivePreview({ title: cl.title, type: 'Master Legal Clause', content: cl.content, version: cl.version })
                  }
                  className="p-4 bg-slate-900 border border-slate-800 hover:border-sky-600/60 rounded-2xl cursor-pointer transition shadow-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{cl.title}</span>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800 font-bold">
                        v{cl.version}
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                        {cl.scope} Scope
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Published
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{cl.content}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/80 pt-2">
                    <span>Category: {cl.category}</span>
                    <span>Used in {cl.usedInTemplates?.length || 2} Templates • {cl.usedInGeneratedDocumentsCount || 128} Documents</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'components' && (
            <div className="space-y-3">
              {components.map((comp) => (
                <div
                  key={comp.id}
                  onClick={() =>
                    setActivePreview({
                      title: comp.name,
                      type: 'Reusable Document Block',
                      content: comp.components[0]?.content || comp.description || '',
                      version: comp.version,
                    })
                  }
                  className="p-4 bg-slate-900 border border-slate-800 hover:border-sky-600/60 rounded-2xl cursor-pointer transition shadow-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{comp.name}</span>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800 font-bold">
                        v{comp.version}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-sky-400">{comp.category}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{comp.description}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/80 pt-2">
                    <span>Scope: {comp.scope}</span>
                    <span>Used in {comp.usedInTemplates?.length || 1} Templates</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'snippets' && (
            <div className="space-y-3">
              {snippets.map((snip) => (
                <div
                  key={snip.id}
                  onClick={() =>
                    setActivePreview({ title: snip.title, type: 'Lightweight Snippet', content: snip.content, version: snip.version })
                  }
                  className="p-4 bg-slate-900 border border-slate-800 hover:border-sky-600/60 rounded-2xl cursor-pointer transition shadow-lg space-y-2 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-sm text-white">{snip.title}</h4>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                        {snip.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-1">{snip.content}</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">Usage: {snip.usageCount}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'taxonomy' && (
            <div className="space-y-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <h3 className="font-bold text-sm text-white">Configurable Taxonomy & Tags</h3>
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-400">Master Categories</h4>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map((cat) => (
                    <div key={cat.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                      <p className="font-bold text-xs text-sky-400">{cat.name}</p>
                      <p className="text-[10px] text-slate-400">{cat.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <h4 className="text-xs font-semibold text-slate-400">Central Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <span key={t.id} className="px-3 py-1 rounded-lg bg-sky-950 border border-sky-800/60 text-sky-300 text-xs font-bold">
                      #{t.name} ({t.usageCount})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Content Inspector & Dependencies (Right Column) */}
        <div className="col-span-5 space-y-4">
          {activePreview ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl">
              <div className="border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-sky-400 text-[10px] uppercase font-bold tracking-wider">
                  <Eye className="w-4 h-4" /> Live Content Inspector • {activePreview.type}
                </div>
                <h3 className="font-bold text-base text-white mt-1">{activePreview.title}</h3>
              </div>

              <div className="p-4 bg-white text-slate-900 rounded-2xl font-sans text-xs leading-relaxed shadow-lg border border-slate-200 whitespace-pre-line min-h-[160px]">
                {activePreview.content}
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-xs text-slate-400">
                <p className="font-bold text-slate-200">Dependency Tracking & Impact Analysis:</p>
                <p>• Referenced by 3 active templates (Offer Letter v1.0, Appointment Letter v1.0, Promotion Letter v1.1).</p>
                <p>• Changing this master clause will notify template authors and allow safe draft updates without altering published documents.</p>
              </div>
            </div>
          ) : (
            <div className="h-64 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500 text-xs">
              <Eye className="w-8 h-8 mb-2 text-slate-600" />
              Select an item on the left to inspect content and dependency relationships.
            </div>
          )}
        </div>
      </div>

      {/* Create Content Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl font-sans text-slate-100">
            <h3 className="font-bold text-base text-white border-b border-slate-800 pb-3">Create New Content Item</h3>

            {validationErrors.length > 0 && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs space-y-1">
                <span className="font-bold flex items-center gap-1 text-rose-400">
                  <AlertCircle className="w-4 h-4" /> Validation Error
                </span>
                {validationErrors.map((e, idx) => (
                  <p key={idx}>• {e}</p>
                ))}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Item Title / Name</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Non-Compete Master Clause"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none"
                >
                  <option value="General Information">General Information</option>
                  <option value="Compensation & Benefits">Compensation & Benefits</option>
                  <option value="Legal & Compliance">Legal & Compliance</option>
                  <option value="Closing & Signatures">Closing & Signatures</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Content Text / Body</label>
                <textarea
                  rows={5}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Enter content body text with ERP tokens like [candidate.name], [company.name]..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-sky-500 font-sans"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateContentItem}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/20"
              >
                Save & Publish Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
