-- Ubah kode dan nama tagar me-/pe- ke meng-/peng- sesuai konvensi KBBI
-- me- adalah alomorf; bentuk kanonik KBBI adalah meng-
-- pe- adalah alomorf; bentuk kanonik KBBI adalah peng-

UPDATE tagar
SET kode = 'meng', nama = 'meng-'
WHERE kode = 'me' AND kategori = 'prefiks';

UPDATE tagar
SET kode = 'peng', nama = 'peng-'
WHERE kode = 'pe' AND kategori = 'prefiks';
