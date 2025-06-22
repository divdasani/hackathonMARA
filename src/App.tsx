import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Buy } from './pages/Buy';
import { BuyerId } from './pages/BuyerId';
import { Layout } from './components/Layout';
export function App() {
  return <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/buy" element={<Buy />} />
          <Route path="/buyer/:id" element={<BuyerId />} />
        </Routes>
      </Layout>
    </Router>;
}