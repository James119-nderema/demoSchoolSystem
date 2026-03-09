import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  BookOpen, FileText, CreditCard, Users, CheckCircle, ArrowRight,
  Receipt, Banknote,
  Shield, Settings,
  Scale, Image,
  Layers, Target, Zap, Star, Info, Download, Loader2,
} from 'lucide-react';

/* ════════════════════════════════════════════════════════════════════════════
   FINANCE GUIDE — Comprehensive walkthrough of the entire finance system.
   Photo placeholders use the <ScreenshotPlaceholder> component so you can
   easily swap in real images later.
   ════════════════════════════════════════════════════════════════════════════ */

export default function FinanceGuide() {
  const pageRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    if (!pageRef.current) return;
    setDownloading(true);
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth  = pdf.internal.pageSize.getWidth();   // 210
      const pageHeight = pdf.internal.pageSize.getHeight();  // 297
      const margin = 10;
      const usableWidth  = pageWidth  - margin * 2;          // 190
      const usableHeight = pageHeight - margin * 2;          // 277
      let cursorY = margin;

      // Gather every direct child of the page container as a "block"
      const blocks = Array.from(pageRef.current.children) as HTMLElement[];

      for (const block of blocks) {
        const canvas = await html2canvas(block, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#f9fafb',
          windowWidth: pageRef.current.scrollWidth,
        });

        const imgData   = canvas.toDataURL('image/png');
        const imgWidth  = usableWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // If this block alone is taller than a full page, tile it across pages
        if (imgHeight > usableHeight) {
          let srcY = 0;
          const totalSrcH = canvas.height;
          while (srcY < totalSrcH) {
            if (cursorY > margin) { pdf.addPage(); cursorY = margin; }
            const sliceH  = Math.min(
              totalSrcH - srcY,
              (usableHeight / imgHeight) * totalSrcH
            );
            const sliceMM = (sliceH * imgWidth) / canvas.width;

            // Draw from a temporary cropped canvas to avoid cutting mid-block
            const tmp    = document.createElement('canvas');
            tmp.width    = canvas.width;
            tmp.height   = sliceH;
            tmp.getContext('2d')!.drawImage(
              canvas, 0, srcY, canvas.width, sliceH, 0, 0, canvas.width, sliceH
            );
            pdf.addImage(tmp.toDataURL('image/png'), 'PNG', margin, cursorY, imgWidth, sliceMM);
            cursorY = margin + sliceMM;
            srcY   += sliceH;
            if (srcY < totalSrcH) { pdf.addPage(); cursorY = margin; }
          }
          continue;
        }

        // Normal block — if it won't fit on the current page, start a new one
        if (cursorY + imgHeight > pageHeight - margin) {
          pdf.addPage();
          cursorY = margin;
        }

        pdf.addImage(imgData, 'PNG', margin, cursorY, imgWidth, imgHeight);
        cursorY += imgHeight + 2; // 2 mm gap between blocks
      }

      pdf.save('School_Finance_Guide.pdf');
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div ref={pageRef} className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* ─── Hero Header ──────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white">
        <div className="max-w-5xl mx-auto px-4 py-12 md:py-16">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <span className="bg-white/20 backdrop-blur-sm text-xs font-semibold px-3 py-1 rounded-full">Complete Guide</span>
            </div>
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {downloading ? 'Generating PDF…' : 'Download as PDF'}
            </button>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3">School Finance System Guide</h1>
          <p className="text-blue-100 text-lg max-w-2xl">
            A step-by-step walkthrough of the entire financial workflow — from creating invoices and collecting fees,
            to managing payroll, recording expenses, and generating balance sheets.
          </p>

          {/* Quick-jump pills */}
          <div className="flex flex-wrap gap-2 mt-8">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-full text-xs font-medium transition-colors"
              >
                {s.icon} {s.shortTitle}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Flow Diagram ─────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 -mt-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" /> End-to-End Financial Flow
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-medium">
            {FLOW_STEPS.map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border ${step.color}`}>
                  {step.icon}
                  <span>{step.label}</span>
                </div>
                {i < FLOW_STEPS.length - 1 && <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Content Sections ─────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
        {SECTIONS.map(section => (
          <Section
            key={section.id}
            section={section}
          />
        ))}

        {/* ─── Tips Section ───────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-100 p-6">
          <h3 className="text-lg font-bold text-amber-800 flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-amber-500" /> Pro Tips
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <TipCard
              title="Automate Deductions"
              text="Set up PAYE brackets and statutory rates once in Deduction Settings. All new salary structures will auto-calculate deductions."
            />
            <TipCard
              title="Budget Simulation"
              text="Run budget simulations monthly to compare planned vs actual. The system automatically pulls real revenue and expense data."
            />
            <TipCard
              title="Reconcile Daily"
              text="Check the Reconcile page daily to match M-Pesa and bank transactions with student accounts. This keeps your records accurate."
            />
            <TipCard
              title="Expense Approval Workflow"
              text="All expenses start as 'Pending'. Only approved expenses can be paid. This ensures proper authorization before any disbursement."
            />
            <TipCard
              title="Balance Sheet Date Filter"
              text="Use the date filter on the Balance Sheet page to view point-in-time snapshots — great for end-of-term or audit preparation."
            />
            <TipCard
              title="PDF Statements"
              text="Parents can download PDF fee statements from their portal. These include a full ledger of invoiced fees and payments."
            />
          </div>
        </div>

        {/* ─── Roles Reference ────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-blue-500" /> Role-Based Access
          </h3>
          <p className="text-sm text-gray-500 mb-4">Different staff roles see different features. Here's who can access what:</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Feature</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-gray-600">Bursar</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-gray-600">Admin Staff</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-gray-600">Principal</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-gray-600">Teacher</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-gray-600">Parent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ROLE_TABLE.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50/60">
                    <td className="px-4 py-2 font-medium text-gray-700">{row.feature}</td>
                    {row.access.map((a, j) => (
                      <td key={j} className="px-4 py-2 text-center">
                        {a ? <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" /> : <span className="text-gray-300">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-8 text-sm text-gray-400">
          <p>This guide covers all finance modules of the School Management System.</p>
          <p className="mt-1">For technical support, contact your system administrator.</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTION COMPONENT — Expandable guide section
   ═══════════════════════════════════════════════════════════════════════════════ */

interface SectionData {
  id: string;
  shortTitle: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;
  gradient: string;
  steps: StepData[];
}

interface StepData {
  title: string;
  description: string;
  features?: string[];
  screenshotAlt: string;
  screenshotHint: string;
  screenshotSrc?: string;
  tip?: string;
}

function Section({ section }: { section: SectionData }) {
  return (
    <div id={section.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden scroll-mt-6">
      {/* Header — static, no toggle */}
      <div className="flex items-center gap-4 p-5 md:p-6">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${section.gradient} flex items-center justify-center text-white shrink-0`}>
          {section.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-gray-900">{section.title}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{section.subtitle}</p>
        </div>
      </div>

      {/* Content — always visible */}
      <div className="px-5 md:px-6 pb-6 space-y-8">
        <div className="h-px bg-gray-100" />

          {section.steps.map((step, i) => (
            <div key={i} className="relative">
              {/* Step connector line */}
              {i < section.steps.length - 1 && (
                <div className="absolute left-[17px] top-10 bottom-0 w-0.5 bg-gray-100" />
              )}

              <div className="flex gap-4">
                {/* Step number */}
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${section.gradient} flex items-center justify-center text-white text-sm font-bold shrink-0 z-10`}>
                  {i + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">{step.description}</p>

                  {/* Features list */}
                  {step.features && step.features.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {step.features.map((f, fi) => (
                        <span key={fi} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-600">
                          <CheckCircle className="w-3 h-3 text-emerald-500" /> {f}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Tip callout */}
                  {step.tip && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-3 flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-700">{step.tip}</p>
                    </div>
                  )}

                  {/* Screenshot — pass screenshotSrc to show a real image */}
                  <ScreenshotPlaceholder alt={step.screenshotAlt} hint={step.screenshotHint} src={step.screenshotSrc} />
                </div>
              </div>
            </div>
          ))}
        </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SCREENSHOT PLACEHOLDER — Pass a `src` prop to show a real image.
   When no `src` is provided the dashed placeholder is rendered instead.
   ═══════════════════════════════════════════════════════════════════════════════ */

function ScreenshotPlaceholder({ alt, hint, src }: { alt: string; hint: string; src?: string }) {
  if (src) {
    return (
      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
        <img src={src} alt={alt} className="w-full rounded-xl" loading="lazy" />
      </div>
    );
  }

  return (
    <div className="relative group rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 overflow-hidden hover:border-blue-300 hover:bg-blue-50/30 transition-colors">
      <div className="flex flex-col items-center justify-center py-12 px-6">
        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
          <Image className="w-7 h-7 text-gray-400 group-hover:text-blue-500 transition-colors" />
        </div>
        <p className="text-sm font-semibold text-gray-500 group-hover:text-blue-600 transition-colors">{alt}</p>
        <p className="text-xs text-gray-400 mt-1 text-center max-w-sm">{hint}</p>
      </div>
    </div>
  );
}

function TipCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="bg-white/80 rounded-xl p-4 border border-amber-100">
      <h4 className="text-sm font-bold text-amber-800 mb-1">{title}</h4>
      <p className="text-xs text-amber-700 leading-relaxed">{text}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   DATA — All guide content defined here for easy editing
   ═══════════════════════════════════════════════════════════════════════════════ */

const FLOW_STEPS = [
  { label: 'Create Invoices', icon: <FileText className="w-3.5 h-3.5" />, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { label: 'Parent Pays', icon: <CreditCard className="w-3.5 h-3.5" />, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { label: 'Reconcile', icon: <CheckCircle className="w-3.5 h-3.5" />, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { label: 'Record Expenses', icon: <Receipt className="w-3.5 h-3.5" />, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { label: 'Run Payroll', icon: <Users className="w-3.5 h-3.5" />, color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { label: 'Budget Plan', icon: <Target className="w-3.5 h-3.5" />, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { label: 'Balance Sheet', icon: <Scale className="w-3.5 h-3.5" />, color: 'bg-teal-50 text-teal-700 border-teal-200' },
];

const SECTIONS: SectionData[] = [
  /* ────────── 1. OVERVIEW ────────── */
  {
    id: 'overview',
    shortTitle: 'Overview',
    icon: <Layers className="w-5 h-5" />,
    title: 'System Overview',
    subtitle: 'How all the finance modules connect together',
    color: 'blue',
    gradient: 'from-blue-600 to-indigo-600',
    steps: [
      {
        title: 'The Finance Dashboard',
        description:
          'The Finance Dashboard is your central hub. It shows four key metrics at a glance: Total Invoiced, Total Paid, Total Unpaid, and Students with Outstanding Balances. Below the KPI cards you\'ll find a recent payments table and quick-action buttons to jump to invoices, payments, or reconciliation.',
        features: ['KPI Cards', 'Recent Payments Table', 'Quick Action Buttons', 'Monthly Trends'],
        screenshotAlt: 'Finance Dashboard Screenshot',
        screenshotHint: 'Capture the Bursar Dashboard showing KPI cards and the recent payments table at /finance/dashboard',
        screenshotSrc: '/screenshots/Dashboard.png',
      },
      {
        title: 'Analytics & Charts',
        description:
          'The analytics page provides visual insights into your school\'s financial health. View monthly payment trends via line charts, compare collections across classes, and see a pie-chart breakdown of which payment methods (M-Pesa, Bank Transfer, Cash, etc.) are most popular. Use the year selector to compare across academic years.',
        features: ['Monthly Trends Chart', 'Per-Class Comparison', 'Payment Method Pie Chart', 'Year Selector'],
        screenshotAlt: 'Finance Analytics Screenshot',
        screenshotHint: 'Capture the analytics page showing the line charts and pie chart at /finance',
        screenshotSrc: '/screenshots/Analytics.png',
      },
    ],
  },

  /* ────────── 2. INVOICES ────────── */
  {
    id: 'invoices',
    shortTitle: 'Invoices',
    icon: <FileText className="w-5 h-5" />,
    title: 'Step 1: Create Fee Invoices',
    subtitle: 'Bill students for tuition, transport, meals, and other fee items',
    color: 'blue',
    gradient: 'from-blue-600 to-cyan-600',
    steps: [
      {
        title: 'Navigate to Invoices',
        description:
          'From the sidebar, click Finance → Invoice. This opens the invoice management page where you can see all existing invoices with their statuses: Draft, Sent, Paid, Partially Paid, Overdue, or Cancelled. Use the search bar and filters to find specific invoices.',
        features: ['Status Badges', 'Search & Filter', 'Bulk View'],
        screenshotAlt: 'Invoice List Page Screenshot',
        screenshotHint: 'Capture the invoice list page showing the table with status badges and filters at /finance/invoices',
        screenshotSrc: '/screenshots/invoice.png'
      },
      {
        title: 'Create a New Invoice',
        description:
          'Click the "Create Invoice" button. Choose your target: a single student, multiple selected students, an entire class, or all students in the school. Next, add fee line items — each with a name (e.g., "Tuition Fee", "Transport", "Lunch Program"), amount in KES, and optional description. Set the academic year and term, then save.',
        features: ['Single/Multiple/Class/All Students', 'Custom Line Items', 'Term & Year Selection', 'Auto Invoice Numbering'],
        screenshotAlt: 'Create Invoice Modal Screenshot',
        screenshotHint: 'Capture the create invoice modal showing student selection and fee line items',
        screenshotSrc: '/screenshots/create_invoice.png',
        tip: 'You can create invoices for an entire class in one click — the system generates individual invoices for each student with the same fee items.',
      },
      {
        title: 'Manage Existing Invoices',
        description:
          'Each invoice can be edited (change items or amounts), deleted, or its status updated. Click on any invoice row to view the full details including per-student balances. Overdue invoices are automatically highlighted so you can follow up with parents.',
        features: ['Edit/Delete Invoices', 'View Student Balances', 'Overdue Highlighting'],
        screenshotAlt: 'Invoice Detail Screenshot',
        screenshotHint: 'Capture an invoice detail view showing line items and student balance',
        screenshotSrc: '/screenshots/edit_invoice.png'
      },
    ],
  },

  /* ────────── 3. PARENT PAYMENTS ────────── */
  {
    id: 'parent-payments',
    shortTitle: 'Payments',
    icon: <CreditCard className="w-5 h-5" />,
    title: 'Step 2: Parent Pays Fees',
    subtitle: 'How parents make payments via M-Pesa, bank transfer, or other methods',
    color: 'emerald',
    gradient: 'from-emerald-600 to-teal-600',
    steps: [
      {
        title: 'Parent Portal — Pay Fees Page',
        description:
          'When a parent logs in and navigates to "Pay Fees", they see their outstanding balance at the top — total fees invoiced, amount paid so far, and remaining balance. Below that, they choose from 13+ payment methods organized into two sections: Mobile Money (M-Pesa, Airtel Money, T-Kash) and Bank Transfer (Equity, KCB, Co-op, ABSA, Stanbic, Standard Chartered, DTB, NCBA, Family Bank, I&M Bank).',
        features: ['Outstanding Balance Card', 'Mobile Money Options', 'Bank Transfer Options', '13+ Payment Methods'],
        screenshotAlt: 'Parent Pay Fees Page Screenshot',
        screenshotHint: 'Capture the parent pay-fees page showing the balance card and payment method grid',
        screenshotSrc: '/screenshots/payment.png'
      },
      {
        title: 'Payment Instructions & STK Push',
        description:
          'After selecting a method, the parent sees step-by-step instructions specific to that method. For M-Pesa, the system shows the Paybill number and account format, and can trigger an STK push (a payment prompt sent directly to the parent\'s phone). For bank transfers, it shows the bank name, branch, account number, and SWIFT code. After paying, the parent enters their transaction confirmation code.',
        features: ['Method-Specific Instructions', 'M-Pesa STK Push', 'Bank Details (Branch, SWIFT)', 'Transaction Code Entry'],
        screenshotAlt: 'Payment Instructions Page Screenshot',
        screenshotHint: 'Capture the payment instructions page showing M-Pesa steps and the confirmation code form',
        screenshotSrc: '/screenshots/mpesa_pushup.png',
        tip: 'The STK push feature for M-Pesa sends a payment prompt directly to the parent\'s phone — they just enter their PIN to pay, no manual Paybill entry needed.',
      },
      {
        title: 'Payment History & PDF Statements',
        description:
          'Parents can view their full payment history in a ledger-style table showing both debits (invoiced fees) and credits (payments made), ordered chronologically. Summary cards show total invoiced, total paid, and current balance. Parents can also download a PDF statement — a professional document with the school header, student details, and a complete transaction table.',
        features: ['Ledger-Style History', 'Debit/Credit View', 'PDF Download', 'Balance Summary'],
        screenshotAlt: 'Parent Payment History Screenshot',
        screenshotHint: 'Capture the parent payment history page showing the ledger table and the PDF download button',
        screenshotSrc: '/screenshots/payment_history.png'
      },
    ],
  },

  /* ────────── 4. RECORDING PAYMENTS (BURSAR) ────────── */
  {
    id: 'record-payments',
    shortTitle: 'Record',
    icon: <Banknote className="w-5 h-5" />,
    title: 'Step 3: Record Manual Payments',
    subtitle: 'Bursar records cash, cheque, or walk-in payments against student invoices',
    color: 'amber',
    gradient: 'from-amber-500 to-orange-500',
    steps: [
      {
        title: 'Navigate to Payments',
        description:
          'From the sidebar, go to Finance → Payments. This page lists all recorded payments with stats cards at the top: total payments count, total amount collected, and filtered results count. Use the search bar and method filter to find specific payments.',
        features: ['Payment Stats Cards', 'Search by Student', 'Filter by Method'],
        screenshotAlt: 'Payments List Screenshot',
        screenshotHint: 'Capture the payments list page showing stats cards and the payment table at /finance/payments',
        screenshotSrc: '/screenshots/recorded_payments.png',
      },
      {
        title: 'Record a New Payment',
        description:
          'Click "Record Payment" to open the form. First, select the student — the system shows their outstanding invoices. Pick the invoice to apply payment against. Enter the amount (partial payments are allowed), choose the method (Cash, M-Pesa, Bank Transfer, Cheque, Other), add an optional reference number and notes, then save. The invoice balance updates automatically.',
        features: ['Student Lookup', 'Invoice Selection', 'Partial Payments', 'Multiple Methods', 'Reference Tracking'],
        screenshotAlt: 'Record Payment Modal Screenshot',
        screenshotHint: 'Capture the record payment modal showing student selection, invoice picker, and payment form fields',
        tip: 'Partial payments are fully supported. If a parent pays KES 10,000 against a KES 25,000 invoice, the invoice status changes to "Partially Paid" and the remaining KES 15,000 balance is tracked.',
        screenshotSrc: '/screenshots/manual_record.png'
      },
    ],
  },

  /* ────────── 5. RECONCILIATION ────────── */
  {
    id: 'reconciliation',
    shortTitle: 'Reconcile',
    icon: <CheckCircle className="w-5 h-5" />,
    title: 'Step 4: Reconcile Transactions',
    subtitle: 'Match M-Pesa and bank gateway transactions with student accounts',
    color: 'teal',
    gradient: 'from-teal-600 to-cyan-600',
    steps: [
      {
        title: 'Open Reconciliation Page',
        description:
          'Navigate to Finance → Reconcile. This page shows all transactions received from payment gateways (M-Pesa, Airtel Money, and all supported banks). At the top, five status counters show how many transactions are Pending, Processing, Completed, Failed, and Cancelled. Use the status and method dropdowns to filter.',
        features: ['5 Status Counters', 'Filter by Status', 'Filter by Method', 'Search'],
        screenshotAlt: 'Reconciliation Page Screenshot',
        screenshotHint: 'Capture the reconcile page showing the status counters and the transaction table at /finance/reconcile',
        screenshotSrc: '/screenshots/reconcile.png',
      },
      {
        title: 'Review and Update Transactions',
        description:
          'Each row shows the transaction reference, student, amount, payment method (with brand-colored badges for 13+ Kenyan payment providers), and current status. Click the edit icon to update a transaction\'s status — move it from Pending to Completed when confirmed, or mark as Failed if the payment bounced. Add notes for your records. Completed transactions are automatically credited to the student\'s account.',
        features: ['Inline Status Update', 'Notes Field', 'Auto-Credit on Completion', '13+ Provider Badges'],
        screenshotAlt: 'Transaction Update Screenshot',
        screenshotHint: 'Capture the inline edit view showing a transaction being moved from Pending to Completed',
        tip: 'Make reconciliation a daily habit. Unmatched transactions older than 48 hours should be investigated — contact the payment provider or parent for the correct reference code.',
        screenshotSrc: '/screenshots/reconcile_update.png'
      },
    ],
  },

  /* ────────── 6. EXPENSES ────────── */
  {
    id: 'expenses',
    shortTitle: 'Expenses',
    icon: <Receipt className="w-5 h-5" />,
    title: 'Step 5: Record & Pay School Expenses',
    subtitle: 'Track all school spending and pay suppliers via M-Pesa B2C/B2B, cash, or cheque',
    color: 'purple',
    gradient: 'from-purple-600 to-violet-600',
    steps: [
      {
        title: 'Manage Expense Categories',
        description:
          'First, set up your expense categories. Click "Manage Categories" in the top-right corner of the Expenses page. Create categories like "Office Supplies", "Utilities", "Transport", "Maintenance", "Food & Catering", etc. Each category tracks how many expenses are assigned to it.',
        features: ['Create/Edit/Delete Categories', 'Expense Count per Category'],
        screenshotAlt: 'Expense Categories Screenshot',
        screenshotHint: 'Capture the categories tab showing the category list and the Add Category button',
        screenshotSrc: '/screenshots/manage_expenses.png'
      },
      {
        title: 'Create an Expense',
        description:
          'Click "New Expense" to open the form. Fill in the title, description, amount, category, and date. Choose the intended payment method (M-Pesa, Bank Transfer, Cash, or Cheque). In the Payee Information section, enter the payee\'s name, and depending on the method — their phone number (for M-Pesa) or bank name and account number (for bank transfers). New expenses start with "Pending" status.',
        features: ['Title & Description', 'Category Assignment', 'Payment Method Selection', 'Payee Details (Phone/Bank)'],
        screenshotAlt: 'Create Expense Form Screenshot',
        screenshotHint: 'Capture the new expense modal showing all form fields including payee info section',
        screenshotSrc: '/screenshots/new_expense.png'
      },
      {
        title: 'Approve Expenses',
        description:
          'Expenses must be approved before they can be paid — this ensures proper authorization. In the expense table, pending expenses show an "Approve" button (green checkmark). Click it to move the expense to "Approved" status. Only approved or partially-paid expenses can receive payments.',
        features: ['Approval Workflow', 'Status Badges', 'Authorization Control'],
        screenshotAlt: 'Expense Approval Screenshot',
        screenshotHint: 'Capture the expense table showing a pending expense with the approve button highlighted',
        tip: 'The approval workflow prevents unauthorized spending. Consider having the principal approve large expenses while the bursar handles routine ones.',
        screenshotSrc: '/screenshots/manage_expenses.png'
      },
      {
        title: 'Pay an Expense',
        description:
          'Click the "Pay" button (paper plane icon) on an approved expense. The payment modal shows the total amount, what\'s already paid, and the remaining balance. Choose your payment channel: B2C (M-Pesa — sends money directly to the payee\'s phone), B2B (Bank transfer to a business account), Cash, or Cheque. Enter the amount and destination, then click "Send Payment". For M-Pesa payments, the system triggers the Daraja API to send money instantly. Partial payments are tracked — the expense moves to "Partially Paid" until the full amount is covered.',
        features: ['B2C M-Pesa Payment', 'B2B Bank Transfer', 'Cash/Cheque Recording', 'Partial Payments', 'Payment History'],
        screenshotAlt: 'Pay Expense Modal Screenshot',
        screenshotHint: 'Capture the pay expense modal showing the B2C/B2B payment channel selection and amount entry',
        screenshotSrc: '/screenshots/pay_expense.png'
      },
      {
        title: 'Expense Dashboard & Details',
        description:
          'The top of the page shows four stats cards: Total Expenses, Total Paid, Outstanding, and number of Categories. A category breakdown row shows spending per category. Click the "View" icon on any expense to see full details including the complete payment history — every payment attempt with its type, destination, amount, status, timestamp, and M-Pesa receipt number.',
        features: ['Stats Cards', 'Category Breakdown', 'Full Payment History', 'M-Pesa Receipt Numbers'],
        screenshotAlt: 'Expense Dashboard & Detail Screenshot',
        screenshotHint: 'Capture the expense stats cards and an open expense detail showing payment history',
        screenshotSrc: '/screenshots/manage_expenses.png'
      },
    ],
  },

  /* ────────── 7. PAYROLL ────────── */
  {
    id: 'payroll',
    shortTitle: 'Payroll',
    icon: <Users className="w-5 h-5" />,
    title: 'Step 6: Manage Staff Payroll',
    subtitle: 'Configure salaries, deductions, run payroll, and send payments to staff',
    color: 'rose',
    gradient: 'from-rose-600 to-pink-600',
    steps: [
      {
        title: 'Configure Deduction Settings',
        description:
          'Start at Payroll → Deduction Settings. This is where you define your tax and statutory deduction rates. Configure NHIF (National Health Insurance Fund), NSSF (National Social Security Fund), SHA (Social Health Authority), and Housing Levy rates. Most importantly, set up PAYE tax brackets — add each bracket with its lower limit, upper limit, and tax rate percentage. The system also has a built-in deduction preview calculator where you can enter a gross salary and instantly see the full breakdown.',
        features: ['NHIF/NSSF/SHA/Housing Levy Rates', 'PAYE Bracket Editor', 'Add/Remove/Reorder Brackets', 'Preview Calculator', 'Recalculate All Salaries'],
        screenshotAlt: 'Deduction Settings Page Screenshot',
        screenshotHint: 'Capture the deduction settings page showing the PAYE brackets editor and the preview calculator',
        tip: 'After changing deduction rates, click "Recalculate All Salaries" to update every staff member\'s net pay in one click.',
        screenshotSrc: '/screenshots/deductions.png'
      },
      {
        title: 'Set Up Salary Structures',
        description:
          'Go to Payroll → Salary Structures. Here you assign a salary to each staff member. For each person, set: Basic Salary, Housing Allowance, Transport Allowance, Medical Allowance, and any Other Allowances. On the deduction side, the system auto-calculates PAYE, NHIF, NSSF, SHA, and Housing Levy based on your configured rates. You can also add manual deductions for loans, insurance, or other items. Set the payment method (M-Pesa or Bank Transfer) with the staff member\'s phone number or bank details.',
        features: ['Basic Salary + 4 Allowances', 'Auto-Calculated Statutory Deductions', 'Manual Deductions', 'Payment Method (M-Pesa/Bank)', 'Net Salary Display'],
        screenshotAlt: 'Salary Management Page Screenshot',
        screenshotHint: 'Capture the salary management page showing a staff member\'s salary card with allowances, deductions, and net pay',
        screenshotSrc: '/screenshots/assign_salary.png'
      },
      {
        title: 'Create & Process Payroll Runs',
        description:
          'Navigate to Payroll → Dashboard. The top banner shows Revenue vs Expenditure figures — total revenue collected, total expenditure, net balance, and payroll paid so far. To pay staff, create a new payroll run by selecting the month and year. The system generates a run that includes all staff with configured salaries. Review the per-staff breakdown, then click "Process" to trigger the actual payments. A confirmation modal shows the total amount before processing.',
        features: ['Revenue vs Expenditure Banner', 'Monthly Payroll Runs', 'Per-Staff Breakdown', 'Process Confirmation', 'Transaction History'],
        screenshotAlt: 'Payroll Dashboard Screenshot',
        screenshotHint: 'Capture the payroll dashboard showing the revenue banner, payroll runs list, and the process confirmation modal',
        screenshotSrc: '/screenshots/payroll_dashboard.png'
      },
      {
        title: 'Send Individual or Bulk Payments',
        description:
          'For more control, go to Payroll → Send Payment. This page lists all staff with their net salary, payment method, and destination (phone/bank). Use checkboxes to select specific staff members — the total selected amount updates in real-time. Filter by role to pay only teachers, admin staff, etc. Click "Send Payment" to process selected payments. The transaction history table below tracks every payment attempt with its status (Pending → Processing → Completed/Failed).',
        features: ['Multi-Select Staff', 'Role Filter', 'Real-Time Total', 'Individual or Bulk Send', 'Transaction Tracking'],
        screenshotAlt: 'Payment Processing Page Screenshot',
        screenshotHint: 'Capture the send payment page showing selected staff members with the total amount and the send button',
        screenshotSrc: '/screenshots/pay_salary.png'
      },
    ],
  },

  /* ────────── 8. BUDGET PLANNING ────────── */
  {
    id: 'budget',
    shortTitle: 'Budget',
    icon: <Target className="w-5 h-5" />,
    title: 'Step 7: Plan Your Budget',
    subtitle: 'Create financial year budgets and simulate planned vs actual performance',
    color: 'indigo',
    gradient: 'from-indigo-600 to-blue-600',
    steps: [
      {
        title: 'Create a Budget Period',
        description:
          'Navigate to Financials → Budget Planning. Start by creating a budget period — give it a name (e.g., "2026 Academic Year", "Term 1 2026"), set the start and end dates, and add optional notes. Periods have three statuses: Draft (still being planned), Active (current operating budget), and Closed (finalized). You can have multiple periods but typically only one is active at a time.',
        features: ['Named Budget Periods', 'Date Ranges', 'Draft → Active → Closed', 'Period Notes'],
        screenshotAlt: 'Budget Period Selection Screenshot',
        screenshotHint: 'Capture the budget planning page showing the period selector cards with status badges',
        screenshotSrc: '/screenshots/create_budget_period.png'
      },
      {
        title: 'Add Revenue & Expenditure Categories',
        description:
          'Within each period, create categories for both Revenue (money coming in) and Expenditure (money going out). Revenue categories might include "Tuition Fees", "Transport Fees", "Government Grants", "Donations". Expenditure categories could be "Staff Salaries", "Utilities", "Learning Materials", "Maintenance". Each category has a name and sort order for organization.',
        features: ['Revenue Categories', 'Expenditure Categories', 'Custom Sort Order', 'Create/Edit/Delete'],
        screenshotAlt: 'Budget Categories Screenshot',
        screenshotHint: 'Capture the revenue and expenditure category sections on the budget page',
        screenshotSrc: '/screenshots/create_cartegory.png'
      },
      {
        title: 'Add Line Items with Planned Amounts',
        description:
          'Under each category, add specific line items. For example, under "Tuition Fees" you might add items for each class level with the expected collection amount. Under "Utilities" add "Electricity", "Water", "Internet" with their planned monthly costs. Each item has a planned amount and an actual amount (which can be updated manually or filled by the simulation).',
        features: ['Line Items per Category', 'Planned Amount', 'Actual Amount', 'Variance Calculation', 'Variance Percentage'],
        screenshotAlt: 'Budget Items Table Screenshot',
        screenshotHint: 'Capture a category card expanded to show the line items table with planned/actual/variance columns',
        screenshotSrc: '/screenshots/budget_items.png'
      },
      {
        title: 'Run Budget Simulation',
        description:
          'Click "Run Simulation" — this is the most powerful feature of the budget module. The system automatically pulls real financial data: actual revenue collected from invoice payments, actual payroll expenses from processed payroll runs, and actual expenses from the expense module. It compares these against your planned figures and shows the variance for each category. You\'ll see a revenue collection progress bar, planned vs actual cards, and a surplus or deficit calculation.',
        features: ['Auto-Pull from Invoices', 'Auto-Pull from Payroll', 'Auto-Pull from Expenses', 'Progress Bar', 'Surplus/Deficit'],
        screenshotAlt: 'Budget Simulation Modal Screenshot',
        screenshotHint: 'Capture the simulation modal showing planned vs actual comparison with the revenue progress bar',
        tip: 'Run the simulation at least once a month to stay on top of your financial plan. If the variance is growing, you may need to adjust spending or increase collection efforts.',
        screenshotSrc: '/screenshots/simulation.png'
    },
    ],
  },

  /* ────────── 9. BALANCE SHEET ────────── */
  {
    id: 'balance-sheet',
    shortTitle: 'Balance Sheet',
    icon: <Scale className="w-5 h-5" />,
    title: 'Step 8: View the Balance Sheet',
    subtitle: 'Track assets, liabilities, and equity with auto-computed figures',
    color: 'teal',
    gradient: 'from-teal-600 to-emerald-600',
    steps: [
      {
        title: 'Auto-Computed Financial Position',
        description:
          'Navigate to Financials → Balance Sheet. The top section shows four summary cards: Total Assets, Total Liabilities, Total Equity, and Net Worth. Below that, a highlighted blue section displays auto-computed figures pulled from your actual financial records — Cash & Bank (revenue minus payroll minus expenses), Accounts Receivable (invoiced minus collected), Revenue Collected, Payroll Paid, Expenses Paid, and Accounts Payable (pending expense payments).',
        features: ['4 Summary Cards', 'Auto-Computed Cash & Bank', 'Auto-Computed Receivables', 'Auto-Computed Payables'],
        screenshotAlt: 'Balance Sheet Summary Screenshot',
        screenshotHint: 'Capture the balance sheet page showing the summary cards and the blue auto-computed section',
        screenshotSrc: '/screenshots/balance_sheet.png'
      },
      {
        title: 'Three-Column Layout: Assets, Liabilities, Equity',
        description:
          'The main content area has three columns — one for each section of the balance sheet. Assets include sub-categories like Cash & Bank, Accounts Receivable, Inventory, Fixed Assets, and Prepaid Expenses. Liabilities include Accounts Payable, Loans, Accrued Expenses, and Deferred Revenue. Equity includes Capital/Fund Balance, Retained Surplus, and Reserves. Each column shows its total and allows you to add manual journal entries.',
        features: ['Assets Column', 'Liabilities Column', 'Equity Column', 'Sub-Category Grouping', 'Manual Entries'],
        screenshotAlt: 'Balance Sheet Three Columns Screenshot',
        screenshotHint: 'Capture the three-column layout showing entries grouped by sub-category with totals',
        screenshotSrc: '/screenshots/balance_sheet.png'
      },
      {
        title: 'Accounting Equation Check',
        description:
          'At the bottom, the accounting equation is displayed: Assets = Liabilities + Equity. If the equation doesn\'t balance (due to missing entries), a warning banner appears showing the exact difference amount. This helps you identify what entries need to be added to reconcile your books. Use the date filter at the top to view the balance sheet as of any specific date — ideal for end-of-term reports or audit preparation.',
        features: ['Equation Display', 'Imbalance Warning', 'Date Filter', 'Point-in-Time Snapshots'],
        screenshotAlt: 'Accounting Equation Screenshot',
        screenshotHint: 'Capture the accounting equation section at the bottom, ideally showing the imbalance warning',
        screenshotSrc: '/screenshots/balance_sheet.png',
        tip: 'If the equation doesn\'t balance, start by checking your equity entries. The difference often needs to be added as a "Retained Surplus" equity entry.',
      },
    ],
  },

  /* ────────── 10. PAYMENT METHODS SETUP ────────── */
  {
    id: 'payment-setup',
    shortTitle: 'Setup',
    icon: <Settings className="w-5 h-5" />,
    title: 'Initial Setup: Payment Methods',
    subtitle: 'Configure which payment methods your school accepts and the account details',
    color: 'gray',
    gradient: 'from-gray-600 to-gray-700',
    steps: [
      {
        title: 'Configure School Payment Methods',
        description:
          'Before parents can pay fees, you need to set up your school\'s accepted payment methods. Go to the Payment Methods page and add each method your school supports: M-Pesa (enter your Paybill/Till number), Airtel Money, T-Kash, and any bank accounts (Equity, KCB, Co-op Bank, etc.). For bank methods, enter the bank name (autocomplete from 15 Kenyan banks), branch, account number, and SWIFT code. You can enable or disable methods at any time.',
        features: ['M-Pesa Paybill/Till Setup', 'Airtel Money', 'Bank Account Details', '15 Kenyan Banks', 'Enable/Disable Methods'],
        screenshotAlt: 'Payment Methods Setup Screenshot',
        screenshotHint: 'Capture the school payment methods page showing configured methods with bank details',
      },
      {
        title: 'Parent-Facing Payment Instructions',
        description:
          'Once configured, parents automatically see the correct payment instructions based on your setup. If you add an Equity bank account, parents will see Equity as an option with your exact branch and account number. The M-Pesa STK push uses your configured Paybill number. This means you only need to set up once — the parent portal handles the rest.',
        features: ['Auto-Generated Instructions', 'Paybill Integration', 'Bank Details Display'],
        screenshotAlt: 'Parent Payment Method View Screenshot',
        screenshotHint: 'Capture the parent-facing pay fees page showing the payment method options that match your configuration',
        tip: 'M-Pesa is the most popular payment method in Kenya. Make sure your Paybill number is configured correctly and the STK push integration is tested before the term begins.',
      },
    ],
  },
];

const ROLE_TABLE = [
  { feature: 'View Finance Dashboard', access: [true, true, true, false, false] },
  { feature: 'Create/Edit Invoices', access: [true, true, false, false, false] },
  { feature: 'Record Payments', access: [true, true, false, false, false] },
  { feature: 'Reconcile Transactions', access: [true, true, false, false, false] },
  { feature: 'Manage Expenses', access: [true, true, false, false, false] },
  { feature: 'Approve Expenses', access: [true, true, true, false, false] },
  { feature: 'Pay Expenses (B2C/B2B)', access: [true, false, false, false, false] },
  { feature: 'Payroll Management', access: [true, true, false, false, false] },
  { feature: 'Send Salary Payments', access: [true, false, false, false, false] },
  { feature: 'Budget Planning', access: [true, true, true, false, false] },
  { feature: 'View Balance Sheet', access: [true, true, true, false, false] },
  { feature: 'Configure Payment Methods', access: [true, true, false, false, false] },
  { feature: 'Pay Fees', access: [false, false, false, false, true] },
  { feature: 'View Payment History', access: [false, false, false, false, true] },
  { feature: 'Download PDF Statement', access: [false, false, false, false, true] },
];
