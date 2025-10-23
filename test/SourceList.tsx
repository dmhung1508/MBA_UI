import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, Edit3, Calendar, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Source } from '../../types';

interface SourceListProps {
  sources: Source[];
  onEditSource: (source: Source) => void;
}

const SourceList: React.FC<SourceListProps> = ({ sources, onEditSource }) => {
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());

  const toggleSource = (sourceId: string) => {
    setExpandedSources(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sourceId)) {
        newSet.delete(sourceId);
      } else {
        newSet.add(sourceId);
      }
      return newSet;
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatScore = (score: number) => {
    return (score * 100).toFixed(1) + '%';
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 border-t border-gray-200 pt-4">
      <div className="flex items-center mb-3">
        <FileText size={16} className="text-gray-500 mr-2" />
        <span className="text-sm font-medium text-gray-700">
          Nguồn tham khảo ({sources.length})
        </span>
      </div>
      
      <div className="space-y-2">
        {sources.map((source, index) => (
          <div key={source.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <div
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleSource(source.id)}
            >
              <div className="flex items-center flex-1 min-w-0">
                <div className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white text-xs font-medium rounded mr-3">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {source.file_name}
                  </p>
                  <div className="flex items-center text-xs text-gray-500 mt-1 space-x-3">
                    <div className="flex items-center">
                      <BarChart3 size={12} className="mr-1" />
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getScoreColor(source.score)}`}>
                        {formatScore(source.score)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Calendar size={12} className="mr-1" />
                      <span>{source.creation_date}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditSource(source);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Chỉnh sửa nguồn"
                >
                  <Edit3 size={14} />
                </button>
                
                {expandedSources.has(source.id) ? (
                  <ChevronUp size={16} className="text-gray-400" />
                ) : (
                  <ChevronDown size={16} className="text-gray-400" />
                )}
              </div>
            </div>
            
            <AnimatePresence>
              {expandedSources.has(source.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-gray-200"
                >
                  <div className="p-4 bg-gray-50">
                    <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
                      <div>
                        <span className="font-medium text-gray-700">Loại file:</span>
                        <span className="ml-1 text-gray-600">{source.file_type}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Kích thước:</span>
                        <span className="ml-1 text-gray-600">{formatFileSize(source.file_size)}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Ngày tạo:</span>
                        <span className="ml-1 text-gray-600">{source.creation_date}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Cập nhật:</span>
                        <span className="ml-1 text-gray-600">{source.last_modified_date}</span>
                      </div>
                    </div>
                    
                    {source.section_summary && (
                      <div className="mb-4">
                        <span className="font-medium text-gray-700 text-xs">Tóm tắt phần:</span>
                        <p className="text-sm text-gray-600 mt-1">{source.section_summary}</p>
                      </div>
                    )}
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-700 text-xs">Nội dung:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getScoreColor(source.score)}`}>
                          Điểm số: {formatScore(source.score)}
                        </span>
                      </div>
                      <div className="bg-white rounded p-3 text-sm text-gray-700 max-h-40 overflow-y-auto border">
                        {source.text}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SourceList; 