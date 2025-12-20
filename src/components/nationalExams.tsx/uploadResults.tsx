import React, { useState, useEffect, useRef } from 'react';
import { 
  FileUp, 
  Search, 
  X, 
  AlertCircle, 
  CheckCircle,
  Upload,
  Trash2,
  Eye,
  Calendar,
  Users,
  FileSpreadsheet,
  ChevronDown
} from 'lucide-react';
import nationalResultsService, { 
  type NationalExamResult,
  type UploadResponse 
} from '../../services/nationalResultsService';
import { usePermissions } from '../../hooks/usePermissions';

const UploadResults: React.FC = () => {
  // State
  const [results, setResults] = useState<NationalExamResult[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState<string>('');
  const [filterClass, setFilterClass] = useState<string>('');
  
  // Modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<NationalExamResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadYear, setUploadYear] = useState<number>(new Date().getFullYear());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(null);
  
  // Role check - only Director of Studies can upload/delete
  const permissions = usePermissions();
  const canUpload = permissions.isDirectorOfStudies();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Apply filters when search term or filters change
  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchResults();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm, filterYear, filterClass]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [yearsData, classesData] = await Promise.all([
        nationalResultsService.getYears(),
        nationalResultsService.getClasses()
      ]);
      
      setYears(yearsData);
      setClasses(classesData);
      
      await fetchResults();
    } catch (err: any) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async () => {
    try {
      const data = await nationalResultsService.getResults({
        search: searchTerm || undefined,
        year: filterYear || undefined,
        class_name: filterClass || undefined
      });
      setResults(data);
    } catch (err: any) {
      console.error('Error fetching results:', err);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadResponse(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadResponse(null);

    try {
      const response = await nationalResultsService.uploadResults(selectedFile, uploadYear);
      setUploadResponse(response);
      
      if (response.successful_records > 0) {
        setSuccess(`Successfully uploaded ${response.successful_records} results`);
        // Refresh the data
        await fetchData();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload results');
    } finally {
      setUploading(false);
    }
  };

  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
    setSelectedFile(null);
    setUploadResponse(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleViewResult = (result: NationalExamResult) => {
    setSelectedResult(result);
    setIsViewModalOpen(true);
  };

  const handleDeleteResult = async (id: string) => {
    if (!confirm('Are you sure you want to delete this result?')) return;
    
    try {
      await nationalResultsService.deleteResult(id);
      setSuccess('Result deleted successfully');
      await fetchResults();
    } catch (err: any) {
      setError('Failed to delete result');
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'EE1':
      case 'EE2':
        return 'bg-green-100 text-green-800';  // Exceeding Expectations
      case 'ME1':
      case 'ME2':
        return 'bg-blue-100 text-blue-800';    // Meeting Expectations
      case 'AE1':
      case 'AE2':
        return 'bg-yellow-100 text-yellow-800'; // Approaching Expectations
      case 'BE1':
      case 'BE2':
        return 'bg-red-100 text-red-800';       // Below Expectations
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Auto-hide alerts
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileSpreadsheet className="w-7 h-7 text-blue-600" />
          National Exam Results
        </h1>
        <p className="text-gray-600 mt-1">View and manage national examination results</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or assessment number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative">
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="appearance-none bg-white border rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Years</option>
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="appearance-none bg-white border rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>

            {canUpload && (
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload Results
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assessment No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Eng</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Kisw</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Math</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Sci</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Agri</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Avg</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {results.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-4 py-8 text-center text-gray-500">
                    <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No results found</p>
                    {canUpload && (
                      <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="mt-2 text-blue-600 hover:text-blue-800"
                      >
                        Upload results to get started
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                results.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{result.full_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{result.assessment_no}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{result.class_name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{result.year}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600">{result.english}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600">{result.kiswahili}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600">{result.mathematics}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600">{result.integrated_science}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600">{result.agriculture}</td>
                    <td className="px-4 py-3 text-sm text-center font-medium text-gray-900">{result.total_marks}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600">{Number(result.average).toFixed(1)}/8</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(result.grade)}`}>
                        {result.grade}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewResult(result)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canUpload && (
                          <button
                            onClick={() => handleDeleteResult(result.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Results count */}
        {results.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t text-sm text-gray-600">
            Showing {results.length} result{results.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                Upload National Exam Results
              </h2>
              <button
                onClick={handleCloseUploadModal}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              {/* Year Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Examination Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={uploadYear}
                  onChange={(e) => setUploadYear(parseInt(e.target.value))}
                  min={2000}
                  max={2100}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* File Upload */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Results File <span className="text-red-500">*</span>
                </label>
                <div 
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <FileSpreadsheet className="w-8 h-8" />
                      <div>
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <FileUp className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-600">Click to select a file</p>
                      <p className="text-sm text-gray-400 mt-1">CSV or Excel (.csv, .xlsx, .xls)</p>
                    </>
                  )}
                </div>
              </div>

              {/* Required Columns Info */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm">
                <p className="font-medium text-blue-800 mb-1">Required Columns:</p>
                <p className="text-blue-700">
                  Full Name, Assessment No, English, Kiswahili, Mathematics, Integrated Science, Agriculture
                </p>
                <p className="font-medium text-blue-800 mt-2 mb-1">Optional Columns:</p>
                <p className="text-blue-700">
                  Class, Social Studies, IRE, CRE, Creative Arts & Sports, Pre-Technical Studies
                </p>
              </div>

              {/* Upload Response */}
              {uploadResponse && (
                <div className={`mb-4 p-3 rounded-lg ${
                  uploadResponse.failed_records > 0 
                    ? 'bg-yellow-50 border border-yellow-200' 
                    : 'bg-green-50 border border-green-200'
                }`}>
                  <p className="font-medium mb-2">Upload Summary:</p>
                  <ul className="text-sm space-y-1">
                    <li>Total Records: {uploadResponse.total_records}</li>
                    <li className="text-green-600">Successful: {uploadResponse.successful_records}</li>
                    {uploadResponse.failed_records > 0 && (
                      <li className="text-red-600">Failed: {uploadResponse.failed_records}</li>
                    )}
                  </ul>
                  
                  {uploadResponse.errors && uploadResponse.errors.length > 0 && (
                    <div className="mt-2 max-h-32 overflow-y-auto">
                      <p className="text-sm font-medium text-red-700">Errors:</p>
                      {uploadResponse.errors.slice(0, 5).map((err, idx) => (
                        <p key={idx} className="text-xs text-red-600">
                          Row {err.row}: {err.error}
                        </p>
                      ))}
                      {uploadResponse.errors.length > 5 && (
                        <p className="text-xs text-gray-500">
                          ... and {uploadResponse.errors.length - 5} more errors
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
              <button
                onClick={handleCloseUploadModal}
                className="px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Result Modal */}
      {isViewModalOpen && selectedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-gray-900">
                Student Result Details
              </h2>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Student Info */}
              <div className="mb-6 pb-4 border-b">
                <h3 className="text-xl font-bold text-gray-900">{selectedResult.full_name}</h3>
                <p className="text-gray-600">Assessment No: {selectedResult.assessment_no}</p>
                <div className="flex gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {selectedResult.class_name || 'N/A'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {selectedResult.year}
                  </span>
                </div>
              </div>

              {/* Subjects Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">English</p>
                  <p className="text-xl font-bold">{selectedResult.english}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Kiswahili</p>
                  <p className="text-xl font-bold">{selectedResult.kiswahili}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Mathematics</p>
                  <p className="text-xl font-bold">{selectedResult.mathematics}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Integrated Science</p>
                  <p className="text-xl font-bold">{selectedResult.integrated_science}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Agriculture</p>
                  <p className="text-xl font-bold">{selectedResult.agriculture}</p>
                </div>
                {selectedResult.social_studies !== null && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Social Studies</p>
                    <p className="text-xl font-bold">{selectedResult.social_studies}</p>
                  </div>
                )}
                {selectedResult.ire !== null && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">IRE</p>
                    <p className="text-xl font-bold">{selectedResult.ire}</p>
                  </div>
                )}
                {selectedResult.cre !== null && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">CRE</p>
                    <p className="text-xl font-bold">{selectedResult.cre}</p>
                  </div>
                )}
                {selectedResult.creative_arts_sports !== null && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Creative Arts & Sports</p>
                    <p className="text-xl font-bold">{selectedResult.creative_arts_sports}</p>
                  </div>
                )}
                {selectedResult.pre_technical_studies !== null && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Pre-Technical Studies</p>
                    <p className="text-xl font-bold">{selectedResult.pre_technical_studies}</p>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm text-blue-600">Total Marks</p>
                  <p className="text-2xl font-bold text-blue-900">{selectedResult.total_marks}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-600">Average</p>
                  <p className="text-2xl font-bold text-blue-900">{Number(selectedResult.average).toFixed(2)}/8</p>
                </div>
                <div>
                  <p className="text-sm text-blue-600">Grade</p>
                  <span className={`inline-block px-4 py-2 rounded-full text-xl font-bold ${getGradeColor(selectedResult.grade)}`}>
                    {selectedResult.grade}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadResults;