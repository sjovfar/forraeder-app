import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Forræder App:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.clear();
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a090d] text-[#e6dfd1] text-center">
          <div className="max-w-md w-full p-6 rounded-3xl border-2 border-[#d4af37] bg-[#14121a] shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#2a2214] border border-[#d4af37] flex items-center justify-center text-2xl mx-auto shadow-lg">
              🗡️
            </div>
            <h2 className="text-xl font-black font-gothic text-[#f6db7e]">
              Slottets Forbindelse Blev Afbrudt
            </h2>
            <p className="text-xs text-[#c5bca8] leading-relaxed">
              Der opstod en lille uoverensstemmelse i dataene. Tryk på knappen herunder for at genstarte appen:
            </p>
            <button
              onClick={this.handleReset}
              className="w-full py-3.5 rounded-2xl btn-gold text-xs font-black uppercase tracking-widest text-black shadow-lg cursor-pointer"
            >
              Genindlæs & Træd Ind Igen
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
