/**
 * @fileoverview Halaman admin etimologi — daftar, cari, tambah, sunting, hapus etimologi
 */

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  useDaftarEtimologiAdmin,
  useDetailEtimologiAdmin,
  useAutocompleteEntriEtimologi,
  useSimpanEtimologi,
  useHapusEtimologi,
  useOpsiBahasaEtimologiAdmin,
  useOpsiSumberAdmin,
} from '../../../api/apiAdmin';
import HalamanAdmin from '../../../components/redaksi/HalamanAdmin';
import { useAuth } from '../../../context/authContext';
import {
  BarisFilterCariAdmin,
  TombolAksiAdmin,
  TabelAdmin,
  BadgeStatus,
  BadgeMeragukan,
  opsiFilterStatusAktif,
  opsiFilterMeragukan,
  getApiErrorMessage,
  potongTeks,
  usePencarianAdmin,
  validateRequiredFields,
} from '../../../components/redaksi/KomponenAdmin';
import PanelGeser from '../../../components/redaksi/PanelGeser';
import {
  useFormPanel,
  InputField,
  SearchableSelectField,
  ToggleAktif,
  ToggleMeragukan,
  FormFooter,
  PesanForm,
} from '../../../components/redaksi/FormulirAdmin';
import { buatPathDetailKamus, parsePositiveIntegerParam } from '../../../utils/paramUtils';
import { ambilDaftarLookup, mapOpsiIdNama } from '../../../utils/opsiUtils';

const nilaiAwal = {
  indeks: '',
  homonim: '',
  lafal: '',
  bahasa_id: '',
  kata_asal: '',
  arti_asal: '',
  sumber_id: '',
  sumber_definisi: '',
  sumber_sitasi: '',
  sumber_isi: '',
  sumber_aksara: '',
  sumber_lihat: '',
  sumber_varian: '',
  entri_id: '',
  entri_teks: '',
  aktif: false,
  meragukan: false,
};

const kolom = [
  {
    key: 'indeks',
    label: 'Indeks',
    render: (item) => <span className="font-medium text-gray-800 dark:text-gray-100">{item.indeks}</span>,
  },
  {
    key: 'entri_teks',
    label: 'Entri',
    render: (item) => {
      const target = item.entri_indeks || item.entri_teks;
      if (!item.entri_teks || !target) {
        return <span className="text-gray-600 dark:text-gray-400">—</span>;
      }

      return (
        <Link
          to={buatPathDetailKamus(target)}
          className="text-blue-600 hover:underline dark:text-blue-400"
          onClick={(event) => event.stopPropagation()}
        >
          {item.entri_teks}
        </Link>
      );
    },
  },
  {
    key: 'bahasa',
    label: 'Bahasa',
    render: (item) => <span className="text-gray-600 dark:text-gray-400">{item.bahasa || '—'}</span>,
  },
  {
    key: 'kata_asal',
    label: 'Kata',
    render: (item) => <span className="text-gray-600 dark:text-gray-400">{potongTeks(item.kata_asal, 70)}</span>,
  },
  {
    key: 'sumber_definisi',
    label: 'Definisi',
    render: (item) => <span className="text-gray-600 dark:text-gray-400">{potongTeks(item.sumber_definisi, 100)}</span>,
  },
  {
    key: 'sumber_lihat',
    label: 'Lihat',
    render: (item) => <span className="text-gray-600 dark:text-gray-400">{potongTeks(item.sumber_lihat, 60)}</span>,
  },
  {
    key: 'aktif',
    label: 'Status',
    render: (item) => <BadgeStatus aktif={Boolean(item.aktif)} />,
  },
  {
    key: 'meragukan',
    label: 'Meragukan',
    render: (item) => <BadgeMeragukan meragukan={Boolean(item.meragukan)} />,
  },
];

function EtimologiAdmin() {
  const { punyaIzin } = useAuth();
  const navigate = useNavigate();
  const { id: idParam } = useParams();
  const { cari, setCari, q, offset, setOffset, kirimCari, hapusCari, limit, currentPage, cursor, direction, lastPage } =
    usePencarianAdmin(50);
  const idDariPath = parsePositiveIntegerParam(idParam);
  const idEditTerbuka = useRef(null);
  const sedangMenutupDariPath = useRef(false);
  const bisaKelola = punyaIzin('kelola_etimologi');

  const [draftFilterBahasa, setDraftFilterBahasa] = useState('');
  const [draftFilterSumber, setDraftFilterSumber] = useState('');
  const [draftFilterAktif, setDraftFilterAktif] = useState('');
  const [draftFilterMeragukan, setDraftFilterMeragukan] = useState('');
  const [filterBahasa, setFilterBahasa] = useState('');
  const [filterSumber, setFilterSumber] = useState('');
  const [filterAktif, setFilterAktif] = useState('');
  const [filterMeragukan, setFilterMeragukan] = useState('');

  const { data: resp, isLoading, isError } = useDaftarEtimologiAdmin({
    limit,
    cursor,
    direction,
    lastPage,
    q,
    bahasaId: filterBahasa === '__KOSONG__' ? '' : filterBahasa,
    bahasa: filterBahasa === '__KOSONG__' ? '__KOSONG__' : '',
    sumberId: filterSumber,
    aktif: filterAktif,
    meragukan: filterMeragukan,
  });
  const { data: detailResp, isLoading: isDetailLoading, isError: isDetailError } = useDetailEtimologiAdmin(idDariPath);

  const daftar = resp?.data || [];
  const total = resp?.total || 0;

  const { data: bahasaResp } = useOpsiBahasaEtimologiAdmin();
  const { data: sumberResp } = useOpsiSumberAdmin({ etimologi: '1' });
  const daftarBahasa = ambilDaftarLookup(bahasaResp);
  const daftarSumber = ambilDaftarLookup(sumberResp);
  const opsiBahasaFormEtimologi = [
    { value: '', label: 'Pilih bahasa' },
    ...mapOpsiIdNama(daftarBahasa),
  ];
  const opsiBahasaFilterEtimologi = [
    { value: '', label: '—Bahasa—' },
    { value: '__KOSONG__', label: '—Kosong—' },
    ...mapOpsiIdNama(daftarBahasa),
  ];
  const opsiSumber = mapOpsiIdNama(daftarSumber);

  const panel = useFormPanel(nilaiAwal);
  const simpan = useSimpanEtimologi();
  const hapus = useHapusEtimologi();
  const [inputEntri, setInputEntri] = useState('');
  const [tampilSaranEntri, setTampilSaranEntri] = useState(false);

  const { data: respSaranEntri, isLoading: isSaranEntriLoading } = useAutocompleteEntriEtimologi({
    q: inputEntri,
  });
  const daftarSaranEntri = respSaranEntri?.data || [];

  const [pesan, setPesan] = useState({ error: '', sukses: '' });

  useEffect(() => {
    if (!idParam) return;
    if (idDariPath) return;
    setPesan({ error: 'ID etimologi tidak valid.', sukses: '' });
    navigate('/redaksi/etimologi', { replace: true });
  }, [idParam, idDariPath, navigate]);

  useEffect(() => {
    if (!bisaKelola) return;
    if (sedangMenutupDariPath.current) return;
    if (!idDariPath || isDetailLoading || isDetailError) return;
    const detail = detailResp?.data;
    if (!detail?.id) return;
    if (idEditTerbuka.current === detail.id) return;
    panel.bukaUntukSunting({ ...nilaiAwal, ...detail });
    idEditTerbuka.current = detail.id;
  }, [bisaKelola, detailResp, idDariPath, isDetailError, isDetailLoading, panel]);

  useEffect(() => {
    if (!idDariPath || bisaKelola) return;
    navigate('/redaksi/etimologi', { replace: true });
  }, [bisaKelola, idDariPath, navigate]);

  useEffect(() => {
    if (idDariPath) return;
    sedangMenutupDariPath.current = false;
    idEditTerbuka.current = null;
  }, [idDariPath]);

  useEffect(() => {
    if (!panel.buka) {
      setInputEntri('');
      setTampilSaranEntri(false);
      return;
    }

    if (panel.data.entri_teks) {
      setInputEntri(panel.data.entri_teks);
      return;
    }

    if (!panel.data.entri_id) {
      setInputEntri('');
    }
  }, [panel.buka, panel.data.entri_id, panel.data.entri_teks]);

  useEffect(() => {
    if (!idDariPath || isDetailLoading || !isDetailError) return;
    setPesan({ error: 'Etimologi tidak ditemukan.', sukses: '' });
    navigate('/redaksi/etimologi', { replace: true });
  }, [idDariPath, isDetailError, isDetailLoading, navigate]);

  const tutupPanel = () => {
    setPesan({ error: '', sukses: '' });
    panel.tutup();
    if (idDariPath) {
      sedangMenutupDariPath.current = true;
      navigate('/redaksi/etimologi', { replace: true });
    }
  };

  const bukaTambah = () => {
    setPesan({ error: '', sukses: '' });
    if (idDariPath) {
      sedangMenutupDariPath.current = true;
      navigate('/redaksi/etimologi', { replace: true });
    }
    panel.bukaUntukTambah();
    panel.ubahField('aktif', false);
  };

  const bukaSuntingDariDaftar = (item) => {
    setPesan({ error: '', sukses: '' });
    if (!item?.id) return;
    navigate(`/redaksi/etimologi/${item.id}`);
  };

  const handleSimpan = () => {
    setPesan({ error: '', sukses: '' });
    const pesanValidasi = validateRequiredFields(panel.data, [
      { name: 'indeks', label: 'Indeks' },
      { name: 'sumber_id', label: 'Sumber' },
    ]);
    if (pesanValidasi) {
      setPesan({ error: pesanValidasi, sukses: '' });
      return;
    }

    const payload = {
      ...panel.data,
      bahasa_id: panel.data.bahasa_id ? Number(panel.data.bahasa_id) : null,
    };

    simpan.mutate(payload, {
      onSuccess: () => {
        setPesan({ error: '', sukses: 'Tersimpan!' });
        setTimeout(() => tutupPanel(), 600);
      },
      onError: (err) => setPesan({ error: getApiErrorMessage(err, 'Gagal menyimpan etimologi'), sukses: '' }),
    });
  };

  const pilihEntri = (item) => {
    panel.ubahField('entri_id', item.id);
    panel.ubahField('entri_teks', item.entri);
    setInputEntri(item.entri);
    setTampilSaranEntri(false);
  };

  const handleUbahInputEntri = (value) => {
    setInputEntri(value);
    setTampilSaranEntri(true);
    const trimmed = String(value).trim();
    const entriAktif = panel.data.entri_teks || '';

    if (!trimmed || (entriAktif && trimmed !== entriAktif)) {
      panel.ubahField('entri_id', '');
      panel.ubahField('entri_teks', '');
    }
  };

  const handleHapus = () => {
    if (!confirm('Yakin ingin menghapus entri etimologi ini?')) return;
    hapus.mutate(panel.data.id, {
      onSuccess: () => tutupPanel(),
      onError: (err) => setPesan({ error: getApiErrorMessage(err, 'Gagal menghapus etimologi'), sukses: '' }),
    });
  };

  const handleResetFilter = () => {
    hapusCari();
    setDraftFilterBahasa('');
    setDraftFilterSumber('');
    setDraftFilterAktif('');
    setDraftFilterMeragukan('');
    setFilterBahasa('');
    setFilterSumber('');
    setFilterAktif('');
    setFilterMeragukan('');
  };

  const handleCari = () => {
    setFilterBahasa(draftFilterBahasa);
    setFilterSumber(draftFilterSumber);
    setFilterAktif(draftFilterAktif);
    setFilterMeragukan(draftFilterMeragukan);
    kirimCari(cari);
  };

  return (
    <HalamanAdmin judul="Etimologi" aksiJudul={bisaKelola ? <TombolAksiAdmin onClick={bukaTambah} /> : null}>
      <BarisFilterCariAdmin
        nilai={cari}
        onChange={setCari}
        onCari={handleCari}
        onHapus={handleResetFilter}
        placeholder="Cari etimologi …"
        filters={[
          {
            key: 'aktif',
            value: draftFilterAktif,
            onChange: setDraftFilterAktif,
            options: opsiFilterStatusAktif,
            ariaLabel: 'Filter status etimologi',
          },
          {
            key: 'meragukan',
            value: draftFilterMeragukan,
            onChange: setDraftFilterMeragukan,
            options: opsiFilterMeragukan,
            ariaLabel: 'Filter meragukan',
          },
          {
            key: 'bahasa',
            value: draftFilterBahasa,
            onChange: setDraftFilterBahasa,
            options: opsiBahasaFilterEtimologi,
            ariaLabel: 'Filter bahasa',
            searchable: true,
            placeholder: '—Bahasa—',
            searchPlaceholder: 'Cari bahasa…',
          },
          {
            key: 'sumber',
            value: draftFilterSumber,
            onChange: setDraftFilterSumber,
            options: [{ value: '', label: '—Sumber—' }, ...opsiSumber],
            ariaLabel: 'Filter sumber etimologi',
            searchable: true,
            placeholder: '—Sumber—',
            searchPlaceholder: 'Cari sumber…',
          },
        ]}
      />

      <TabelAdmin
        kolom={kolom}
        data={daftar}
        isLoading={isLoading}
        isError={isError}
        total={total}
        limit={limit}
        offset={offset}
        pageInfo={resp?.pageInfo}
        currentPage={currentPage}
        onNavigateCursor={setOffset}
        onKlikBaris={bisaKelola ? bukaSuntingDariDaftar : undefined}
      />

      {bisaKelola && (
        <PanelGeser buka={panel.buka} onTutup={tutupPanel} judul={panel.modeTambah ? 'Tambah Etimologi' : 'Sunting Etimologi'}>
          <PesanForm error={pesan.error} sukses={pesan.sukses} />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <InputField label="Indeks" name="indeks" value={panel.data.indeks} onChange={panel.ubahField} required />
            <InputField
              label="Homonim"
              name="homonim"
              type="text"
              value={panel.data.homonim ?? ''}
              onChange={panel.ubahField}
              placeholder="Contoh: 1"
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="form-admin-group relative">
              <label htmlFor="field-entri-autocomplete" className="form-admin-label">Entri</label>
              <input
                id="field-entri-autocomplete"
                type="text"
                value={inputEntri}
                onChange={(e) => handleUbahInputEntri(e.target.value)}
                onFocus={() => setTampilSaranEntri(true)}
                onBlur={() => setTimeout(() => setTampilSaranEntri(false), 120)}
                placeholder="Cari entri berdasarkan kata/indeks"
                className="form-admin-input"
              />

              {tampilSaranEntri && (
                <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-dark-bg-elevated">
                  {isSaranEntriLoading ? (
                    <p className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Mencari entri …</p>
                  ) : daftarSaranEntri.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Tidak ada entri cocok</p>
                  ) : (
                    daftarSaranEntri.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => pilihEntri(item)}
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-dark-bg"
                      >
                        <span className="font-medium text-gray-800 dark:text-gray-100">{item.entri}</span>
                        <span className="ml-2 text-gray-500 dark:text-gray-400">({item.indeks})</span>
                        <span className="ml-2 text-gray-400 dark:text-gray-500">homonim: {item.homonim ?? '—'}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <SearchableSelectField
              label="Bahasa"
              name="bahasa_id"
              value={String(panel.data.bahasa_id || '')}
              onChange={panel.ubahField}
              options={opsiBahasaFormEtimologi}
              placeholder="Pilih bahasa"
              searchPlaceholder="Cari bahasa…"
            />
            <InputField label="Kata" name="kata_asal" value={panel.data.kata_asal} onChange={panel.ubahField} />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <InputField label="Arti" name="arti_asal" value={panel.data.arti_asal} onChange={panel.ubahField} />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <InputField label="Definisi" name="sumber_definisi" value={panel.data.sumber_definisi} onChange={panel.ubahField} />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <InputField label="Latin" name="sumber_isi" value={panel.data.sumber_isi} onChange={panel.ubahField} />
            <InputField label="Aksara" name="sumber_aksara" value={panel.data.sumber_aksara} onChange={panel.ubahField} />
            <InputField label="Lafal" name="lafal" value={panel.data.lafal} onChange={panel.ubahField} />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <InputField label="Lihat" name="sumber_lihat" value={panel.data.sumber_lihat} onChange={panel.ubahField} />
            <InputField label="Varian" name="sumber_varian" value={panel.data.sumber_varian} onChange={panel.ubahField} />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <InputField label="Sitasi" name="sumber_sitasi" value={panel.data.sumber_sitasi} onChange={panel.ubahField} />
            <SearchableSelectField
              label="Sumber"
              name="sumber_id"
              value={String(panel.data.sumber_id || '')}
              onChange={panel.ubahField}
              options={[{ value: '', label: 'Pilih sumber' }, ...opsiSumber]}
              placeholder="Pilih sumber"
              searchPlaceholder="Cari sumber…"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <ToggleAktif value={Boolean(panel.data.aktif)} onChange={panel.ubahField} />
            <ToggleMeragukan value={Boolean(panel.data.meragukan)} onChange={panel.ubahField} />
          </div>

          <FormFooter
            onSimpan={handleSimpan}
            onBatal={tutupPanel}
            onHapus={handleHapus}
            isPending={simpan.isPending || hapus.isPending}
            modeTambah={panel.modeTambah}
          />
        </PanelGeser>
      )}
    </HalamanAdmin>
  );
}

export default EtimologiAdmin;
