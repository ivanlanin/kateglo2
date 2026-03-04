/**
 * @fileoverview Halaman redaksi untuk pengaturan kata harian Susun Kata
 */

import { useEffect, useMemo, useState } from 'react';
import TataLetak from '../../komponen/bersama/TataLetak';
import {
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
import { formatBilanganRibuan, formatLocalDateTime } from '../../utils/formatUtils';

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
  { key: 'kata', label: 'Kata', render: (item) => String(item.kata || '').toUpperCase() },
  { key: 'pemenang', label: 'Pemenang' },
  { key: 'jumlahPeserta', label: 'Peserta', align: 'right', render: (item) => formatBilanganRibuan(item.jumlahPeserta) },
  { key: 'persenMenang', label: 'Menang', align: 'right', render: (item) => `${Number(item.persenMenang || 0).toFixed(2)}%` },
];

export function buildPanelDataFromDetail(detail, selectedTanggal, selectedPanjang, tanggalQuery) {
  return {
    tanggal: String(detail?.tanggal || selectedTanggal || tanggalQuery),
    panjang: '5',
    kata: String(detail?.kata || ''),
    keterangan: String(detail?.keterangan || ''),
  };
}

export function buildSelectedFromItem(item) {
  return {
    tanggal: String(item?.tanggal || ''),
    panjang: String(item?.panjang || ''),
  };
}

export function buildSuntingDataFromItem(item) {
  return {
    tanggal: String(item?.tanggal),
    panjang: '5',
    kata: String(item?.kata || ''),
    keterangan: String(item?.keterangan || ''),
  };
}

export function sanitizeKataSusunInput(value) {
  return String(value || '').replace(/[^a-zA-Z]/g, '').toLowerCase();
}

export function buildSimpanPayload(panelData) {
  const panjangAman = 5;
  const kataAman = String(panelData?.kata || '').trim().toLowerCase();
  return {
    payload: {
      tanggal: String(panelData?.tanggal || '').trim(),
      panjang: panjangAman,
      kata: kataAman,
      keterangan: String(panelData?.keterangan || '').trim(),
    },
    panjangAman,
    kataAman,
  };
}

export function resolveTanggalBuatKataHarian(cariTanggal, tanggalQuery) {
  return String(cariTanggal || tanggalQuery || tanggalHariIni()).trim();
}

export function resolveTanggalSimpan(tanggalForm, tanggalQuery) {
  return String(tanggalForm || '').trim() || tanggalQuery;
}

function SusunKataHarian() {
  const [tanggalAcuan, setTanggalAcuan] = useState(tanggalHariIni());
  const [selected, setSelected] = useState({ tanggal: '', panjang: '' });
  const [pesan, setPesan] = useState({ error: '', sukses: '' });

  const panel = useFormPanel(nilaiAwal);
  const panelTerbuka = panel.buka;
  const setPanelData = panel.setData;

  const { data, isLoading, isError } = useSusunKataHarianAdmin();
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
      setPanelData(buildPanelDataFromDetail(detail, selected.tanggal, selected.panjang, tanggalAcuan));
    }
  }, [detail, panelTerbuka, selected.tanggal, selected.panjang, setPanelData, tanggalAcuan]);

  const bukaPanel = (item = null) => {
    setPesan({ error: '', sukses: '' });
    if (item?.tanggal && item?.panjang) {
      setSelected(buildSelectedFromItem(item));
      panel.bukaUntukSunting(buildSuntingDataFromItem(item));
      return;
    }

    setSelected({ tanggal: '', panjang: '' });
    panel.bukaUntukTambah();
    panel.setData({
      tanggal: tanggalAcuan || tanggalHariIni(),
      panjang: '5',
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

    const { payload, panjangAman, kataAman } = buildSimpanPayload(panel.data);

    if (kataAman.length !== panjangAman) {
      setPesan({ error: `Kata harus ${panjangAman} huruf`, sukses: '' });
      return;
    }

    simpan.mutate(
      payload,
      {
        onSuccess: () => {
          setPesan({ error: '', sukses: 'Kata harian berhasil disimpan.' });
          const tanggalSimpan = resolveTanggalSimpan(panel.data.tanggal, tanggalAcuan);
          setTanggalAcuan(tanggalSimpan || tanggalHariIni());
        },
        onError: (error) => {
          setPesan({ error: getApiErrorMessage(error, 'Gagal menyimpan kata harian.'), sukses: '' });
        },
      }
    );
  };

  const handleBuatKataHarian = () => {
    setPesan({ error: '', sukses: '' });
    const tanggalAman = resolveTanggalBuatKataHarian(tanggalAcuan, '');

    buatHarian.mutate(
      {
        tanggal: tanggalAman,
      },
      {
        onSuccess: () => {
          setTanggalAcuan(tanggalAman || tanggalHariIni());
          setPesan({ error: '', sukses: 'Kata harian berhasil dibuat.' });
        },
        onError: (error) => {
          setPesan({ error: getApiErrorMessage(error, 'Gagal membuat kata harian.'), sukses: '' });
        },
      }
    );
  };

  return (
    <TataLetak mode="admin" judul="Susun Kata Harian" aksiJudul={<TombolAksiAdmin onClick={handleBuatKataHarian} label={buatHarian.isPending ? 'Membuat …' : 'Buat Kata Harian'} />}>
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
        <InputField label="Panjang" name="panjang" value={panel.data.panjang} onChange={() => {}} required />
        <InputField
          label="Kata"
          name="kata"
          value={panel.data.kata}
          onChange={(field, value) => panel.ubahField(field, sanitizeKataSusunInput(value))}
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

export default SusunKataHarian;
