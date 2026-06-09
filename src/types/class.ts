import type { SatisfactionScore } from './student';
import type { SourceClassColor } from '../utils/sourceClassColors';

export type { SourceClassColor };

export type ClassSizeMode = 'strict' | 'flexible';

export interface SourceClass {
  id: string;
  name: string;
  color: SourceClassColor | null;
  createdAt: string;
}

export interface Class {
  id: string;
  name: string;
  targetSize: number;
  teacherName?: string;
  createdAt: Date;
}

export interface ClassStatistics {
  classId: string;
  className: string;
  totalStudents: number;
  genderDistribution: {
    male: number;
    female: number;
  };
  ealCount: number;
  ealPercentage: number;
  averageSatisfaction: number;
  studentSatisfaction: SatisfactionScore[];
}

export interface SortingConfiguration {
  numberOfClasses: number;
  classSizeMode: ClassSizeMode;
  priorityWeights: {
    friendPreference: number;        // Weight for friend placement (0-1)
    classSizeBalance: number;        // Weight for keeping classes near target sizes (0-1)
    genderBalance: number;           // Weight for gender balance (0-1)
    ealBalance: number;              // Weight for EAL distribution (0-1)
    behaviorBalance: number;         // Weight for behavior balance (0-1)
    abilityBalance: number;          // Weight for ability balance (0-1)
    ehcpBalance: number;             // Weight for EHCP distribution (0-1)
    sendBalance: number;             // Weight for SEND distribution (0-1)
    monitoringSenBalance: number;    // Weight for Monitoring SEN distribution (0-1)
    ppgBalance: number;              // Weight for PPG distribution (0-1)
    slBalance: number;               // Weight for S&L distribution (0-1)
    sourceClassBalance: number;      // Weight for source class distribution (0-0.5)
  };
  maxIterations: number;
  largerClassId: string | null;
}

export interface SizeCompliance {
  targetSizes: number[];
  actualSizes: number[];
  isExact: boolean;
  maxDeviation: number;
  classTargets: Record<string, number>;
  classActualSizes: Record<string, number>;
  classDeviations: Record<string, number>;
}

export interface SortingResult {
  assignments: Record<string, string>;  // studentId -> classId
  overallSatisfaction: number;
  iterationsUsed: number;
  classStatistics: ClassStatistics[];
  classSizeMode: ClassSizeMode;
  violations: ConstraintViolation[];
  sizeCompliance: SizeCompliance;
  strictOverrideApplied: boolean;
}

export interface ConstraintViolation {
  type: 'keep_apart' | 'must_be_with' | 'class_size';
  scope: 'auto_sort' | 'manual_edit';
  studentId: string;
  studentName?: string;
  relatedStudentId?: string;
  relatedStudentName?: string;
  classId?: string;
  className?: string;
  relatedClassId?: string;
  relatedClassName?: string;
  severity: 'hard' | 'warning';
  message?: string;
}
