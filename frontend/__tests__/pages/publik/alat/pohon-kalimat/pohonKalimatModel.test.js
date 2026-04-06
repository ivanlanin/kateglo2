import { describe, expect, it } from 'vitest';
import {
  CONTOH,
  buatKlausaAnak,
  buatKonstituen,
  buatKlausa,
  buatPohon,
  buatStateAwal,
  buatStateMajemuk,
  buatStateTunggal,
} from '../../../../../src/pages/publik/alat/pohon-kalimat/pohonKalimatModel';

describe('pohonKalimatModel', () => {
  it('membuat state awal dengan satu klausa', () => {
    const awal = buatStateAwal();

    expect(awal.segmen).toHaveLength(1);
    expect(awal.segmen[0].tipe).toBe('klausa');
    expect(awal.segmen[0].konstituen).toHaveLength(2);
    expect(awal.segmen[0].konstituen[0].id).not.toBe(awal.segmen[0].konstituen[1].id);

    const majemuk = buatStateMajemuk();
    expect(majemuk.segmen.filter((segmen) => segmen.tipe === 'klausa')).toHaveLength(2);
    expect(majemuk.segmen.filter((segmen) => segmen.tipe === 'konjungsi')).toHaveLength(1);

    const tunggal = buatStateTunggal();
    expect(tunggal.segmen).toHaveLength(1);

    const klausaAnak = buatKlausaAnak();
    expect(klausaAnak.label).toBe('Klausa Subordinatif');
    expect(klausaAnak.konstituen).toHaveLength(2);
  });

  it('single klausa renders flat like tunggal', () => {
    const state = {
      segmen: [
        {
          tipe: 'klausa', ...buatKlausa('Klausa'),
          konstituen: [
            buatKonstituen({ peran: 'S', jenisFrasa: 'FN', teks: 'Pancasila' }),
            buatKonstituen({ peran: 'P', jenisFrasa: 'FV', teks: 'berkembang' }),
          ],
        },
      ],
    };

    const root = buatPohon(state);
    expect(root.label).toBe('Kalimat');
    expect(root.anak).toHaveLength(2);
    expect(root.anak[0].label).toBe('S');
    expect(root.anak[0].anak[0].label).toBe('FN');
    expect(root.anak[0].anak[0].anak[0].label).toBe('Pancasila');
  });

  it('legacy tunggal format masih didukung', () => {
    const rootTunggal = buatPohon({
      jenis: 'tunggal',
      konstituen: [
        buatKonstituen({ peran: 'S', jenisFrasa: 'FN', teks: 'Pancasila' }),
        buatKonstituen({ peran: 'P', jenisFrasa: 'FV', teks: 'berkembang' }),
      ],
    });

    expect(rootTunggal.label).toBe('Kalimat');
    expect(rootTunggal.anak).toHaveLength(2);
    expect(rootTunggal.anak[0].label).toBe('S');

    const rootDenganKlausaUtama = buatPohon({
      jenis: 'tunggal',
      klausaUtama: true,
      konstituen: [
        buatKonstituen({ peran: 'S', jenisFrasa: 'FN', teks: 'Pancasila' }),
        buatKonstituen({ peran: 'P', jenisFrasa: 'FV', teks: 'berkembang' }),
      ],
    });

    expect(rootDenganKlausaUtama.anak[0].label).toBe('Klausa Utama');
    expect(rootDenganKlausaUtama.anak[0].anak).toHaveLength(2);
  });

  it('membentuk pohon majemuk dari contoh', () => {
    const rootMajemuk = buatPohon(CONTOH[1].state, false);
    expect(rootMajemuk.label).toBe('Kalimat');
    expect(rootMajemuk.anak).toHaveLength(3);
    expect(rootMajemuk.anak[0].label).toBe('Klausa Utama');
    expect(rootMajemuk.anak[1].label).toBe('Konj');
    expect(rootMajemuk.anak[1].anak[0].anak[0].anak[0].label).toBe('dan');
    expect(rootMajemuk.anak[2].label).toBe('Klausa Utama');
  });

  it('mendukung konstituen berklausa, konjungsi kosong, dan frasa langsung', () => {
    const state = {
      segmen: [
        {
          tipe: 'klausa',
          ...buatKlausa('Klausa Utama'),
          konstituen: [
            buatKonstituen({ peran: 'S', jenisFrasa: 'FN', teks: 'Rina' }),
            buatKonstituen({
              peran: 'O',
              jenisFrasa: 'FN',
              teks: '',
              realisasi: 'klausa',
              klausaAnak: buatKlausaAnak('Klausa Subordinatif'),
            }),
          ],
        },
        { tipe: 'konjungsi', id: 'konj-kosong', teks: '   ' },
        {
          tipe: 'klausa',
          id: 'klausa-2',
          label: 'Klausa Utama',
          konstituen: [
            buatKonstituen({ peran: 'Konj', jenisFrasa: '—', teks: 'tetapi' }),
            buatKonstituen({ peran: 'P', jenisFrasa: '—', teks: 'datang' }),
          ],
        },
      ],
    };

    const root = buatPohon(state);
    expect(root.anak[0].anak[1].label).toBe('O');
    expect(root.anak[0].anak[1].anak[0].label).toBe('Klausa Subordinatif');
    expect(root.anak[1].label).toBe('Konj');
    expect(root.anak[1].anak).toHaveLength(0);
    expect(root.anak[2].anak[0].label).toBe('Konj');
    expect(root.anak[2].anak[0].anak[0].anak[0].label).toBe('tetapi');
    expect(root.anak[2].anak[1].label).toBe('P');
    expect(root.anak[2].anak[1].anak[0].label).toBe('datang');
  });

  it('menghasilkan nodus konjungsi kosong ketika konjungsi di dalam klausa belum diisi', () => {
    const root = buatPohon({
      segmen: [
        {
          tipe: 'klausa',
          id: 'klausa-konj-kosong',
          label: 'Klausa Utama',
          konstituen: [
            buatKonstituen({ peran: 'Konj', jenisFrasa: '—', teks: '   ' }),
            buatKonstituen({ peran: 'P', jenisFrasa: 'FV', teks: 'hadir' }),
          ],
        },
      ],
    });

    expect(root.anak[0].label).toBe('Konj');
    expect(root.anak[0].anak).toHaveLength(0);
  });

  it('menghasilkan warna netral saat mode tidak berwarna dipakai', () => {
    const root = buatPohon({
      segmen: [
        {
          tipe: 'klausa',
          id: 'klausa-netral',
          label: 'Klausa Utama',
          konstituen: [
            buatKonstituen({ peran: 'S', jenisFrasa: 'FN', teks: 'Rina' }),
            buatKonstituen({ peran: 'X', jenisFrasa: 'FV', teks: 'hadir' }),
          ],
        },
      ],
    }, false);

    expect(root.anak[0].warna).toBe('#111827');
    expect(root.anak[0].anak[0].warna).toBe('#111827');
    expect(root.anak[1].warna).toBe('#111827');
    expect(root.anak[1].anak[0].warna).toBe('#111827');
  });

  it('menggunakan fallback warna netral untuk peran yang tidak dikenal saat mode berwarna aktif', () => {
    const root = buatPohon({
      segmen: [
        {
          tipe: 'klausa',
          id: 'klausa-asing',
          label: 'Klausa Utama',
          konstituen: [
            buatKonstituen({ peran: 'X', jenisFrasa: 'FN', teks: 'Rina' }),
            buatKonstituen({ peran: 'P', jenisFrasa: 'FV', teks: 'hadir' }),
          ],
        },
      ],
    }, true);

    expect(root.anak[0].warna).toBe('#111827');
    expect(root.anak[1].warna).toBe('#16a34a');
  });
});
