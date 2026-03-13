import { useState } from 'react';
import jsPDF from 'jspdf';
import { BookOpen, Camera, Download, Loader2 } from 'lucide-react';

type GuideStep = {
  title: string;
  description: string;
  screenshotAlt: string;
  screenshotHint: string;
  screenshotSrc?: string;
};

type GuideSection = {
  id: string;
  shortTitle: string;
  title: string;
  subtitle: string;
  steps: GuideStep[];
};

const SECTIONS: GuideSection[] = [
  {
    id: 'dashboard',
    shortTitle: 'Dashboard',
    title: '1) Library Dashboard Overview',
    subtitle: 'Track books, active loans, overdue loans, and member activity',
    steps: [
      {
        title: 'Open Library Dashboard',
        description:
          'Go to Library → Dashboard at the beginning of each school day. Confirm total books, total copies, available copies, active loans, and overdue loans. This gives an immediate stock-risk picture before issue/return starts. Use the same view during end-of-day reconciliation to ensure transactions are balanced and no unusual spikes appear.',
        screenshotAlt: 'Library Dashboard Screenshot',
        screenshotHint: 'Add a screenshot of the library dashboard KPIs and recent activity cards.',
        screenshotSrc: '/screenshots/library_dashboard.png',
      },
      {
        title: 'Review Recent Activity',
        description:
          'Review issued, renewed, and returned activity feed entries by timestamp. Look for repeated renewals, delayed returns, and high-frequency borrowers. These trends help librarians plan reminders, rebalance shelf availability, and report circulation performance to administration during weekly operations meetings.',
        screenshotAlt: 'Library Recent Activity Screenshot',
        screenshotHint: 'Add a screenshot showing recent activity rows and popular books area.',
        screenshotSrc: '/screenshots/library_recent_activity.png',
      },
    ],
  },
  {
    id: 'catalog',
    shortTitle: 'Catalog',
    title: '2) Book Catalog & Copies',
    subtitle: 'Add books, manage copies, and keep inventory accurate',
    steps: [
      {
        title: 'Create Book Records',
        description:
          'Use Library → Book Catalog to capture complete bibliographic and financial data: title, author, ISBN, shelf location, replacement price, and copy count. Add CBC alignment details (learning areas and grade levels) so academic teams can map resources directly to class instruction and procurement planning.',
        screenshotAlt: 'Book Catalog Screenshot',
        screenshotHint: 'Add a screenshot of the catalog list and create button.',
        screenshotSrc: '/screenshots/library_catalog.png',
      },
      {
        title: 'Manage Copy IDs',
        description:
          'For each title, assign and maintain unique copy IDs. Copy-level tracking is essential for accountability: it identifies exactly which physical copy was issued, returned, damaged, or lost. It also improves audit quality during stocktaking and prevents duplicate copy assignment errors in class borrowing.',
        screenshotAlt: 'Book Copy Manager Screenshot',
        screenshotHint: 'Add a screenshot of copy UID list and add-copy form.',
        screenshotSrc: '/screenshots/library_copy_manager.png',
      },
    ],
  },
  {
    id: 'borrowing',
    shortTitle: 'Borrowing',
    title: '3) Borrowing, Return, Renew, Lost',
    subtitle: 'Issue books to individuals/classes and process returns/losses',
    steps: [
      {
        title: 'Issue Books',
        description:
          'In Library → Borrowing, issue books using Individual mode (single borrower workflows) or Class mode (bulk lending workflows). Always confirm borrower identity, admission/staff details, due date policy, and copy UID assignment. This creates a reliable borrowing trail that supports dispute resolution and fee recovery when items are not returned.',
        screenshotAlt: 'Borrowing Issue Screenshot',
        screenshotHint: 'Add a screenshot of Issue Book modal (individual and class modes).',
        screenshotSrc: '/screenshots/library_issue_book.png',
      },
      {
        title: 'Return / Renew / Mark Lost',
        description:
          'Use action controls to process returns, renewals, and loss declarations. Return updates stock availability, renew extends due control, and Lost triggers accountability flow. Marking lost updates library status, records charge amount, and pushes a finance invoice workflow to ensure recovery is tracked under the same fee operations process.',
        screenshotAlt: 'Borrowing Actions Screenshot',
        screenshotHint: 'Add a screenshot showing Return, Renew, and Lost actions in borrowing table.',
        screenshotSrc: '/screenshots/library_borrowing_actions.png',
      },
      {
        title: 'Filter & Search Borrowings',
        description:
          'Use class filters and targeted search (copy UID, title, borrower name, and admission number) to locate records in seconds. This is critical during peak service times, parent queries, and class-level reconciliations where quick, accurate lookup reduces queue delays and operational friction.',
        screenshotAlt: 'Borrowing Filters Screenshot',
        screenshotHint: 'Add a screenshot highlighting class filter and search field.',
        screenshotSrc: '/screenshots/library_borrowing_filters.png',
      },
    ],
  },
  {
    id: 'lost',
    shortTitle: 'Lost Books',
    title: '4) Lost Books Tracking & Payments',
    subtitle: 'Monitor lost items and their payment status',
    steps: [
      {
        title: 'Open Lost Books Page',
        description:
          'Open Library → Lost Books to monitor all loss cases in one place. Track borrower, copy UID, issue/loss dates, estimated replacement value, and payment state. This page should be reviewed weekly with administration to keep replacement recovery, accountability, and stock health visible.',
        screenshotAlt: 'Lost Books Page Screenshot',
        screenshotHint: 'Add a screenshot of the lost books table and summary cards.',
        screenshotSrc: '/screenshots/library_lost_books.png',
      },
      {
        title: 'Mark Charges as Paid',
        description:
          'After finance confirms settlement, use Mark Paid to close the loss charge loop. Combine Paid/Unpaid filters for follow-up campaigns and term-end closure reports. This keeps library and finance records synchronized and prevents unresolved lost-book balances from carrying forward unnoticed.',
        screenshotAlt: 'Lost Books Payment Screenshot',
        screenshotHint: 'Add a screenshot showing Paid/Unpaid filter and Mark Paid button.',
        screenshotSrc: '/screenshots/library_lost_books_payment.png',
      },
    ],
  },
  {
    id: 'reports',
    shortTitle: 'Reports',
    title: '5) Reports & Improvement',
    subtitle: 'Use circulation and overdue insights to improve usage',
    steps: [
      {
        title: 'Run Library Reports',
        description:
          'Use Library Reports to evaluate circulation trends, overdue exposure, popular titles, and inventory position. Convert this data into action: prioritize high-demand replacements, adjust borrowing policies, and prepare evidence-based procurement requests for term planning and budget review meetings.',
        screenshotAlt: 'Library Reports Screenshot',
        screenshotHint: 'Add a screenshot of reports tabs and charts/tables.',
        screenshotSrc: '/screenshots/library_reports.png',
      },
    ],
  },
];

function ScreenshotPlaceholder({ alt, hint, src }: { alt: string; hint: string; src?: string }) {
  if (src) {
    return (
      <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
        <img
          src={src}
          alt={alt}
          className="w-full rounded-lg border border-slate-200 object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
            const parent = e.currentTarget.parentElement;
            if (parent) {
              parent.innerHTML = `
                <div style="border:1px dashed #cbd5e1;border-radius:8px;padding:14px;background:#f8fafc;color:#64748b;font-size:12px;">
                  <strong style="display:block;color:#334155;margin-bottom:4px;">${alt}</strong>
                  ${hint}
                </div>
              `;
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
      <div className="mb-2 flex items-center gap-2 text-slate-700">
        <Camera className="h-4 w-4" />
        <p className="text-sm font-semibold">{alt}</p>
      </div>
      <p className="text-xs text-slate-500">{hint}</p>
    </div>
  );
}

export default function LibraryGuide() {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const width = pdf.internal.pageSize.getWidth();
      const height = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = width - margin * 2;
      let y = margin;

      const ensureSpace = (needed: number) => {
        if (y + needed > height - margin) {
          pdf.addPage();
          y = margin;
        }
      };

      // Header
      pdf.setFillColor(30, 64, 175);
      pdf.rect(0, 0, width, 36, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.text('Library Management Guide', margin, 16);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text('Step-by-step guide with screenshot placeholders for your team.', margin, 24);
      y = 44;

      // Contents line
      pdf.setTextColor(71, 85, 105);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`CONTENTS: ${SECTIONS.map(s => s.shortTitle).join(' • ')}`, margin, y);
      y += 6;

      pdf.setDrawColor(226, 232, 240);
      pdf.line(margin, y, width - margin, y);
      y += 6;

      for (const section of SECTIONS) {
        ensureSpace(18);
        pdf.setFillColor(239, 246, 255);
        pdf.roundedRect(margin, y - 1, contentWidth, 10, 2, 2, 'F');
        pdf.setTextColor(30, 64, 175);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.text(section.title, margin + 3, y + 5);
        y += 11;

        pdf.setTextColor(71, 85, 105);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        const subtitleLines = pdf.splitTextToSize(section.subtitle, contentWidth);
        ensureSpace(subtitleLines.length * 4 + 2);
        pdf.text(subtitleLines, margin, y);
        y += subtitleLines.length * 4 + 2;

        section.steps.forEach((step, idx) => {
          ensureSpace(20);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(10);
          pdf.setTextColor(15, 23, 42);
          pdf.text(`${idx + 1}. ${step.title}`, margin, y);
          y += 5;

          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8.8);
          pdf.setTextColor(71, 85, 105);
          const lines = pdf.splitTextToSize(step.description, contentWidth);
          ensureSpace(lines.length * 4 + 8);
          pdf.text(lines, margin, y);
          y += lines.length * 4 + 2;

          pdf.setFillColor(248, 250, 252);
          pdf.setDrawColor(203, 213, 225);
          pdf.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, 'FD');
          pdf.setFontSize(7.5);
          pdf.setTextColor(100, 116, 139);
          pdf.text(`Screenshot placeholder: ${step.screenshotAlt}`, margin + 2, y + 3);

          const hintLines = pdf.splitTextToSize(step.screenshotHint, contentWidth - 4);
          pdf.text(hintLines, margin + 2, y + 6.2);
          y += Math.max(10, 6.2 + hintLines.length * 3.3);
          y += 3;
        });

        y += 2;
      }

      // Footer page numbers
      const totalPages = (pdf as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.setTextColor(148, 163, 184);
        pdf.text(`Page ${i} of ${totalPages}`, width / 2, height - 8, { align: 'center' });
      }

      pdf.save('Library_Guide.pdf');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-blue-800 to-indigo-700 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
              Comprehensive Library Guide
            </div>
            <h1 className="text-2xl font-bold">Library Management System Guide</h1>
            <p className="mt-2 text-sm text-blue-100">
              Detailed walkthrough for dashboard, catalog, borrowing, lost books, and reporting.
              Includes screenshot placeholders and export to PDF.
            </p>
          </div>

          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-blue-800 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {downloading ? 'Generating PDF…' : 'Download as PDF'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <div className="sticky top-4 rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-bold text-slate-800">Guide Contents</h3>
            <div className="space-y-2">
              {SECTIONS.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                >
                  <BookOpen className="h-4 w-4" />
                  {section.shortTitle}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5 lg:col-span-3">
          {SECTIONS.map((section) => (
            <section key={section.id} id={section.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-bold text-slate-800">{section.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{section.subtitle}</p>

              <div className="mt-4 space-y-5">
                {section.steps.map((step, idx) => (
                  <article key={step.title} className="rounded-lg border border-slate-100 bg-slate-50/40 p-4">
                    <h3 className="text-sm font-semibold text-slate-800">{idx + 1}. {step.title}</h3>
                    <p className="mt-1.5 text-sm text-slate-600">{step.description}</p>
                    <ScreenshotPlaceholder alt={step.screenshotAlt} hint={step.screenshotHint} src={step.screenshotSrc} />
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
