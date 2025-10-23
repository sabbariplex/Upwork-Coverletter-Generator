import React from 'react';
import { createRoot } from 'react-dom/client';
import Subscription from './Subscription';
import './styles.css';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<Subscription />);
