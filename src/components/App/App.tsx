import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppRootProps } from '@grafana/data';
import { ROUTES } from '../../constants';

const ChatPage = React.lazy(() => import('../../pages/ChatPage'));

function App(props: AppRootProps) {
  return (
    <Routes>
      <Route path="*" element={<ChatPage />} />
      <Route path={ROUTES.Chat} element={<ChatPage />} />
    </Routes>
  );
}

export default App;
