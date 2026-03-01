/**
 * @fileoverview Halaman redaksi untuk pengaturan kata harian Susun Kata
 */

import { useEffect, useMemo, useState } from 'react';
import TataLetak from '../../komponen/bersama/TataLetak';
import {
  BarisFilterCariAdmin,
  getApiErrorMessage,
  TabelAdmin,
  TombolAksiAdmin,
  validateRequiredFields,
} from '../../komponen/redaksi/KomponenAdmin';
import PanelGeser from '../../komponen/redaksi/PanelGeser';
import {
  FormFooter,
  InputField,
  PesanForm,
  TextareaField,
  useFormPanel,
} from '../../komponen/redaksi/FormulirAdmin';
import {
  useBuatSusunKataHarianAdmin,
  useDetailSusunKataHarianAdmin,
  useSimpanSusunKataHarianAdmin,
  useSusunKataHarianAdmin,
} from '../../api/apiAdmin';
import { formatLocalDateTime } from '../../utils/formatUtils';

function tanggalHariIni() {
  const sekarang = new Date();
  const tahun = sekarang.getFullYear();
  const bulan = String(sekarang.getMonth() + 1).padStart(2, '0');
  const tanggal = String(sekarang.getDate()).padStart(2, '0');
  return `${tahun}-${bulan}-${tanggal}`;
}

const nilaiAwal = {
  tanggal: tanggalHariIni(),
  panjang: '5',
  kata: '',
  keterangan: '',
};

const kolom = [
  { key: 'tanggal', label: 'Tanggal' },
  { key: 'panjang', label: 'Panjang' },
  { key: 'kata', label: 'Kata', render: (item) => String(item.kata || '').toUpperCase() },
  { key: 'jumlahPeserta', label: 'Peserta', render: (item) => Number(item.jumlahPeserta) || 0 },
];

function SusunKataAdmin() {
  const [cariTanggal, setCariTanggal] = useState(tanggalHariIni());
  const [tanggalQuery, setTanggalQuery] = useState(tanggalHariIni());
  const [panjangDraft, setPanjangDraft] = useState('');
  const [panjang, setPanjang] = useState('');
  const [selected, setSelected] = useState({ tanggal: '', panjang: '' });
  const [pesan, setPesan] = useState({ error: '', sukses: '' });

  const panel = useFormPanel(nilaiAwal);
  const panelTerbuka = panel.buka;
  const setPanelData = panel.setData;

  const { data, isLoading, isError } = useSusunKataHarianAdmin({
    tanggal: tanggalQuery,
    panjang,
  });
  const { data: detailResp } = useDetailSusunKataHarianAdmin(selected);
  const simpan = useSimpanSusunKataHarianAdmin();
  const buatHarian = useBuatSusunKataHarianAdmin();

  const dataTabel = useMemo(
    () => (Array.isArray(data?.data) ? data.data : []),
    [data?.data]
  );
  const detail = detailResp?.data || null;
  const daftarPeserta = useMemo(
    () => (Array.isArray(detail?.peserta) ? detail.peserta : []),
    [detail?.peserta]
  );

  useEffect(() => {
    if (!detail) return;

    if (panelTerbuka) {
      setPanelData({
        tanggal: String(detail.tanggal || selected.tanggal || tanggalQuery),
        panjang: String(detail.panjang || selected.panjang || 5),
        kata: String(detail.kata || ''),
        keterangan: String(detail.keterangan || ''),
      });
    }
  }, [detail, panelTerbuka, selected.tanggal, selected.panjang, setPanelData, tanggalQuery]);

  const bukaPanel = (item = null) => {
    setPesan({ error: '', sukses: '' });
    if (item?.tanggal && item?.panjang) {
      setSelected({
        tanggal: String(item.tanggal || ''),
        panjang: String(item.panjang || ''),
      });
      panel.bukaUntukSunting({
        tanggal: String(item.tanggal || ''),
        panjang: String(item.panjang || ''),
        kata: String(item.kata || ''),
        keterangan: String(item.keterangan || ''),
      });
      return;
    }

    setSelected({ tanggal: '', panjang: '' });
    panel.bukaUntukTambah();
    panel.setData({
      tanggal: tanggalQuery || tanggalHariIni(),
      panjang: String(panjang || 5),
      kata: '',
      keterangan: '',
    });
  };

  const tutupPanel = () => {
    setPesan({ error: '', sukses: '' });
    panel.tutup();
  };

  const handleSimpan = () => {
    setPesan({ error: '', sukses: '' });

    const pesanValidasi = validateRequiredFields(panel.data, [
      { name: 'tanggal', label: 'Tanggal' },
      { name: 'kata', label: 'Kata' },
    ]);

    if (pesanValidasi) {
      setPesan({ error: pesanValidasi, sukses: '' });
      return;
    }

    const panjangAman = Number.parseInt(panel.data.panjang, 10) || 5;
    const kataAman = String(panel.data.kata || '').trim().toLowerCase();

    if (kataAman.length !== panjangAman) {
      setPesan({ error: `Kata harus ${panjangAman} huruf`, sukses: '' });
      return;
    }

    simpan.mutate(
      {
        tanggal: String(panel.data.tanggal || '').trim(),
        panjang: panjangAman,
        kata: kataAman,
        keterangan: String(panel.data.keterangan || '').trim(),
      },
      {
        onSuccess: () => {
          setPesan({ error: '', sukses: 'Kata harian berhasil disimpan.' });
          setTanggalQuery(String(panel.data.tanggal || '').trim() || tanggalQuery);
          setPanjang(panjangAman);
          setCariTanggal(String(panel.data.tanggal || '').trim() || tanggalQuery);
          setPanjangDraft(String(panjangAman));
        },
        onError: (error) => {
          setPesan({ error: getApiErrorMessage(error, 'Gagal menyimpan kata harian.'), sukses: '' });
        },
      }
    );
  };

  const handleCari = () => {
    const tanggalAman = String(cariTanggal || '').trim();
    setTanggalQuery(tanggalAman);
    setPanjang(String(panjangDraft || '').trim());
  };

  const handleReset = () => {
    setCariTanggal('');
    setTanggalQuery('');
    setPanjangDraft('');
    setPanjang('');
  };

  const handleBuatKataHarian = () => {
    setPesan({ error: '', sukses: '' });
    const tanggalAman = String(cariTanggal || tanggalQuery || tanggalHariIni()).trim();
    const panjangAman = String(panjangDraft || '').trim();

    buatHarian.mutate(
      {
        tanggal: tanggalAman,
        panjang: panjangAman,
      },
      {
        onSuccess: () => {
          setTanggalQuery(tanggalAman);
          setPanjang(panjangAman);
          setPesan({ error: '', sukses: 'Kata harian berhasil dibuat.' });
        },
        onError: (error) => {
          setPesan({ error: getApiErrorMessage(error, 'Gagal membuat kata harian.'), sukses: '' });
        },
      }
    );
  };

  return (
    <TataLetak mode="admin" judul="Susun Kata" aksiJudul={<TombolAksiAdmin onClick={handleBuatKataHarian} label={buatHarian.isPending ? 'Membuat …' : 'Buat Kata Harian'} />}>
      <BarisFilterCariAdmin
        nilai={cariTanggal}
        onChange={setCariTanggal}
        onCari={handleCari}
        onHapus={handleReset}
        placeholder="Tanggal (YYYY-MM-DD)"
        filters={[
          {
            key: 'panjang',
            value: panjangDraft,
            onChange: setPanjangDraft,
            options: [
              { value: '', label: '—Panjang—' },
              ...[4, 5, 6, 7, 8].map((item) => ({ value: String(item), label: `${item} huruf` })),
            ],
            ariaLabel: 'Filter panjang kata harian',
          },
        ]}
      />

      <TabelAdmin
        kolom={kolom}
        data={dataTabel}
        isLoading={isLoading}
        isError={isError}
        total={dataTabel.length}
        limit={50}
        offset={0}
        onOffset={() => {}}
        onKlikBaris={bukaPanel}
      />

      {!panel.buka && (pesan.error || pesan.sukses) ? <PesanForm error={pesan.error} sukses={pesan.sukses} /> : null}

      <PanelGeser buka={panel.buka} onTutup={tutupPanel} judul="Sunting Susun Kata">
        <PesanForm error={pesan.error} sukses={pesan.sukses} />
        <InputField label="Tanggal" name="tanggal" value={panel.data.tanggal} onChange={panel.ubahField} required />
        <InputField label="Panjang" name="panjang" value={panel.data.panjang} onChange={panel.ubahField} required />
        <InputField
          label="Kata"
          name="kata"
          value={panel.data.kata}
          onChange={(field, value) => panel.ubahField(field, String(value || '').replace(/[^a-zA-Z]/g, '').toLowerCase())}
          required
        />
        <TextareaField label="Keterangan" name="keterangan" value={panel.data.keterangan} onChange={panel.ubahField} rows={3} />

        <FormFooter
          onSimpan={handleSimpan}
          onBatal={tutupPanel}
          isPending={simpan.isPending}
          modeTambah={false}
        />

        <section className="mt-4 border-t border-gray-200 pt-4 dark:border-dark-border">
          <h4 className="mb-2 text-sm font-semibold text-gray-700 dark:text-dark-text">Daftar Peserta ({daftarPeserta.length})</h4>
          {daftarPeserta.length ? (
            <ul className="space-y-2">
              {daftarPeserta.map((item, index) => (
                <li key={`${item.pengguna_id}-${index}`} className="rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-dark-border">
                  <div className="font-medium text-gray-900 dark:text-dark-text">{item.nama}</div>
                  <div className="text-gray-600 dark:text-dark-text-muted">{item.skor} poin, {item.detik} detik, {item.percobaan} percobaan</div>
                  <div className="text-gray-600 dark:text-dark-text-muted">{formatLocalDateTime(item.created_at)}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-600 dark:text-dark-text-muted">Belum ada peserta untuk kata harian ini.</p>
          )}
        </section>
      </PanelGeser>
    </TataLetak>
  );
}

export default SusunKataAdmin;
