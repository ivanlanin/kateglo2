function Home() {
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
          <div className="relative">
            <input
              type="text"
              placeholder="Cari kata..."
              className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <button className="absolute right-2 top-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Cari
            </button>
          </div>
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
