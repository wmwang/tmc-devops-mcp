import { FluentProvider } from '@fluentui/react-components';
import { defaultTheme } from './theme';
import { ChatWindow } from './components/ChatWindow';
import './App.css';

function App() {
  return (
    <FluentProvider theme={defaultTheme}>
      <div className="app-container">
        <ChatWindow />
      </div>
    </FluentProvider>
  );
}

export default App;
