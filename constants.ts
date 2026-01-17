import { WorkoutDay, Principle, Exercise } from './types';

export const APP_THEMES = {
  cartoon: {
    id: 'cartoon',
    name: 'Toon Force',
    colors: {
      '--theme-primary': '#ef4444', // Red
      '--theme-secondary': '#facc15', // Yellow
      '--theme-accent': '#000000', // Black
      '--theme-highlight': '#3b82f6', // Blue
      '--theme-bg': '#ef4444',
      '--theme-card-bg': '#ffffff',
    }
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    colors: {
      '--theme-primary': '#7c3aed', 
      '--theme-secondary': '#0891b2', 
      '--theme-accent': '#db2777', 
      '--theme-highlight': '#2563eb', 
      '--theme-bg': '#030014', 
      '--theme-card-bg': '#0f0728', 
    }
  },
  spartan: {
    id: 'spartan',
    name: 'Spartan Gold',
    colors: {
      '--theme-primary': '#b91c1c', 
      '--theme-secondary': '#b45309', 
      '--theme-accent': '#c2410c', 
      '--theme-highlight': '#991b1b', 
      '--theme-bg': '#0c0a09', 
      '--theme-card-bg': '#1c1917', 
    }
  }
};

export const WORKOUT_PLAN: WorkoutDay[] = [
  {
    id: 'mon',
    day: 'Monday',
    title: 'PUSH 1',
    focus: 'Chest + Shoulders + Triceps',
    color: 'red',
    exercises: [
      { id: 'm1', name: 'Flat Bench Press (Barbell or Smith)', sets: 4, reps: '6–10', category: 'push' },
      { id: 'm2', name: 'Incline Dumbbell Press', sets: 3, reps: '8–12', category: 'push' },
      { id: 'm3', name: 'Cable Chest Fly', sets: 3, reps: '12–15', category: 'push' },
      { id: 'm4', name: 'Seated Dumbbell Shoulder Press', sets: 3, reps: '8–12', category: 'push' },
      { id: 'm5', name: 'Dumbbell Lateral Raise', sets: 3, reps: '12–15', category: 'push' },
      { id: 'm6', name: 'Cable Triceps Pushdown', sets: 3, reps: '10–15', category: 'push' },
    ]
  },
  {
    id: 'tue',
    day: 'Tuesday',
    title: 'PULL 1',
    focus: 'Back + Biceps',
    color: 'blue',
    exercises: [
      { id: 'tu1', name: 'Lat Pulldown or Assisted Pull-up', sets: 4, reps: '8–12', category: 'pull' },
      { id: 'tu2', name: 'Seated Cable Row or Machine Row', sets: 3, reps: '8–12', category: 'pull' },
      { id: 'tu3', name: 'Single-arm Dumbbell Row (Bench Supported)', sets: 3, reps: '10–12 each', category: 'pull' },
      { id: 'tu4', name: 'Face Pulls (Rear Delts)', sets: 3, reps: '12–15', category: 'pull' },
      { id: 'tu5', name: 'Standing Dumbbell Biceps Curl', sets: 3, reps: '10–15', category: 'pull' },
      { id: 'tu6', name: 'Hammer Curl', sets: 2, reps: '10–12', category: 'pull', notes: '2-3 sets' },
    ]
  },
  {
    id: 'wed',
    day: 'Wednesday',
    title: 'LEGS 1 (Heavy)',
    focus: 'Quads + Hamstrings + Calves',
    color: 'green',
    exercises: [
      { id: 'w1', name: 'Squat (Smith, Barbell, or Goblet)', sets: 4, reps: '6–10', category: 'legs' },
      { id: 'w2', name: 'Leg Press', sets: 3, reps: '8–12', category: 'legs' },
      { id: 'w3', name: 'Romanian Deadlift (Barbell or DB)', sets: 3, reps: '8–12', category: 'legs' },
      { id: 'w4', name: 'Leg Curl (Lying or Seated)', sets: 3, reps: '10–15', category: 'legs' },
      { id: 'w5', name: 'Standing or Seated Calf Raise', sets: 4, reps: '12–20', category: 'legs' },
    ]
  },
  {
    id: 'thu',
    day: 'Thursday',
    title: 'PUSH 2 (Upper Focus)',
    focus: 'Chest + Shoulders + Triceps (Angles)',
    color: 'purple',
    exercises: [
      { id: 'th1', name: 'Incline Bench (Barbell or Smith)', sets: 3, reps: '6–10', category: 'push', notes: '3-4 sets' },
      { id: 'th2', name: 'Flat Dumbbell Press or Machine Chest Press', sets: 3, reps: '8–12', category: 'push' },
      { id: 'th3', name: 'Cable Fly (High-to-Low or Low-to-High)', sets: 3, reps: '12–15', category: 'push' },
      { id: 'th4', name: 'Dumbbell Shoulder Press OR Arnold Press', sets: 3, reps: '8–12', category: 'push' },
      { id: 'th5', name: 'Dumbbell Lateral Raise', sets: 3, reps: '12–15', category: 'push' },
      { id: 'th6', name: 'Overhead Triceps Extension (DB or Cable)', sets: 3, reps: '10–15', category: 'push' },
    ]
  },
  {
    id: 'fri',
    day: 'Friday',
    title: 'LEGS 2 + CORE',
    focus: 'Glutes, Hamstrings, Quads, Abs',
    color: 'yellow',
    exercises: [
      { id: 'f1', name: 'Walking Lunges (DB or Bodyweight)', sets: 3, reps: '10–12 steps/leg', category: 'legs' },
      { id: 'f2', name: 'Bulgarian Split Squats', sets: 3, reps: '8–12 each', category: 'legs' },
      { id: 'f3', name: 'Hip Thrust or Glute Bridge', sets: 3, reps: '10–15', category: 'legs' },
      { id: 'f4', name: 'Leg Curl (Hamstring Focus)', sets: 3, reps: '10–15', category: 'legs' },
      { id: 'f5', name: 'Calf Raises (Any Machine)', sets: 3, reps: '15–20', category: 'legs' },
      { id: 'f6', name: 'Core: Plank, Leg Raise, or Cable Crunch', sets: 3, reps: 'Varied', category: 'core', notes: 'Choose 2 exercises' },
    ]
  }
];

export const ALTERNATIVE_EXERCISES: Record<string, Partial<Exercise>[]> = {
  push: [
    { name: 'Push-Ups', sets: 3, reps: 'Failure' },
    { name: 'Machine Chest Press', sets: 3, reps: '8-12' },
    { name: 'Dips', sets: 3, reps: '8-12' },
    { name: 'Skullcrushers', sets: 3, reps: '10-12' },
  ],
  pull: [
    { name: 'Pull-Ups', sets: 3, reps: '6-10' },
    { name: 'T-Bar Row', sets: 3, reps: '8-12' },
    { name: 'Preacher Curl', sets: 3, reps: '10-12' },
  ],
  legs: [
    { name: 'Hack Squat', sets: 3, reps: '8-12' },
    { name: 'Front Squat', sets: 3, reps: '6-10' },
    { name: 'Sumo Deadlift', sets: 3, reps: '5-8' },
  ],
  core: [
    { name: 'Hanging Leg Raise', sets: 3, reps: '10-15' },
    { name: 'Cable Woodchoppers', sets: 3, reps: '12-15' },
  ]
};

export const PRINCIPLES: Principle[] = [
  {
    id: 'warmup',
    title: 'Warm-up',
    description: '5-10 mins movement. Don\'t skip this.',
    iconName: 'Flame',
    color: 'orange'
  },
  {
    id: 'progressive',
    title: 'Progression',
    description: 'Add weight when it feels easy. Force growth.',
    iconName: 'TrendingUp',
    color: 'blue'
  },
  {
    id: 'recovery',
    title: 'Sleep & Food',
    description: 'Eat big. Sleep big. Grow big.',
    iconName: 'Moon',
    color: 'indigo'
  }
];