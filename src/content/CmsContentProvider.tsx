import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@cms/sdk";
import { apiKey, apiUrl } from "../lib/cms";
import {
  normalizeAbout,
  normalizeContact,
  normalizeFocuses,
  normalizeHero,
  normalizeProjects,
  normalizeSite,
  normalizeSketches,
  sectionCopy,
} from "./normalize";
import type { FocusId, Project, Sketch } from "./types";
import type {
  AboutContent,
  ContactContent,
  HeroContent,
  SectionCopy,
  SiteContent,
} from "./types";

export type PortfolioContent = {
  site: SiteContent;
  hero: HeroContent;
  about: AboutContent;
  contact: ContactContent;
  focuses: ReturnType<typeof normalizeFocuses>;
  sketches: Sketch[];
  score: SectionCopy;
  projectsSection: SectionCopy;
  projects: Project[];
  getProject: (slug: string) => Project | undefined;
};

const PortfolioContentContext = createContext<PortfolioContent | null>(null);

const cms = createClient({ apiUrl, apiKey });

export function PortfolioContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<PortfolioContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [globals, projectItems] = await Promise.all([
          cms.getGlobals(),
          cms.getEntries("projects"),
        ]);

        const projects = normalizeProjects(
          projectItems.map((item) => ({
            ...(item.data.payload as Record<string, unknown>),
            slug: item.slug,
          }))
        );

        const next: PortfolioContent = {
          site: normalizeSite(globals.site),
          hero: normalizeHero(globals.hero),
          about: normalizeAbout(globals.about),
          contact: normalizeContact(globals.contact),
          focuses: normalizeFocuses(globals.focuses),
          sketches: normalizeSketches(globals.sketches),
          score: sectionCopy(globals.score),
          projectsSection: sectionCopy(globals.projectsSection),
          projects,
          getProject: (slug: string) => projects.find((p) => p.slug === slug),
        };
        setContent(next);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load content");
      }
    })();
  }, []);

  if (error) {
    return (
      <div className="boot">
        <p>Could not reach the CMS: {error}</p>
        <p>API: {apiUrl}</p>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="boot">
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <PortfolioContentContext.Provider value={content}>{children}</PortfolioContentContext.Provider>
  );
}

export function usePortfolioContent(): PortfolioContent {
  const ctx = useContext(PortfolioContentContext);
  if (!ctx) throw new Error("usePortfolioContent requires PortfolioContentProvider");
  return ctx;
}

export function usePortfolioContentOptional(): PortfolioContent | null {
  return useContext(PortfolioContentContext);
}

/** @deprecated use usePortfolioContent() */
export function useContentBoot() {
  const content = usePortfolioContentOptional();
  return useMemo(
    () => ({
      ready: Boolean(content),
      content,
    }),
    [content]
  );
}

export type { FocusId };
