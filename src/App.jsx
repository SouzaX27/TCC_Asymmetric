// src/App.jsx
import Layout from './layouts/Layout';
import Home from './pages/Home/Home';

function App() {
  return (
    // O Layout protege a estrutura e a Home entra como 'children'
    <Layout>
      <Home />
    </Layout>
  );
}

export default App;