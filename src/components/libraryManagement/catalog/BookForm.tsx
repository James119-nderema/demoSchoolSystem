/**
 * Book Form — Add / Edit a book with class level & subject tagging from database
 */

import React, { useState, useEffect, useCallback } from 'react';
import { RESOURCE_TYPES, BOOK_CONDITIONS } from '../constants/cbcConstants';
import { APIService } from '../../../services/baseUrl';
import type { Book, BookFormData } from '../types';

interface ClassRecord {
  id: string;
  class_name: string;
  stream?: string;
}

interface SubjectRecord {
  id: string;
  subject_name: string;
}

interface Props {
  book?: Book | null;
  onSubmit: (data: BookFormData) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

const BookForm: React.FC<Props> = ({ book, onSubmit, onClose, isLoading = false }) => {
  const [form, setForm] = useState<BookFormData>({
    title: '', author: '', isbn: '', publisher: '', publication_year: new Date().getFullYear(),
    resource_type: 'textbook', learning_areas: [], grade_levels: [],
    subject_integration_tags: [], is_kicd_approved: false, total_copies: 1,
    shelf_location: '', condition: 'new', price: 0, date_acquired: new Date().toISOString().split('T')[0],
  });
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Database-driven class levels and subjects
  const [dbClasses, setDbClasses] = useState<ClassRecord[]>([]);
  const [dbSubjects, setDbSubjects] = useState<SubjectRecord[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Fetch classes and subjects from database
  const fetchClassesAndSubjects = useCallback(async () => {
    setLoadingData(true);
    try {
      const [classesRes, subjectsRes] = await Promise.allSettled([
        APIService.get<{ results: ClassRecord[]; count: number }>(
          '/api/classes/', { page_size: '200' }, 'staff'
        ),
        APIService.get<{ results: SubjectRecord[]; count: number }>(
          '/api/subjects/', { page_size: '200' }, 'staff'
        ),
      ]);

      if (classesRes.status === 'fulfilled') {
        const classes = classesRes.value.results || [];
        // Deduplicate by class_name
        const seen = new Set<string>();
        const unique: ClassRecord[] = [];
        for (const c of classes) {
          if (!seen.has(c.class_name)) {
            seen.add(c.class_name);
            unique.push(c);
          }
        }
        setDbClasses(unique);
      }

      if (subjectsRes.status === 'fulfilled') {
        const subjects = subjectsRes.value.results || [];
        // Deduplicate by subject_name
        const seen = new Set<string>();
        const unique: SubjectRecord[] = [];
        for (const s of subjects) {
          if (!seen.has(s.subject_name)) {
            seen.add(s.subject_name);
            unique.push(s);
          }
        }
        setDbSubjects(unique);
      }
    } catch {
      // Silently fail — form still usable with manual entry
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => { fetchClassesAndSubjects(); }, [fetchClassesAndSubjects]);

  useEffect(() => {
    if (book) {
      setForm({
        title: book.title, author: book.author, isbn: book.isbn,
        publisher: book.publisher, publication_year: book.publication_year,
        edition: book.edition, resource_type: book.resource_type,
        learning_areas: book.learning_areas, grade_levels: book.grade_levels,
        subject_integration_tags: book.subject_integration_tags,
        is_kicd_approved: book.is_kicd_approved,
        kicd_approval_number: book.kicd_approval_number,
        total_copies: book.total_copies, shelf_location: book.shelf_location,
        description: book.description, condition: book.condition,
        digital_url: book.digital_url, barcode: book.barcode,
        price: book.price || 0,
        date_acquired: book.date_acquired,
      });
    }
  }, [book]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.checked }));
  };

  const toggleLearningArea = (area: string) => {
    setForm(prev => ({
      ...prev,
      learning_areas: prev.learning_areas.includes(area)
        ? prev.learning_areas.filter(a => a !== area)
        : [...prev.learning_areas, area],
    }));
  };

  const toggleGradeLevel = (grade: string) => {
    setForm(prev => ({
      ...prev,
      grade_levels: prev.grade_levels.includes(grade)
        ? prev.grade_levels.filter(g => g !== grade)
        : [...prev.grade_levels, grade],
    }));
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.subject_integration_tags.includes(tag)) {
      setForm(prev => ({ ...prev, subject_integration_tags: [...prev.subject_integration_tags, tag] }));
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setForm(prev => ({ ...prev, subject_integration_tags: prev.subject_integration_tags.filter(t => t !== tag) }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.author.trim()) errs.author = 'Author is required';
    if (!form.publisher.trim()) errs.publisher = 'Publisher is required';
    if (form.learning_areas.length === 0) errs.learning_areas = 'Select at least one learning area / subject';
    if (form.grade_levels.length === 0) errs.grade_levels = 'Select at least one class level';
    if (form.total_copies < 1) errs.total_copies = 'At least 1 copy required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">{book ? 'Edit Book' : 'Add New Book'}</h2>
          <button onClick={onClose} disabled={isLoading} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
              <input name="title" value={form.title} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none ${errors.title ? 'border-red-400' : 'border-slate-300'}`} />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Author *</label>
              <input name="author" value={form.author} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none ${errors.author ? 'border-red-400' : 'border-slate-300'}`} />
              {errors.author && <p className="text-xs text-red-500 mt-1">{errors.author}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ISBN</label>
              <input name="isbn" value={form.isbn} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="978-..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Publisher *</label>
              <input name="publisher" value={form.publisher} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none ${errors.publisher ? 'border-red-400' : 'border-slate-300'}`} />
              {errors.publisher && <p className="text-xs text-red-500 mt-1">{errors.publisher}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Publication Year</label>
              <input name="publication_year" type="number" value={form.publication_year} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" min={1900} max={2100} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Resource Type</label>
              <select name="resource_type" value={form.resource_type} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                {RESOURCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Condition</label>
              <select name="condition" value={form.condition} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                {BOOK_CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          {/* Learning Areas / Subjects (from database) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Learning Areas / Subjects *
              {loadingData && <span className="ml-2 text-xs text-slate-400">(loading...)</span>}
            </label>
            {errors.learning_areas && <p className="text-xs text-red-500 mb-1">{errors.learning_areas}</p>}
            <div className="flex flex-wrap gap-2">
              {dbSubjects.length > 0 ? (
                dbSubjects.map(subj => (
                  <button
                    key={subj.id} type="button"
                    onClick={() => toggleLearningArea(subj.subject_name)}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                      form.learning_areas.includes(subj.subject_name)
                        ? 'bg-indigo-100 border-indigo-300 text-indigo-700 font-medium'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >{subj.subject_name}</button>
                ))
              ) : !loadingData ? (
                <p className="text-xs text-slate-400">No subjects found in database. Please add subjects first.</p>
              ) : null}
            </div>
          </div>

          {/* Class Levels (from database) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Class Levels *
              {loadingData && <span className="ml-2 text-xs text-slate-400">(loading...)</span>}
            </label>
            {errors.grade_levels && <p className="text-xs text-red-500 mb-1">{errors.grade_levels}</p>}
            <div className="flex flex-wrap gap-2">
              {dbClasses.length > 0 ? (
                dbClasses.map(cls => (
                  <button
                    key={cls.id} type="button"
                    onClick={() => toggleGradeLevel(cls.class_name)}
                    className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                      form.grade_levels.includes(cls.class_name)
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-700 font-medium'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >{cls.class_name}</button>
                ))
              ) : !loadingData ? (
                <p className="text-xs text-slate-400">No classes found in database. Please add classes first.</p>
              ) : null}
            </div>
          </div>

          {/* Subject Integration Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Subject Integration Tags</label>
            <p className="text-xs text-slate-400 mb-2">A book may serve multiple learning areas. Add relevant tags.</p>
            <div className="flex gap-2">
              <input
                value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="Type a tag and press Enter..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button type="button" onClick={addTag} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200">Add</button>
            </div>
            {form.subject_integration_tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.subject_integration_tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* KICD Approval */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="is_kicd_approved" checked={form.is_kicd_approved} onChange={handleCheckboxChange} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm text-slate-700 font-medium">KICD Approved</span>
            </label>
            {form.is_kicd_approved && (
              <input
                name="kicd_approval_number" value={form.kicd_approval_number || ''} onChange={handleChange}
                placeholder="KICD Approval Number" className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            )}
          </div>

          {/* Copies / Price / Location / Digital */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Total Copies</label>
              <input name="total_copies" type="number" value={form.total_copies} onChange={handleChange} min={1} className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none ${errors.total_copies ? 'border-red-400' : 'border-slate-300'}`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Price (KES)</label>
              <input name="price" type="number" value={form.price || 0} onChange={handleChange} min={0} step="0.01" placeholder="0.00" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              <p className="text-xs text-slate-400 mt-0.5">Charged if book is lost</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Shelf Location</label>
              <input name="shelf_location" value={form.shelf_location} onChange={handleChange} placeholder="e.g. A1-01" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date Acquired</label>
              <input name="date_acquired" type="date" value={form.date_acquired} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
          </div>

          {form.resource_type === 'digital_resource' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Digital Resource URL</label>
              <input name="digital_url" value={form.digital_url || ''} onChange={handleChange} placeholder="https://..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea name="description" value={form.description || ''} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none" />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 text-sm font-medium transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={isLoading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors disabled:opacity-50">
            {isLoading ? 'Saving...' : book ? 'Update Book' : 'Add Book'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookForm;
