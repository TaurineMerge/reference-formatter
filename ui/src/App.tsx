import Layout from './components/layout/layout';
import { AppContext } from './context';
import InputPage from './pages/input-page';

function App() {
  return (
    <AppContext>
      <Layout>
        <InputPage />
      </Layout>
    </AppContext>
  );
}

export default App;
