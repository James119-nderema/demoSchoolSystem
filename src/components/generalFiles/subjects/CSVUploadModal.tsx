import React, { useState, useRef } from 'react';
import type { CSVUploadResponse } from '../../../types/subjects';

interface CSVUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<CSVUploadResponse>;
  onSuccess: () => void;
}

export default function CSVUploadModal({
  isOpen,
  onClose,
  onUpload,
  onSuccess
}: CSVUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<CSVUploadResponse | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    // Debug logging for browser compatibility
    console.log('File selected:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    });
    
    // More robust CSV file validation for cross-browser compatibility
    const isCSVFile = file.type === 'text/csv' || 
                     file.type === 'application/csv' || 
                     file.type === 'text/plain' ||
                     file.type === '' || // Some browsers don't set MIME type for CSV
                     file.name.toLowerCase().endsWith('.csv');
    
    if (file && isCSVFile) {
      setSelectedFile(file);
      setUploadResult(null);
    } else {
      console.error('Invalid file type:', file.type, 'for file:', file.name);
      alert('Please select a valid CSV file (.csv extension)');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const result = await onUpload(selectedFile);
      setUploadResult(result);
      
      if (result.success) {
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadResult({
        success: false,
        message: 'Upload failed. Please try again.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setIsUploading(false);
    setDragActive(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const downloadSampleCSV = () => {
    const csvContent = `subject_name,subject_code,description
Mathematics,MATH101,Basic mathematics and algebra
English Language,ENG101,English language and literature
Physics,PHY101,Introduction to physics
Chemistry,CHEM101,General chemistry
Biology,BIO101,Introduction to biology`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'subjects_sample.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Upload Subjects CSV</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isUploading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {!uploadResult && (
            <>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">
                    Upload a CSV file with subject information
                  </p>
                  <button
                    onClick={downloadSampleCSV}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Download Sample
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Required columns: subject_name, subject_code. Optional: description
                </p>
              </div>

              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : selectedFile
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv,application/csv,text/plain"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="space-y-2">
                    <svg className="w-12 h-12 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium text-green-700">{selectedFile.name}</p>
                    <p className="text-xs text-green-600">File selected successfully</p>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-xs text-gray-500 hover:text-gray-700 underline"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-gray-600">
                      Drag and drop your CSV file here, or{' '}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        browse
                      </button>
                    </p>
                    <p className="text-xs text-gray-500">Max file size: 5MB</p>
                  </div>
                )}
              </div>
            </>
          )}

          {uploadResult && (
            <div className={`p-4 rounded-md ${uploadResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {uploadResult.success ? (
                    <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${uploadResult.success ? 'text-green-800' : 'text-red-800'}`}>
                    {uploadResult.success ? 'Upload Successful!' : 'Upload Failed'}
                  </h3>
                  <div className={`mt-2 text-sm ${uploadResult.success ? 'text-green-700' : 'text-red-700'}`}>
                    <p>{uploadResult.message}</p>
                    {uploadResult.success && uploadResult.data && (
                      <p className="mt-1">Created {uploadResult.data.created_count} subjects successfully.</p>
                    )}
                    {uploadResult.warnings && uploadResult.warnings.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium">Warnings:</p>
                        <ul className="list-disc list-inside">
                          {uploadResult.warnings.map((warning, index) => (
                            <li key={index}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {uploadResult.errors && (
                      <div className="mt-2">
                        <p className="font-medium">Errors:</p>
                        {typeof uploadResult.errors === 'object' ? (
                          Object.entries(uploadResult.errors).map(([key, messages]) => (
                            <div key={key}>
                              {Array.isArray(messages) ? messages.map((msg, idx) => (
                                <p key={idx}>• {msg}</p>
                              )) : <p>• {messages}</p>}
                            </div>
                          ))
                        ) : (
                          <p>• {uploadResult.errors}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!uploadResult && (
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={isUploading}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload CSV'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
