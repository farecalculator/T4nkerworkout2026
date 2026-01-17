export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string; // e.g., "6-10"
  notes?: string;
  category: 'push' | 'pull' | 'legs' | 'core' | 'cardio';
}

export interface WorkoutDay {
  id: string;
  day: string;
  title: string;
  focus: string;
  color: string; // Tailwind color class snippet, e.g., "red-500"
  exercises: Exercise[];
}

export interface Principle {
  id: string;
  title: string;
  description: string;
  iconName: 'Flame' | 'TrendingUp' | 'Battery' | 'Moon';
  color: string;
}

export enum ViewState {
  WEEK_VIEW = 'WEEK_VIEW',
  DAY_VIEW = 'DAY_VIEW',
  HISTORY_VIEW = 'HISTORY_VIEW'
}

export type DayStatus = 'pending' | 'completed' | 'skipped';

export interface HistoryEntry {
  id: string;
  date: string; // ISO string (Legacy/Time specific)
  localDate?: string; // YYYY-MM-DD (Locked to user's timezone at completion)
  workoutTitle: string;
  weekNumber?: number;
  rating?: number;
  exercises: {
    name: string;
    weight: number;
    sets: number;
    reps: string;
  }[];
}

export interface CheckIn {
  date: string; // YYYY-MM-DD (Logical date for the unique constraint)
  localDate?: string; // Explicit local date backup
  timestamp?: string; // ISO String (Specific time of check-in)
  mood: string; // Emoji char
  bodyWeight: number; // in KG
}

export interface Program {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  durationWeeks: number;
  schedule: WorkoutDay[];
  isActive: boolean;
  createdAt: string;
}

export interface UserData {
  currentWeek: number;
  weights: Record<string, number>; // exerciseId -> last weight in kg
  weekStatus: Record<string, DayStatus>; // dayId -> status
  history: HistoryEntry[];
  checkIns: CheckIn[]; // Daily logs of mood/weight
  skippedDates?: string[]; // List of YYYY-MM-DD dates that were explicitly skipped
  customPlan?: WorkoutDay[]; // Legacy field: Allow users to modify the plan
  programs?: Program[]; // New field: List of all programs
  backgroundImage?: string; // Custom user background
  bgOverlayOpacity?: number; // 0.0 to 1.0, controls visibility of BG (Lower is more visible image)
  activeTheme?: string; // The ID of the currently selected theme
}