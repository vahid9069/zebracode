import { Component, createElement } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Omni AI Suite] Page Rendering Crash Caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '30px', textAlign: 'center', background: '#fff', borderRadius: '4px', border: '1px solid #c3c4c7', margin: '20px 0' }}>
          <h3 style={{ color: '#d63638', marginBottom: '10px' }}>
            {__('⚠️ An error occurred while rendering this view.', 'omni-ai-suite')}
          </h3>
          <p style={{ color: '#646970', fontSize: '13px', maxWidth: '600px', margin: '0 auto 16px' }}>
            {this.state.error?.message || __('Unknown view rendering error.', 'omni-ai-suite')}
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              if (window.location.hash) {
                window.location.reload();
              }
            }}
          >
            {__('Try Again / Reload', 'omni-ai-suite')}
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
