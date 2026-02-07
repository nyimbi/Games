/**
 * Game type definitions
 */

// Game categories
export type GameCategory = 'scholars_bowl' | 'writing' | 'challenge' | 'debate';

// All game types
export type GameType =
  // Scholar's Bowl
  | 'buzzer_battle'
  | 'category_challenge'
  | 'team_trivia_night'
  | 'scavenger_bowl'
  // Collaborative Writing
  | 'story_chain'
  | 'essay_sprint'
  | 'role_based_writing'
  | 'argument_tennis'
  // Scholar's Challenge
  | 'flashcard_frenzy'
  | 'pattern_puzzles'
  | 'quickfire_quiz'
  | 'elimination_olympics'
  // Team Debate
  | 'mini_debate'
  | 'role_play_debates'
  | 'argument_builder'
  | 'impromptu_challenge'
  // New viral games
  | 'connection_quest'
  | 'scholar_sprint'
  | 'treasure_hunt'
  | 'argument_arena'
  | 'memory_mosaic';

// Game sync types
export type SyncType = 'real_time' | 'turn_based' | 'synchronized' | 'parallel' | 'individual' | 'role_assigned' | 'collaborative';

// Game definition
export interface GameDefinition {
  type: GameType;
  name: string;
  description: string;
  category: GameCategory;
  min_players: number;
  max_players: number;
  duration_minutes: number;
  sync_type: SyncType;
  icon: string;
}

// Player in game
export interface GamePlayer {
  id: string;
  display_name: string;
  avatar_color: string;
  avatar?: string;
  score: number;
  is_ready: boolean;
  is_connected: boolean;
  role?: 'coach' | 'player';
}

// Question types
export interface Question {
  id: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  text: string;
  options: string[];
  correct_index: number;
  explanation?: string;
  time_limit_seconds: number;
  // Enhanced fields for WSC 2026
  theme_connection?: string;
  deep_explanation?: string;
  related_questions?: string[];
  tags?: string[];
}

// Reading Comprehension types
export interface PassageQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  paragraph_ref?: number;
}

export interface ReadingPassage {
  id: string;
  title: string;
  content: string;
  subject: string;
  theme_connection?: string;
  questions: PassageQuestion[];
}

// Achievement types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'streak' | 'mastery' | 'speed' | 'exploration' | 'special';
  condition: (stats: PlayerStats) => boolean;
}

export interface UnlockedAchievement {
  id: string;
  unlockedAt: string;
}

// Player stats for tracking
export interface PlayerStats {
  totalQuestionsAnswered: number;
  correctAnswers: number;
  currentStreak: number;
  longestStreak: number;
  gamesPlayed: number;
  dailyStreak: number;
  subjectAccuracy: Record<string, { correct: number; total: number }>;
  fastestCorrectMs: number;
  perfectRounds: number;
  totalTimePlayed: number;
  // New viral game stats
  connectionPuzzlesSolved: number;
  connectionPerfects: number;
  connectionDailyCount: number;
  sprintBestDistance: number;
  sprintMaxMultiplier: number;
  sprintPowerUpsUsed: Set<string> | string[];
  mosaicPerfects: number;
  mosaicBestCombo: number;
  mosaicGridsCompleted: string[];
  arenaWins: number;
  arenaRoundsWon: number;
  arenaDevilBeaten: boolean;
  arenaRebuttalWins: number;
  treasureStars: number;
  treasureRegionsComplete: number;
  treasureBridgesComplete: number;
}

// Wrong answer entry
export interface WrongAnswerEntry {
  questionId: string;
  question: string;
  subject: string;
  userAnswer: string;
  correctAnswer: string;
  explanation?: string;
  deep_explanation?: string;
  timestamp: string;
  reviewCount: number;
  nextReview: string;
  learned: boolean;
}

// Spaced repetition card state
export interface FlashcardProgress {
  questionId: string;
  easeFactor: number;
  interval: number;
  nextReview: string;
  repetitions: number;
}

// Daily challenge state
export interface DailyStreakData {
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate: string;
  completedDates: string[];
  todayScore?: number;
  todayCompleted: boolean;
}

export interface WritingPrompt {
  id: string;
  topic: string;
  instructions: string;
  word_limit?: number;
  time_limit_minutes: number;
}

export interface DebateTopic {
  id: string;
  topic: string;
  pro_position: string;
  con_position: string;
  prep_time_minutes: number;
  speech_time_minutes: number;
}

// Game state phases
export type GamePhase =
  | 'waiting'      // Waiting for players
  | 'countdown'    // Starting countdown
  | 'playing'      // Active gameplay
  | 'answering'    // Waiting for answers
  | 'revealing'    // Showing correct answer
  | 'scoring'      // Showing scores
  | 'transition'   // Between questions/rounds
  | 'ended';       // Game complete

// Base game state
export interface BaseGameState {
  phase: GamePhase;
  current_round: number;
  total_rounds: number;
  time_remaining: number;
  players: GamePlayer[];
  is_paused: boolean;
}

// Buzzer Battle specific state
export interface BuzzerBattleState extends BaseGameState {
  current_question: Question | null;
  buzzed_player_id: string | null;
  buzz_order: string[];
  can_buzz: boolean;
}

// Quiz game state (for various quiz-type games)
export interface QuizGameState extends BaseGameState {
  current_question: Question | null;
  answers_submitted: Record<string, number>;
  revealed: boolean;
}

// Writing game state
export interface WritingGameState extends BaseGameState {
  prompt: WritingPrompt | null;
  submissions: Record<string, string>;
  current_writer_id: string | null;
}

// Debate game state
export interface DebateGameState extends BaseGameState {
  topic: DebateTopic | null;
  current_speaker_id: string | null;
  speaker_order: string[];
  positions: Record<string, 'pro' | 'con'>;
}

// Union type for all game states
export type GameState =
  | BuzzerBattleState
  | QuizGameState
  | WritingGameState
  | DebateGameState;

// Student profile for adaptive explanations
export interface StudentProfile {
  gradeLevel: number | null; // 4-12, null = not set
  inferredLevel: 'beginner' | 'intermediate' | 'advanced' | null;
  profileSetAt: string | null;
  lastInferredAt: string | null;
}

export type StudentLevel = 'beginner' | 'intermediate' | 'advanced';

export interface ExplanationConfig {
  maxTokens: number;
  complexity: string;
  vocabulary: string;
  sentences: string;
}

// Game actions
export interface GameAction {
  type: string;
  payload?: any;
}

// Buzzer Battle actions
export interface BuzzAction extends GameAction {
  type: 'BUZZ';
}

export interface AnswerAction extends GameAction {
  type: 'ANSWER';
  payload: {
    answer_index: number;
  };
}

export interface SubmitWritingAction extends GameAction {
  type: 'SUBMIT_WRITING';
  payload: {
    content: string;
  };
}

export interface StartSpeakingAction extends GameAction {
  type: 'START_SPEAKING';
}

export interface EndSpeakingAction extends GameAction {
  type: 'END_SPEAKING';
}

// Game result
export interface GameResult {
  game_type: GameType;
  session_id: string;
  started_at: string;
  ended_at: string;
  players: Array<{
    id: string;
    display_name: string;
    score: number;
    rank: number;
  }>;
  winner_id?: string;
  stats: Record<string, any>;
}
