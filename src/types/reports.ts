export interface Student {
  student_name: string;
  average: number;
  total: number;
  stream: string;
  position: number;
}

export interface TopStudentsPerClass {
  class_name: string;
  stream: string;
  students: Student[];
}

export interface Champion {
  student_name: string;
  stream: string;
  marks: number;
  subject: string;
}

export interface SubjectChampionsPerClass {
  class_name: string;
  stream: string;
  champions: Champion[];
}

export interface StreamWithinClass {
  stream: string;
  class_name: string;
  average: number;
  position: number;
  total_students: number;
}

export interface StreamRanking {
  class_level: string;
  class_average: number;
  class_position: number;
  streams: StreamWithinClass[];
}

export interface PieChartData {
  stream: string;
  top_students: number;
  subject_champions: number;
  total_classes: number;
}

export interface ReportsData {
  top_students_per_class: TopStudentsPerClass[];
  subject_champions: SubjectChampionsPerClass[];
  stream_rankings: StreamRanking[];
  pie_chart_data: PieChartData[];
  message?: string;
}