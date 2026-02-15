import Layout from './components/layout/layout';
import { AppContext } from './context';

function App() {
  return (
    <AppContext>
      <Layout></Layout>
    </AppContext>
  );
}

export default App;
