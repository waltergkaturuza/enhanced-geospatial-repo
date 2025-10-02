import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Folder, 
  FolderOpen, 
  Image, 
  Download,
  Eye,
  Trash2,
  Search,
  Grid,
  List,
  RefreshCw,
  Upload,
  Zap,
  Database
} from 'lucide-react';
import { cn } from '../lib/utils';
import AdvancedUploadForm from './AdvancedUploadForm';
import EnhancedUploadForm from './EnhancedUploadForm';

interface ImageFile {
  id: string;
  name: string;
  size: number;
  format: string;
  uploadDate: string;
  captureDate: string;
  thumbnailUrl?: string;
  fullUrl: string;
  metadata?: {
    resolution: string;
    bands: string[];
    projection: string;
    cloudCover?: number;
  };
}

interface TreeNode {
  id: string;
  name: string;
  type: 'provider' | 'province' | 'district' | 'date' | 'format' | 'file';
  children?: TreeNode[];
  isExpanded?: boolean;
  files?: ImageFile[];
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
}

interface ImageFileManagerProps {
  onFileSelect?: (file: ImageFile) => void;
  onFileDownload?: (file: ImageFile) => void;
  onFileDelete?: (file: ImageFile) => void;
}

const ImageFileManager: React.FC<ImageFileManagerProps> = ({
  onFileSelect,
  onFileDownload,
  onFileDelete
}) => {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<ImageFile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'tree' | 'grid'>('tree');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvancedUpload, setShowAdvancedUpload] = useState(false);
  const [showEnhancedUpload, setShowEnhancedUpload] = useState(false);

  // Fetch file tree data from API
  const fetchFileTree = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8000/api/files/tree/');
      const result = await response.json();
      
      if (result.success) {
        setTreeData(result.data);
      } else {
        setError(result.message || 'Failed to load files');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Error fetching file tree:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchFileTree();
  }, []);

  // Search files
  const searchFiles = async (query: string) => {
    if (!query.trim()) {
      fetchFileTree();
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/files/search/?q=${encodeURIComponent(query)}`);
      const result = await response.json();
      
      if (result.success) {
        // Convert search results to tree format
        const searchTreeData: TreeNode[] = [{
          id: 'search-results',
          name: `Search Results for "${query}"`,
          type: 'provider',
          icon: Search,
          count: result.count,
          children: [],
          files: result.results.map((file: any) => ({
            id: file.id,
            name: file.name,
            size: 0, // Will be updated from actual file data
            format: file.name.split('.').pop() || 'unknown',
            uploadDate: file.uploadDate,
            captureDate: file.captureDate,
            fullUrl: `/api/files/download/${file.name}`,
            metadata: file.metadata
          }))
        }];
        setTreeData(searchTreeData);
      }
    } catch (err) {
      setError('Search failed');
      console.error('Error searching files:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        searchFiles(searchTerm);
      } else {
        fetchFileTree();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Delete file
  const handleFileDelete = async (file: ImageFile) => {
    if (!confirm(`Are you sure you want to delete ${file.name}?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/files/delete/${encodeURIComponent(file.id)}/`, {
        method: 'DELETE'
      });
      const result = await response.json();
      
      if (result.success) {
        // Refresh the tree
        fetchFileTree();
        if (selectedFile?.id === file.id) {
          setSelectedFile(null);
        }
        onFileDelete?.(file);
      } else {
        alert(`Failed to delete file: ${result.message}`);
      }
    } catch (err) {
      alert('Failed to delete file');
      console.error('Error deleting file:', err);
    }
  };

  // Handle file upload
  const handleFileUpload = async (files: File[]) => {
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      
      const response = await fetch('http://localhost:8000/api/upload/satellite-imagery/', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Refresh the file tree to show new uploads
        await fetchFileTree();
        alert(`Successfully uploaded ${files.length} file(s)`);
      } else {
        alert(`Upload failed: ${result.message}`);
      }
    } catch (err) {
      alert('Upload failed: Network error');
      console.error('Upload error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (nodeId: string, nodes: TreeNode[]): TreeNode[] => {
    return nodes.map(node => {
      if (node.id === nodeId) {
        return { ...node, isExpanded: !node.isExpanded };
      }
      if (node.children) {
        return { ...node, children: toggleExpand(nodeId, node.children) };
      }
      return node;
    });
  };

  const handleNodeToggle = (nodeId: string) => {
    setTreeData(prev => toggleExpand(nodeId, prev));
  };

  const handleFileSelect = (file: ImageFile) => {
    setSelectedFile(file);
    onFileSelect?.(file);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNodeIcon = (node: TreeNode, isExpanded: boolean) => {
    if (node.type === 'file') return Image;
    if (node.icon) return node.icon;
    
    if (node.children && node.children.length > 0) {
      return isExpanded ? FolderOpen : Folder;
    }
    return Folder;
  };

  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = node.isExpanded || false;
    const Icon = getNodeIcon(node, isExpanded);

    return (
      <div key={node.id} className="select-none">
        <div
          className={cn(
            "flex items-center py-2 px-3 hover:bg-gray-50 cursor-pointer rounded-md transition-colors",
            selectedFile?.id === node.id && "bg-blue-50 border-l-4 border-blue-500"
          )}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
          onClick={() => {
            if (hasChildren) {
              handleNodeToggle(node.id);
            }
          }}
        >
          {hasChildren && (
            <button className="mr-1 p-1 hover:bg-gray-200 rounded">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              )}
            </button>
          )}
          
          <Icon className={cn(
            "w-4 h-4 mr-2",
            node.type === 'provider' && "text-blue-600",
            node.type === 'province' && "text-green-600",
            node.type === 'district' && "text-purple-600",
            node.type === 'date' && "text-orange-600",
            node.type === 'format' && "text-red-600",
            node.type === 'file' && "text-gray-600"
          )} />
          
          <span className="flex-1 text-sm font-medium text-gray-900">
            {node.name}
          </span>
          
          {node.count && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {node.count}
            </span>
          )}
        </div>

        {/* Render files if this is a format node */}
        {isExpanded && node.files && (
          <div className="ml-4">
            {node.files.map(file => (
              <div
                key={file.id}
                className={cn(
                  "flex items-center py-2 px-3 hover:bg-gray-50 cursor-pointer rounded-md transition-colors ml-4",
                  selectedFile?.id === file.id && "bg-blue-50 border-l-4 border-blue-500"
                )}
                onClick={() => handleFileSelect(file)}
              >
                <Image className="w-4 h-4 mr-2 text-blue-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)} • {formatDate(file.uploadDate)}
                    {file.metadata?.cloudCover && (
                      <span className="ml-2">• {file.metadata.cloudCover}% cloud</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center space-x-1 ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const downloadUrl = `http://localhost:8000${file.fullUrl}`;
                      window.open(downloadUrl, '_blank');
                      onFileDownload?.(file);
                    }}
                    className="p-1 hover:bg-blue-100 rounded text-blue-600"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Open preview modal - could be implemented later
                      alert('Preview functionality coming soon!');
                    }}
                    className="p-1 hover:bg-green-100 rounded text-green-600"
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFileDelete(file);
                    }}
                    className="p-1 hover:bg-red-100 rounded text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Render children */}
        {isExpanded && node.children && (
          <div>
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Image File Manager</h2>
          <button
            onClick={fetchFileTree}
            disabled={isLoading}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            <span>Refresh</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={fetchFileTree}
              className="mt-2 text-sm text-red-700 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Search and Controls */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('tree')}
              className={cn(
                "p-2 rounded-md",
                viewMode === 'tree' ? "bg-blue-100 text-blue-600" : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-md",
                viewMode === 'grid' ? "bg-blue-100 text-blue-600" : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Tree View */}
        <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">File Hierarchy</h3>
            <div className="space-y-1">
              {treeData.map(node => renderTreeNode(node))}
            </div>
          </div>
        </div>

        {/* Details Panel */}
        <div className="w-1/2 overflow-y-auto">
          <div className="p-4">
            {selectedFile ? (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">File Details</h3>
                
                {/* File Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <Image className="w-8 h-8 text-blue-600 mt-1" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {selectedFile.name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatFileSize(selectedFile.size)} • {selectedFile.format.toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                {selectedFile.metadata && (
                  <div className="space-y-4">
                    <div>
                      <h5 className="text-xs font-medium text-gray-700 mb-2">METADATA</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Resolution:</span>
                          <span className="text-gray-900">{selectedFile.metadata.resolution}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Projection:</span>
                          <span className="text-gray-900">{selectedFile.metadata.projection}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Capture Date:</span>
                          <span className="text-gray-900">{formatDate(selectedFile.captureDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Upload Date:</span>
                          <span className="text-gray-900">{formatDate(selectedFile.uploadDate)}</span>
                        </div>
                        {selectedFile.metadata.cloudCover && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Cloud Cover:</span>
                            <span className="text-gray-900">{selectedFile.metadata.cloudCover}%</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h5 className="text-xs font-medium text-gray-700 mb-2">BANDS</h5>
                      <div className="flex flex-wrap gap-1">
                        {selectedFile.metadata.bands.map(band => (
                          <span
                            key={band}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                          >
                            {band}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => {
                          const downloadUrl = `http://localhost:8000${selectedFile.fullUrl}`;
                          window.open(downloadUrl, '_blank');
                          onFileDownload?.(selectedFile);
                        }}
                        className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </button>
                      <button
                        onClick={() => alert('Preview functionality coming soon!')}
                        className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Preview</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">No file selected</h3>
                <p className="text-sm text-gray-500">
                  Select a file from the tree to view details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Upload Buttons */}
      <div className="fixed bottom-6 right-6 z-10 flex flex-col space-y-3">
        {/* Advanced Upload Button */}
        <button
          onClick={() => setShowAdvancedUpload(true)}
          className="flex items-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-colors"
          title="Advanced Upload with AI"
        >
          <Zap className="w-5 h-5" />
          <span className="hidden sm:inline">AI Upload</span>
        </button>
        
        {/* Enhanced Geospatial Upload Button */}
        <button
          onClick={() => setShowEnhancedUpload(true)}
          className="flex items-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-colors"
          title="Enhanced Geospatial Data Upload"
        >
          <Database className="w-5 h-5" />
          <span className="hidden sm:inline">Geospatial</span>
        </button>
        
        {/* Quick Upload Button */}
        <button
          onClick={() => {
            // Create file input and trigger click
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = '.tif,.tiff,.jpg,.jpeg,.png,.hdf,.h5,.nc,.jp2,.zip,.tar.gz';
            input.onchange = async (e) => {
              const files = (e.target as HTMLInputElement).files;
              if (files && files.length > 0) {
                await handleFileUpload(Array.from(files));
              }
            };
            input.click();
          }}
          className="flex items-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-colors"
          title="Quick Upload"
        >
          <Upload className="w-5 h-5" />
          <span className="hidden sm:inline">Quick</span>
        </button>
      </div>

      {/* Advanced Upload Form Modal */}
      {showAdvancedUpload && (
        <AdvancedUploadForm
          onUploadComplete={(files) => {
            setShowAdvancedUpload(false);
            fetchFileTree(); // Refresh the file tree
            alert(`Successfully uploaded ${files.length} file(s) with AI metadata extraction`);
          }}
          onClose={() => setShowAdvancedUpload(false)}
        />
      )}

      {/* Enhanced Geospatial Upload Form Modal */}
      {showEnhancedUpload && (
        <EnhancedUploadForm
          onUploadComplete={(result: UploadResult) => {
            setShowEnhancedUpload(false);
            fetchFileTree(); // Refresh the file tree
            if (result.success) {
              alert(`Successfully processed ${result.processedFiles?.length || 0} geospatial file(s) with comprehensive analysis`);
            } else {
              alert(`Upload failed: ${result.error}`);
            }
          }}
          onClose={() => setShowEnhancedUpload(false)}
        />
      )}
    </div>
  );
};

export default ImageFileManager;