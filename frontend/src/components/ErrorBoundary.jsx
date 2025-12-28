import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    // eslint-disable-next-line no-console
    console.error('UI crashed:', error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="card max-w-xl w-full">
            <h1 className="text-xl font-semibold mb-2">Erreur d’affichage</h1>
            <p className="text-surface-500 mb-4">Une erreur JavaScript empêche cette page de s’afficher.</p>
            <pre className="text-xs bg-surface-50 p-3 rounded-xl overflow-auto border">
              {String(this.state.error?.message || this.state.error)}
            </pre>
            <div className="mt-4 flex gap-2">
              <button className="btn-primary" onClick={() => window.location.reload()}>Recharger</button>
              <button className="btn-secondary" onClick={() => this.setState({ error: null })}>Réessayer</button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
