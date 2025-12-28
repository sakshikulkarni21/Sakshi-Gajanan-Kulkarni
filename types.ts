
export interface PoseResult {
  landmarks: any;
  worldLandmarks: any;
}

export interface Feedback {
  text: string;
  type: 'success' | 'warning' | 'info';
  timestamp: number;
}

export interface DanceSession {
  score: number;
  combo: number;
  maxCombo: number;
  calories: number;
  duration: number;
}

export interface DanceMove {
  id: string;
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
}
