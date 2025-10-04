import React from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Clock, CheckCircle, XCircle, Mail } from 'lucide-react';

/**
 * ApprovalStatusBanner Component
 * 
 * Displays the current approval status to users.
 * Shows different messages based on email verification and approval status.
 */
export const ApprovalStatusBanner: React.FC = () => {
  const { user, isPendingApproval, getAccessLevelMessage } = useAuthContext();

  if (!user) return null;

  const message = getAccessLevelMessage();
  if (!message) return null;

  // Determine banner style based on status
  const getBannerStyle = () => {
    if (!user.emailVerified) {
      return {
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800',
        icon: Mail,
        iconColor: 'text-yellow-600'
      };
    }

    if (isPendingApproval()) {
      return {
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800',
        icon: Clock,
        iconColor: 'text-blue-600'
      };
    }

    if (user.approvalStatus === 'rejected') {
      return {
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        icon: XCircle,
        iconColor: 'text-red-600'
      };
    }

    return {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      icon: CheckCircle,
      iconColor: 'text-green-600'
    };
  };

  const { bgColor, borderColor, textColor, icon: Icon, iconColor } = getBannerStyle();

  const getActionButton = () => {
    if (!user.emailVerified) {
      return (
        <button className="ml-4 px-3 py-1 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700">
          Resend Email
        </button>
      );
    }

    if (user.approvalStatus === 'rejected' && user.rejectionReason) {
      return (
        <details className="ml-4">
          <summary className="cursor-pointer text-sm font-medium underline">
            View Reason
          </summary>
          <div className="mt-2 p-3 bg-white rounded border border-red-200">
            <p className="text-sm text-gray-700">{user.rejectionReason}</p>
          </div>
        </details>
      );
    }

    return null;
  };

  return (
    <div className={`${bgColor} ${borderColor} border-l-4 p-4 mb-6`}>
      <div className="flex items-center">
        <div className="flex">
          <div className="flex-shrink-0">
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <div className="ml-3 flex-1">
            <p className={`text-sm font-medium ${textColor}`}>
              {message}
            </p>
            
            {isPendingApproval() && (
              <div className="mt-2">
                <p className="text-xs text-blue-600">
                  You have access to basic features while waiting for approval. 
                  Full features will be available once your account is approved by an administrator.
                </p>
                <div className="mt-2 text-xs text-blue-600">
                  <strong>Available features:</strong>
                  <ul className="list-disc list-inside mt-1 ml-2">
                    <li>Browse public datasets</li>
                    <li>Basic analytics</li>
                    <li>Download sample data</li>
                    <li>Community support</li>
                  </ul>
                </div>
              </div>
            )}

            {user.approvalStatus === 'rejected' && (
              <div className="mt-2">
                <p className="text-xs text-red-600">
                  Your account application was not approved. Please contact support for more information.
                </p>
              </div>
            )}
          </div>
        </div>
        {getActionButton()}
      </div>
    </div>
  );
};
