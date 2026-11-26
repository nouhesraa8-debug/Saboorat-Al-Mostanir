export type ShapeType =
  | 'line'
  | 'arrow'
  | 'rect'
  | 'square'
  | 'circle'
  | 'ellipse'
  | 'triangle'
  | 'star'
  | 'rhombus'
  | 'hexagon'
  | 'double_arrow'
  | 'dashed_line'
  | 'arc'
  | 'heart'
  | 'checkmark'
  | 'cross';

export type ToolType =
  | 'pen'
  | 'pen_thin'
  | 'pen_thick'
  | 'highlighter'
  | 'eraser'
  | ShapeType
  | 'text'
  | 'note'
  | 'sticky'
  | 'image'
  | 'select'
  | 'pan';

export interface Point {
  x: number;
  y: number;
}

export type ElementType = 'stroke' | 'shape' | 'text' | 'image' | 'note' | 'sticky';

export type BoardBackground =
  | 'plain'
  | 'grid'
  | 'lined'
  | 'notebook'
  | 'dots'
  | 'green'
  | 'dark'
  | 'notes'
  | 'quran'
  | 'english';

export type BackgroundType = BoardBackground;

export interface WhiteboardElement {
  id: string;
  type?: ElementType;
  tool: ToolType;
  points?: Point[];
  x: number;
  y: number;
  width?: number;
  height?: number;
  color: string;
  strokeWidth: number;
  opacity?: number;
  text?: string;
  fontSize?: number;
  isBold?: boolean;
  align?: 'right' | 'center' | 'left';
  imageUrl?: string;
  noteColor?: string;
  rotation?: number;
  stageId?: string;
  isLocked?: boolean;
  fillBackground?: boolean;
  isCelebrationBadge?: boolean;
  badgeTitle?: string;
  badgeIcon?: string;
  badgeStudentName?: string;
  questionData?: {
    id: string;
    questionText: string;
    surah?: string;
    type: string;
    options?: string[];
    correctAnswer: string;
    explanation?: string;
    points?: number;
  };
  createdBy?: {
    id: string;
    name: string;
    role: 'admin' | 'teacher' | 'student' | 'guest';
    color: string;
  };
  timestamp?: number;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student' | 'guest';
}

export interface QuestionItem {
  id: string;
  userId: string;
  type: 'mcq' | 'true_false' | 'open' | 'complete_verse' | 'match_surah' | 'tajweed' | 'vocabulary' | 'multiple_choice' | 'missing_word' | 'guess_surah' | 'tajweed_rule';
  questionText: string;
  surah?: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  points?: number;
  circleId?: string;
  createdAt?: number;
}

export interface ClassCircle {
  id: string;
  teacherId: string;
  name: string;
  description?: string;
  studentNames: string[];
  color?: string;
  createdAt?: number;
}

export interface PointItem {
  id: string;
  teacherId: string;
  circleId?: string;
  entityName: string;
  type: 'student' | 'team';
  score: number;
  reasons: string[];
  updatedAt?: number;
}

export interface WheelItem {
  id: string;
  userId: string;
  title: string;
  circleId?: string;
  items: string[];
  createdAt?: number;
}

export interface LessonStage {
  id: string;
  order: number;
  title: string;
  description?: string;
  isRevealed: boolean;
  revealedAt?: number;
}

export interface RevealPathState {
  enabled: boolean;
  activeStageId: string | null;
  stages: LessonStage[];
}

export interface RulerState {
  visible: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
}

export interface ProtractorState {
  visible: boolean;
  x: number;
  y: number;
  radius: number;
  angle: number;
}

export interface CompassState {
  visible: boolean;
  x: number;
  y: number;
  radius: number;
  angle: number;
}

export interface RemoteCursor {
  id: string;
  name: string;
  role: 'teacher' | 'student';
  color: string;
  x: number;
  y: number;
}

export interface Participant {
  id: string;
  name: string;
  role: 'teacher' | 'student';
  color: string;
}

export interface SessionState {
  active: boolean;
  roomId: string | null;
  role: 'teacher' | 'student';
  studentName: string;
  studentColor?: string;
  allowStudentDraw: boolean;
  participants: Participant[];
}

export interface SurahMeta {
  number: number;
  name: string;
  englishName: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
}

export interface QuranAyah {
  number: number;
  numberInSurah: number;
  text: string;
}

export interface BoardPage {
  id: string;
  title: string;
  elements: WhiteboardElement[];
  background: BoardBackground;
  createdAt?: number;
}

export interface SavedBoard {
  id: string;
  title: string;
  createdAt: number;
  background: BackgroundType;
  elements: WhiteboardElement[];
  thumbnail?: string;
}
