import { create } from "zustand";

export interface ProfileData {
  id: string;
  slug: string;
  fullName: string;
  title: string;
  email: string;
  phone: string | null;
  location: string;
  portfolioUrl: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  masterResumePath: string;
  projects: Array<{
    id: string;
    title: string;
    techStack: string;
    liveDemoUrl: string | null;
    githubUrl: string | null;
    architecture: string;
    bulletPoints: string;
  }>;
  virtualExps: Array<{
    id: string;
    company: string;
    roleTitle: string;
    period: string;
    problemScope: string;
    actionTaken: string;
    outcome: string;
  }>;
}

interface ProfileState {
  activeProfileSlug: "roushan" | "ayushi";
  activeProfile: ProfileData | null;
  allProfiles: ProfileData[];
  isLoading: boolean;
  setActiveProfileSlug: (slug: "roushan" | "ayushi") => void;
  setAllProfiles: (profiles: ProfileData[]) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  activeProfileSlug: "roushan",
  activeProfile: null,
  allProfiles: [],
  isLoading: true,

  setActiveProfileSlug: (slug) =>
    set((state) => {
      const matched = state.allProfiles.find((p) => p.slug === slug) || null;
      return { activeProfileSlug: slug, activeProfile: matched };
    }),

  setAllProfiles: (profiles) =>
    set((state) => {
      const active = profiles.find((p) => p.slug === state.activeProfileSlug) || profiles[0] || null;
      return { allProfiles: profiles, activeProfile: active, isLoading: false };
    }),

  setIsLoading: (loading) => set({ isLoading: loading }),
}));
