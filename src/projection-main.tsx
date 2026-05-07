import React from 'react';
import ReactDOM from 'react-dom/client';
import { ProjectionWindow } from './components/ProjectionWindow';
import './index.css';

ReactDOM.createRoot(document.getElementById('projection-root')!).render(
  <React.StrictMode>
    <ProjectionWindow />
  </React.StrictMode>,
);
