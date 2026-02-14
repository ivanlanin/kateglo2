import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDictionaryDetail, searchDictionary } from '../api/publicApi';

function Home() {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [selectedSlug, setSelectedSlug] = useState('');

  const searchQuery = useQuery({
    queryKey: ['dictionary-search', submittedQuery],
    queryFn: () => searchDictionary(submittedQuery),
    enabled: Boolean(submittedQuery),
  });

  const detailQuery = useQuery({
    queryKey: ['dictionary-detail', selectedSlug],
    queryFn: () => getDictionaryDetail(selectedSlug),
    enabled: Boolean(selectedSlug),
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = query.trim();

    if (!trimmed) {
      return;
    }

    setSubmittedQuery(trimmed);
    setSelectedSlug('');
  };

  const results = searchQuery.data?.data || [];

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Kateglo
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Kamus, Tesaurus, dan Glosarium Bahasa Indonesia
        </p>

        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              placeholder="Cari kata..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Cari
            </button>
          </form>

          {searchQuery.isLoading && (
            <p className="mt-4 text-gray-600">Mencari data...</p>
          )}

          {searchQuery.isError && (
            <p className="mt-4 text-red-600">Gagal mengambil data dari API.</p>
          )}

          {submittedQuery && !searchQuery.isLoading && !searchQuery.isError && (
            <div className="mt-6 text-left bg-white border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Hasil pencarian: {submittedQuery}
              </h2>

              {results.length === 0 && (
                <p className="text-gray-600">Tidak ada entri yang ditemukan.</p>
              )}

              {results.length > 0 && (
                <ul className="space-y-3">
                  {results.map((item) => (
                    <li key={item.phrase} className="border-b border-gray-100 pb-3 last:border-b-0">
                      <button
                        type="button"
                        onClick={() => setSelectedSlug(item.phrase)}
                        className="text-blue-700 font-semibold hover:underline"
                      >
                        {item.phrase}
                      </button>
                      {item.lex_class && (
                        <span className="ml-2 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {item.lex_class}
                        </span>
                      )}
                      {item.definition_preview && (
                        <p className="text-gray-700 mt-1">{item.definition_preview}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {selectedSlug && (
            <div className="mt-6 text-left bg-white border border-gray-200 rounded-lg p-4">
              {detailQuery.isLoading && <p className="text-gray-600">Memuat detail...</p>}

              {detailQuery.isError && (
                <p className="text-red-600">Gagal mengambil detail entri.</p>
              )}

              {detailQuery.data && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{detailQuery.data.phrase}</h3>
                  {detailQuery.data.actualPhrase && (
                    <p className="text-sm text-gray-600 mt-1">
                      Bentuk baku: {detailQuery.data.actualPhrase}
                    </p>
                  )}

                  {detailQuery.data.definitions?.length > 0 && (
                    <ol className="mt-3 list-decimal list-inside space-y-1 text-gray-800">
                      {detailQuery.data.definitions.map((definition) => (
                        <li key={definition.def_uid}>{definition.def_text}</li>
                      ))}
                    </ol>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Kamus</h3>
            <p className="text-gray-600">Definisi dan makna kata dalam bahasa Indonesia</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Tesaurus</h3>
            <p className="text-gray-600">Sinonim, antonim, dan relasi kata</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Glosarium</h3>
            <p className="text-gray-600">Istilah teknis dari berbagai bidang</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
