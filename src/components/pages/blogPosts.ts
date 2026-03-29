export interface BlogPost {
  slug: string;
  title: string;
  summary: string;
  category: string;
  readTime: string;
  problem: string;
  solution: string;
  outcomes: string[];
  implementationPlan: string[];
  cta: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'cbc-reporting-kenya-competency-without-chaos',
    title: 'CBC in Kenya: Track Competencies Without Manual Chaos',
    summary:
      'A practical operating model for turning classroom evidence into reliable CBC reports that parents trust and school leaders can act on.',
    category: 'Kenya CBC',
    readTime: '7 min read',
    problem:
      'Many schools still use fragmented sheets and teacher-specific templates for CBC assessment. This creates inconsistent grading, delayed reporting, and weak visibility for school leaders.',
    solution:
      'Use a single result workflow: standard competency rubrics, centralized evidence capture, automated grading rules, and parent-ready report publishing from one system.',
    outcomes: [
      'Reduce end-term report preparation time by 50%+',
      'Improve consistency of competency interpretation across classes',
      'Give principals a real-time view of learning trends and intervention needs',
      'Strengthen parent confidence through clear and timely reports',
    ],
    implementationPlan: [
      'Define grade-level competency frameworks and rubrics',
      'Configure subject and class assessment templates in the system',
      'Train teachers on weekly evidence entry standards',
      'Run one term with structured moderation checkpoints',
      'Publish parent reports and track turnaround KPIs',
    ],
    cta: 'If your school wants CBC reporting that is accurate, timely, and leadership-ready, request a guided setup session.',
  },
  {
    slug: 'kenya-school-finance-playbook-collections-reconciliation-visibility',
    title: 'Kenya School Finance Playbook: Collections, Reconciliation, Visibility',
    summary:
      'A proven framework for reducing fee leakage, accelerating collections, and improving financial trust with parents.',
    category: 'Kenya Finance',
    readTime: '8 min read',
    problem:
      'Manual fee tracking and disconnected payment records create delayed follow-ups, unclear balances, and disputes that slow collections and damage parent trust.',
    solution:
      'Adopt invoice-first finance operations: structured billing, automated receipts, real-time balances, reminder cycles, and reconciliation-ready reports.',
    outcomes: [
      'Increase on-time fee payments through predictable reminders',
      'Reduce reconciliation effort with cleaner transaction trails',
      'Improve cashflow predictability for school planning',
      'Deliver transparent statements that reduce parent disputes',
    ],
    implementationPlan: [
      'Standardize fee structures and billing timelines',
      'Enable digital payment channels and receipting rules',
      'Set weekly arrears and follow-up review cadence',
      'Use monthly collection dashboards for management decisions',
      'Link lost-book and other dues into one payable statement',
    ],
    cta: 'If your fee office is under pressure, we can deploy a finance workflow that improves both collection speed and parent trust.',
  },
  {
    slug: 'from-timetable-conflicts-to-teaching-time-kenyan-blueprint',
    title: 'From Timetable Conflicts to Teaching Time: A Kenyan Operations Blueprint',
    summary:
      'How schools can move from fragile manual timetables to stable scheduling that protects instructional time.',
    category: 'Kenya Operations',
    readTime: '6 min read',
    problem:
      'Manual timetables often break due to teacher overlaps, uneven workloads, and late adjustments. The result is lost lessons, frustrated staff, and weak execution.',
    solution:
      'Use constraint-driven timetable generation with teacher-subject mapping, frequency controls, conflict detection, and controlled publishing.',
    outcomes: [
      'Reduce timetable conflicts before term launch',
      'Improve teaching-time utilization across departments',
      'Balance workloads with clear assignment logic',
      'Cut emergency timetable changes during active term weeks',
    ],
    implementationPlan: [
      'Clean teacher, subject, and class assignment data',
      'Set frequency and blocking constraints per grade',
      'Generate and review draft timetable with conflict reports',
      'Approve and publish class and teacher schedules',
      'Run weekly variance checks for schedule stability',
    ],
    cta: 'If your timetable process is a recurring bottleneck, we can implement a conflict-aware scheduling workflow in days.',
  },
];

export const blogPostBySlug = blogPosts.reduce<Record<string, BlogPost>>((acc, item) => {
  acc[item.slug] = item;
  return acc;
}, {});
