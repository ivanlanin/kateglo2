/**
 * @fileoverview Form pencarian sederhana untuk halaman admin
 */

function KotakCariAdmin({ nilai, onChange, onCari, onHapus, placeholder = 'Cari …' }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    onCari(nilai);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 flex gap-2">
      <input
        type="text"
        value={nilai}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-bg-input dark:text-white focus:outline-none focus:border-blue-500"
      />
      <button
        type="submit"
        className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
      >
        Cari
      </button>
      {nilai && (
        <button
          type="button"
          onClick={onHapus}
          className="px-3 py-2 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg text-sm"
        >
          ✕
        </button>
      )}
    </form>
  );
}

export default KotakCariAdmin;