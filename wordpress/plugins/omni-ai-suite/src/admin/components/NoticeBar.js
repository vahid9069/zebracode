import { createElement } from '@wordpress/element';
import { Notice } from '@wordpress/components';

export default function NoticeBar({ notice, onDismiss }) {
  if (!notice) return null;

  return (
    <div style={{ marginBottom: '16px' }}>
      <Notice
        status={notice.type || 'info'}
        isDismissible={true}
        onDismiss={onDismiss}
      >
        {notice.message}
      </Notice>
    </div>
  );
}
