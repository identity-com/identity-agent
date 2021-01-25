import React from 'react';

import { Logo } from './icons/Logo';

export const Header = () => (
  <header className="bg-blue-700 text-white">
    <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 flex justify-center">
      <Logo />
    </div>
  </header>
);
