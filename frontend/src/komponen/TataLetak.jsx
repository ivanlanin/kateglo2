/**
 * @fileoverview Tata letak utama dengan Navbar dan konten
 */

import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

function TataLetak() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <footer className="border-t border-gray-200 bg-white mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-500">
          <p>
            <strong>Kateglo</strong> — Kamus, Tesaurus, dan Glosarium Bahasa Indonesia
          </p>
          <p className="mt-1">
            Dilisensikan di bawah{' '}
            <a
              href="https://creativecommons.org/licenses/by-nc-sa/3.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              CC BY-NC-SA 3.0
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default TataLetak;
