import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AgentCard } from "@/components/AgentCard";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { TextScramble } from "@/components/animations/TextScramble";
import { MOCK_AGENTS, serviceToAgent } from "@/lib/mock-data";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useSEO } from "@/lib/seo";
import * as api from "@/lib/api";

const CATEGORIES = ["medical", "finance", "legal", "code", "data", "creative", "research", "security", "agriculture", "other"];
const PRICE_RANGES = ["Free", "Under $0.01", "Under $0.05", "Under $0.10", "Any"];
const SORT_OPTIONS = ["Relevance", "Newest", "Most Popular", "Cheapest"];

const Explore = () => {
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState("Any");
  const [sort, setSort] = useState("Relevance");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useSEO({
    title: "Explore AI Agents — Stoa Marketplace",
    description: "Browse and discover curated AI agents. Search by category, rating, or use case. Pay per call with no subscriptions.",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://stoalabs.com/" },
        { "@type": "ListItem", "position": 2, "name": "Explore Agents", "item": "https://stoalabs.com/explore" }
      ]
    }
  });

  const { data, isLoading: loading } = useQuery({
    queryKey: ["services"],
    queryFn: () => api.getServices(),
    staleTime: 30_000,
  });

  const allAgents = data?.services?.map(serviceToAgent) ?? MOCK_AGENTS;
  // Deduplicate by name (keep first occurrence)
  const agents = allAgents.filter((a, i, arr) => arr.findIndex((b) => b.name === a.name) === i);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const filteredAgents = agents.filter((a) => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedCategories.length > 0 && !selectedCategories.includes(a.category)) return false;
    if (priceRange === "Free" && a.pricePerCall > 0) return false;
    if (priceRange === "Under $0.01" && a.pricePerCall >= 0.01) return false;
    if (priceRange === "Under $0.05" && a.pricePerCall >= 0.05) return false;
    if (priceRange === "Under $0.10" && a.pricePerCall >= 0.10) return false;
    return true;
  }).sort((a, b) => {
    if (sort === "Newest") return b.id.localeCompare(a.id);
    if (sort === "Most Popular") return b.totalCalls - a.totalCalls;
    if (sort === "Cheapest") return a.pricePerCall - b.pricePerCall;
    return 0; // Relevance — default order
  });

  const clearFilters = () => {
    setSelectedCategories([]);
    setPriceRange("Any");
    setSearch("");
  };

  const FilterSidebar = () => (
    <div className="space-y-8">
      <div>
        <h4 className="font-body text-body-sm font-semibold text-foreground mb-3">Category</h4>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <label key={cat} className="flex items-center gap-2 cursor-pointer rounded-lg border border-border px-4 py-2.5 hover:border-primary/30 transition-colors has-[:checked]:bg-primary/10 has-[:checked]:border-primary/40">
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat)}
                onChange={() => toggleCategory(cat)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <span className="font-body text-body-sm text-muted-foreground whitespace-nowrap capitalize">{cat}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-body text-body-sm font-semibold text-foreground mb-3">Price Range</h4>
        <div className="flex flex-wrap gap-2">
          {PRICE_RANGES.map((pr) => (
            <label key={pr} className="flex items-center gap-2 cursor-pointer rounded-lg border border-border px-4 py-2.5 hover:border-primary/30 transition-colors has-[:checked]:bg-primary/10 has-[:checked]:border-primary/40">
              <input
                type="radio"
                name="priceRange"
                checked={priceRange === pr}
                onChange={() => setPriceRange(pr)}
                className="h-4 w-4 accent-primary"
              />
              <span className="font-body text-body-sm text-muted-foreground whitespace-nowrap">{pr}</span>
            </label>
          ))}
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={clearFilters}>
        Clear Filters
      </Button>
    </div>
  );

  return (
    <main className="min-h-screen bg-background pt-[72px]">
      <div className="mx-auto max-w-7xl px-6 py-12 md:py-20">
        {/* Header */}
        <ScrollReveal>
          <h1 className="font-display text-display-md font-bold text-foreground mb-6 text-center">
            Explore
          </h1>
        </ScrollReveal>

        {/* Search */}
        <div className="relative max-w-xl mb-10 mx-auto" role="search">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents..."
            aria-label="Search agents"
            className="pl-12 h-14 text-body-md rounded-2xl"
          />
        </div>

        <div className="flex items-start gap-8">
          {/* Desktop Filters */}
          <aside className="hidden md:block w-[260px] flex-shrink-0 sticky top-[88px]">
            <FilterSidebar />
          </aside>

          {/* Mobile filter toggle */}
          <div className="md:hidden mb-4">
            <Button variant="outline" size="sm" onClick={() => setFiltersOpen(true)}>
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Mobile filter drawer */}
          {filtersOpen && (
            <div className="fixed inset-0 z-[var(--z-modal)] bg-background p-6 md:hidden overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-body text-heading-md font-semibold">Filters</h3>
                <button onClick={() => setFiltersOpen(false)} aria-label="Close filters">
                  <X className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              <FilterSidebar />
              <Button variant="default" className="mt-6 w-full" onClick={() => setFiltersOpen(false)}>
                Apply Filters
              </Button>
            </div>
          )}

          {/* Agent Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <span className="font-body text-body-sm text-muted-foreground">
                {filteredAgents.length} agents found
              </span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Sort agents"
                className="font-body text-body-sm bg-black text-white border border-border rounded-lg px-3 py-2"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-2xl" />
                ))}
              </div>
            ) : filteredAgents.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredAgents.map((agent) => (
                  <Link key={agent.id} to={`/explore/${agent.id}`}>
                    <AgentCard agent={agent} className="max-w-none" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="font-body text-body-lg text-muted-foreground mb-4">
                  No agents match your filters.
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Explore;
