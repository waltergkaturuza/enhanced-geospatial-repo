import React from 'react';
import SystemHeader from './system/SystemHeader';
import SystemNavigation from './system/SystemNavigation';
import UploadTab from './system/UploadTab';
import MetadataTab from './system/MetadataTab';
import ProcessingTab from './system/ProcessingTab';
import { DatabaseTab } from './system/DatabaseTab';
import { useSystemState } from '../hooks/useSystemState';
import { useFileUpload } from '../hooks/useFileUpload';
import { useMetadataParser } from '../hooks/useMetadataParser';

const SystemManagementClean: React.FC = () => {
  const { activeTab, setActiveTab } = useSystemState();
  const fileUploadHook = useFileUpload();
  const metadataHook = useMetadataParser();

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'upload':
        return <UploadTab {...fileUploadHook} />;
      case 'metadata':
        return <MetadataTab {...metadataHook} />;
      case 'processing':
        return <ProcessingTab />;
      case 'database':
        return <DatabaseTab />;
      default:
        return <UploadTab {...fileUploadHook} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SystemHeader />
      <SystemNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
      {renderActiveTab()}
    </div>
  );
};

export default SystemManagementClean;
